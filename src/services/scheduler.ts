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
  }): Promise<StaffAvailability[]> {
    const { date, period, grade, paperId } = params;
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

      return {
        staff: s,
        isAvailable: conflicts.length === 0,
        conflicts
      };
    });
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
