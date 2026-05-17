import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type Staff = Database['public']['Tables']['staff']['Row'];

export interface ConflictReason {
  ruleId: string;
  message: string;
  severity: 'blocking' | 'warning';
}

export interface StaffAvailability {
  staff: Staff;
  isAvailable: boolean;
  conflicts: ConflictReason[];
}

export interface SessionAssignmentResult {
  date: string;
  session: 'morning' | 'afternoon';
  assignments: {
    slotId: number;
    staffCode: string;
    paperId: number;
    period: string;
    type: 'invigilator' | 'standby' | 'tech';
    dutyDate: string;
    dutyType: string;
  }[];
  unfilledSlots: {
    slotId: number;
    paperId: number;
    period: string;
    type: 'invigilator' | 'standby' | 'tech';
    reasons: string[];
  }[];
  summary: {
    totalSlots: number;
    filled: number;
    unfilled: number;
  };
}

export class SchedulerService {
  /**
   * Determine cycle and day of cycle for a given date.
   * Implementation depends on school calendar. Defaulting to a simple 5-day week cycle.
   */
  static getCycleInfo(dateStr: string) {
    const date = new Date(dateStr);
    const day = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    
    // Most schools use 0-4 for Mon-Fri
    // Sunday=0, Monday=1, ..., Saturday=6
    // We want Monday=0, ..., Friday=4
    const dayOfCycle = day >= 1 && day <= 5 ? day - 1 : 0; 
    
    // Cycle determination logic (e.g., Week A/B or Cycle 1/2)
    // For now, using a simple parity check for weeks since a reference point
    // In a real app, this would query a 'school_calendar' or 'settings' table.
    const weekNumber = Math.ceil(date.getDate() / 7); 
    const cycle = weekNumber % 2 === 0 ? 'Cycle 2' : 'Cycle 1';

    return { cycle, dayOfCycle, isWeekend: day === 0 || day === 6 };
  }

  /**
   * Rule-based Availability Engine
   * Answers: "Who is available for this slot and why/why not?"
   */
  static async getStaffAvailabilityForSlot(params: {
    date: string;
    period: string; // e.g., 'P1'
    grade: number;
    venueId?: number;
    paperId?: number;
    slotType?: 'invigilator' | 'standby' | 'tech';
  }): Promise<StaffAvailability[]> {
    const { date, period, grade, paperId, slotType } = params;
    const { cycle, dayOfCycle } = this.getCycleInfo(date);
    const dateObj = new Date(date);
    const isBeforeMay29 = dateObj < new Date('2026-05-29');

    const periodNumber = parseInt(period.replace(/\D/g, ''));

    // 1. Fetch all necessary data in parallel
    const [
      { data: staff },
      { data: leaves },
      { data: teachingTimetable },
      { data: breakDuties },
      { data: existingDuties },
      { data: teacherSubjects },
      { data: paperInfo },
      { data: techAssignments }
    ] = await Promise.all([
      supabase.from('staff').select('*'),
      supabase.from('staff_leaves').select('*').eq('leave_date', date),
      supabase.from('teaching_timetable').select('*').eq('cycle', cycle).eq('day_of_cycle', dayOfCycle).eq('period', periodNumber),
      supabase.from('vw_break_duty').select('*').eq('duty_date', date),
      supabase.from('exam_duties').select('*').eq('duty_date', date),
      supabase.from('teacher_subjects').select('*'),
      paperId ? supabase.from('exam_papers').select('*').eq('id', paperId).single() : Promise.resolve({ data: null }),
      supabase.from('tech_duty_assignment').select('*').eq('duty_date', date)
    ]);

    if (!staff) return [];

    // Map data for fast lookup
    const leaveMap = new Map(leaves?.map(l => [l.staff_code, l]) || []);
    const teachingMap = new Map(teachingTimetable?.map(t => [t.staff_code, t]) || []);
    const breakDutyMap = new Map(breakDuties?.map(b => [b.staff_code, b.break_session]) || []);
    const techAssignmentMap = new Map(techAssignments?.map(t => [t.staff_code, t]) || []);
    const staffSubjectMap = new Map<string, string[]>();
    teacherSubjects?.forEach(ts => {
      if (ts.staff_code && ts.subject_code) {
        const subjects = staffSubjectMap.get(ts.staff_code) || [];
        subjects.push(ts.subject_code);
        staffSubjectMap.set(ts.staff_code, subjects);
      }
    });

    // 2. Evaluate each staff member
    return staff.map(s => {
      const conflicts: ConflictReason[] = [];

      // Rule 1: Leave conflicts
      const leave = leaveMap.get(s.staff_code);
      if (leave) {
        conflicts.push({
          ruleId: 'LEAVE',
          message: `On leave (${leave.reason || (leave.full_day ? 'Full day' : 'Partial day')})`,
          severity: 'blocking'
        });
      }

      // Rule 2: Load = 0
      if ((s.load_percentage || 100) === 0) {
        conflicts.push({
          ruleId: 'LOAD_ZERO',
          message: 'Staff load is set to 0%',
          severity: 'blocking'
        });
      }

      // Rule 3: Gr 8/9 Teaching Conflict (Until 29 May)
      if (isBeforeMay29 && (grade === 8 || grade === 9)) {
        const teaching = teachingMap.get(s.staff_code);
        if (teaching) {
          conflicts.push({
            ruleId: 'TEACHING_89',
            message: `Teaching ${teaching.class_code} in this period (8/9 rule applies until May 29)`,
            severity: 'blocking'
          });
        }
      }

      // Rule 4: Gr 12 Subject Conflict
      if (grade === 12 && paperInfo?.data) {
        const subjects = staffSubjectMap.get(s.staff_code) || [];
        // Check if teacher teaches this subject
        if (subjects.includes(paperInfo.data.subject_id?.toString() || '')) {
          conflicts.push({
            ruleId: 'G12_SUBJECT',
            message: `Teaches paper subject (${paperInfo.data.subject_id}). Cannot invigilate same subject for G12.`,
            severity: 'blocking'
          });
        }
      }

      // Rule 5: SCATTERED role - Consecutive Periods
      if (s.role === 'Scattered') {
        const todayDuties = existingDuties?.filter(d => d.staff_code === s.staff_code) || [];
        const currentPeriodNum = parseInt(period.replace(/\D/g, ''));
        
        const hasConsecutive = todayDuties.some(d => {
          const dPeriodNum = parseInt(d.period_code?.replace(/\D/g, '') || '0');
          return Math.abs(dPeriodNum - currentPeriodNum) === 1;
        });

        if (hasConsecutive) {
          conflicts.push({
            ruleId: 'SCATTERED_CONSECUTIVE',
            message: 'Scattered role cannot perform two consecutive periods',
            severity: 'blocking'
          });
        }
      }

      // Rule 6: Break Duty
      const breakSession = breakDutyMap.get(s.staff_code);
      if (breakSession) {
        const isBPeriod = period === 'B1' || period === 'B2';
        if (breakSession === 'Morning' && isBPeriod) {
          conflicts.push({
            ruleId: 'BREAK_DUTY_MORNING',
            message: 'Has morning break duty. Cannot do B1/B2.',
            severity: 'blocking'
          });
        }
        
        const isAfternoon = period.startsWith('P6') || period.startsWith('P7') || period.startsWith('A');
        if (breakSession === 'Afternoon' && isAfternoon) {
          const isTechAssigned = techAssignmentMap.has(s.staff_code);
          const isTechForPrac = paperInfo?.data?.paper_type === 'Prac' && isTechAssigned;
          
          if (!isTechForPrac) {
            conflicts.push({
              ruleId: 'BREAK_DUTY_AFTERNOON',
              message: 'Has afternoon break duty. Only Tech Duty staff on PRAC papers allowed in afternoon.',
              severity: 'blocking'
            });
          }
        }
      }

      // Rule 7: Already Assigned
      const existing = existingDuties?.find(d => d.staff_code === s.staff_code && d.period_code === period);
      if (existing) {
        conflicts.push({
          ruleId: 'ALREADY_ASSIGNED',
          message: `Already assigned to ${existing.venue_id || 'another slot'} in this period`,
          severity: 'blocking'
        });
      }

      // Rule 8: TECH Duty Block (Full Day)
      // A teacher assigned to TECH duty today is blocked from all other duties
      if (slotType !== 'tech' && techAssignmentMap.has(s.staff_code)) {
        conflicts.push({
          ruleId: 'TECH_DUTY_BLOCK',
          message: 'Assigned to TECH duty today. Blocked from all other duties.',
          severity: 'blocking'
        });
      }

      return {
        staff: s,
        isAvailable: conflicts.length === 0,
        conflicts
      };
    });
  }

  /**
   * Phase 2: Initial Slot Packing (One Session)
   * Fills invigilation slots for a single session while respecting all Phase 1 conflicts.
   */
  static async generateInitialAssignmentsForSession(
    date: string,
    sessionType: 'Morning' | 'Afternoon'
  ): Promise<SessionAssignmentResult> {
    // 1. Fetch ALL unfilled slots for this session (invigilators + standby)
    const { data: slots, error: slotsError } = await (supabase
      .from('exam_duties') as any)
      .select('*')
      .eq('duty_date', date)
      .eq('session_type', sessionType)
      .eq('is_slot', true)
      .is('staff_code', null);

    if (slotsError) throw slotsError;
    if (!slots || slots.length === 0) {
      return {
        date,
        session: sessionType.toLowerCase() as 'morning' | 'afternoon',
        assignments: [],
        unfilledSlots: [],
        summary: { totalSlots: 0, filled: 0, unfilled: 0 }
      };
    }

    const assignments: SessionAssignmentResult['assignments'] = [];
    const unfilledSlots: SessionAssignmentResult['unfilledSlots'] = [];
    
    // To track assignments made *within* this generation pass
    const teachersAssignedInSession = new Map<string, string[]>(); // staff_code -> periods[]

    // 2. Sort slots by priority: Invigilators first, then Stand-By
    // This ensures we fill the rooms first, then assign standbys from the remaining pool
    const sortedSlots = [...(slots as any[])].sort((a, b) => {
      if (a.slot_type === 'invigilator' && b.slot_type === 'standby') return -1;
      if (a.slot_type === 'standby' && b.slot_type === 'invigilator') return 1;
      return 0;
    });

    for (const slot of sortedSlots) {
      const period = slot.period_code || '';
      const slotType = slot.slot_type as 'invigilator' | 'standby' | 'tech';
      
      // Fetch paper and session info to get the grade
      const { data: paper } = await supabase
        .from('exam_papers')
        .select(`
          id,
          exam_sessions (
            grade
          )
        `)
        .eq('id', slot.exam_paper_id || 0)
        .single();

      const grade = (paper as any)?.exam_sessions?.grade;

      if (!paper || grade === undefined) {
        unfilledSlots.push({
          slotId: slot.id,
          paperId: slot.exam_paper_id || 0,
          period,
          type: slotType,
          reasons: ['Paper or Session Grade info not found']
        });
        continue;
      }

      // Get availability for this specific slot
      const availabilityResults = await this.getStaffAvailabilityForSlot({
        date,
        period,
        grade,
        paperId: paper.id,
        slotType
      });

      // Filter for those who are available AND haven't been assigned yet in this pass for THIS period
      const candidates = availabilityResults.filter(avail => {
        if (!avail.isAvailable) return false;

        const assignedPeriods = teachersAssignedInSession.get(avail.staff.staff_code) || [];
        
        // Already assigned to this period in this pass?
        if (assignedPeriods.includes(period)) return false;

        // Scattered role consecutive check within this pass
        if (avail.staff.role === 'Scattered') {
          const currentPeriodNum = parseInt(period.replace(/\D/g, ''));
          const hasConsecutiveInPass = assignedPeriods.some(p => {
            const pNum = parseInt(p.replace(/\D/g, ''));
            return Math.abs(pNum - currentPeriodNum) === 1;
          });
          if (hasConsecutiveInPass) return false;
        }

        return true;
      });

      // Sort candidates by load_percentage (favor lighter loads first)
      candidates.sort((a, b) => (a.staff.load_percentage || 0) - (b.staff.load_percentage || 0));

      if (candidates.length > 0) {
        const selected = candidates[0].staff;
        assignments.push({
          slotId: slot.id,
          staffCode: selected.staff_code,
          paperId: paper.id,
          period,
          type: slotType,
          dutyDate: slot.duty_date,
          dutyType: slot.duty_type
        });

        // Update internal tracking
        const currentAssigned = teachersAssignedInSession.get(selected.staff_code) || [];
        teachersAssignedInSession.set(selected.staff_code, [...currentAssigned, period]);
      } else {
        const reasons = [...new Set(availabilityResults.flatMap(a => a.conflicts.map(c => c.message)))];
        unfilledSlots.push({
          slotId: slot.id,
          paperId: paper.id,
          period,
          type: slotType,
          reasons: reasons.length > 0 ? reasons : ['No eligible staff found after session-wide conflict check']
        });
      }
    }

    return {
      date,
      session: sessionType.toLowerCase() as 'morning' | 'afternoon',
      assignments,
      unfilledSlots,
      summary: {
        totalSlots: slots.length,
        filled: assignments.length,
        unfilled: unfilledSlots.length
      }
    };
  }

  /**
   * Persists the generated assignments to the database
   */
  static async commitSessionAssignments(result: SessionAssignmentResult) {
    if (result.assignments.length === 0) return { success: true, count: 0 };

    const { error } = await supabase.from('exam_duties').upsert(
      result.assignments.map(a => ({
        id: a.slotId,
        staff_code: a.staffCode,
        duty_date: a.dutyDate,
        duty_type: a.dutyType,
        notes: `AUTO-ASSIGNED PHASE 4 (${new Date().toISOString().split('T')[0]})`
      }))
    );

    if (error) throw error;
    
    // Also update tech_duty_assignment for tech slots
    const techAssignments = result.assignments.filter(a => a.type === 'tech');
    if (techAssignments.length > 0) {
      const { error: techError } = await supabase.from('tech_duty_assignment').upsert(
        techAssignments.map(a => ({
          duty_date: a.dutyDate,
          staff_code: a.staffCode,
          exam_paper_id: a.paperId,
          subject_code: null // Optional: should ideally resolve from paper
        }))
      );
      if (techError) console.error('Error updating tech_duty_assignment:', techError);
    }

    return { success: true, count: result.assignments.length };
  }

  /**
   * Phase 4: TECH Duty Assignment
   * Correctly assigns TECH duty teachers for a given session.
   */
  static async assignTechDutyForSession(
    date: string,
    sessionType: 'Morning' | 'Afternoon'
  ): Promise<SessionAssignmentResult> {
    // 1. Fetch ALL unfilled TECH slots for this session
    const { data: slots, error: slotsError } = await (supabase
      .from('exam_duties') as any)
      .select('*')
      .eq('duty_date', date)
      .eq('session_type', sessionType)
      .eq('is_slot', true)
      .eq('slot_type', 'tech')
      .is('staff_code', null);

    if (slotsError) throw slotsError;
    
    // Fetch paper info for these slots
    const paperIds = [...new Set(slots?.map(s => s.exam_paper_id).filter(id => id !== null))] as number[];
    const { data: papers } = await supabase
      .from('exam_papers')
      .select(`
        id,
        subject_code,
        paper_type,
        exam_sessions (
          grade
        )
      `)
      .in('id', paperIds);

    const { data: techDutySubjects } = await supabase
      .from('tech_duty_subjects')
      .select('*');

    const techSubjectMap = new Map(techDutySubjects?.map(ts => [ts.subject_code, ts.staff_code]) || []);

    const assignments: SessionAssignmentResult['assignments'] = [];
    const unfilledSlots: SessionAssignmentResult['unfilledSlots'] = [];

    if (!slots || slots.length === 0) {
      return {
        date,
        session: sessionType.toLowerCase() as 'morning' | 'afternoon',
        assignments: [],
        unfilledSlots: [],
        summary: { totalSlots: 0, filled: 0, unfilled: 0 }
      };
    }

    for (const slot of (slots as any[])) {
      const paper = papers?.find(p => p.id === slot.exam_paper_id);
      const grade = (paper as any)?.exam_sessions?.grade;
      const subjectCode = paper?.subject_code || '';
      const period = slot.period_code || '';

      if (!paper || grade === undefined) {
        unfilledSlots.push({
          slotId: slot.id,
          paperId: slot.exam_paper_id || 0,
          period,
          type: 'tech',
          reasons: ['Paper info not found']
        });
        continue;
      }

      // Check for pre-assigned tech teacher for this subject
      const techStaffCode = techSubjectMap.get(subjectCode);

      if (!techStaffCode) {
        unfilledSlots.push({
          slotId: slot.id,
          paperId: paper.id,
          period,
          type: 'tech',
          reasons: [`No primary TECH teacher mapped for subject ${subjectCode}`]
        });
        continue;
      }

      // Check availability for this teacher
      const availabilityResults = await this.getStaffAvailabilityForSlot({
        date,
        period,
        grade,
        paperId: paper.id,
        slotType: 'tech'
      });

      const teacherAvail = availabilityResults.find(a => a.staff.staff_code === techStaffCode);

      if (teacherAvail && teacherAvail.isAvailable) {
        assignments.push({
          slotId: slot.id,
          staffCode: techStaffCode,
          paperId: paper.id,
          period,
          type: 'tech',
          dutyDate: slot.duty_date,
          dutyType: slot.duty_type
        });
      } else {
        unfilledSlots.push({
          slotId: slot.id,
          paperId: paper.id,
          period,
          type: 'tech',
          reasons: teacherAvail 
            ? teacherAvail.conflicts.map(c => c.message)
            : [`Assigned TECH teacher (${techStaffCode}) not found or fundamentally unavailable`]
        });
      }
    }

    return {
      date,
      session: sessionType.toLowerCase() as 'morning' | 'afternoon',
      assignments,
      unfilledSlots,
      summary: {
        totalSlots: slots.length,
        filled: assignments.length,
        unfilled: unfilledSlots.length
      }
    };
  }

  /**
   * Higher level auto-generation placeholder
   */
  static async generateDuties(_sessionId: string) {
    return {
      message: "Logic blueprint ready. Rule engine initialized.",
      phase: 1,
      status: "Availability engine operational"
    };
  }
}
