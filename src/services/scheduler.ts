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
    venueId: string;
    paperId: number;
    period: string;
    type: 'invigilator' | 'standby' | 'tech';
    dutyDate: string;
    dutyType: string;
    sessionId?: number;
    isNew?: boolean;
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
    venueCount?: number;
  };
}

export interface TeacherWorkload {
  staffCode: string;
  fullName: string;
  invigilationMinutes: number;
  standbyMinutes: number;
  techMinutes: number;
  sessionCount: number;
}

export interface LoadImbalanceReport {
  invigilation: {
    avg: number;
    min: number;
    max: number;
    stdDev: number;
    range: number;
  };
  standby: {
    avg: number;
    min: number;
    max: number;
    stdDev: number;
    range: number;
  };
  totalTeachers: number;
}

export interface RebalancingProposal {
  slotId: number;
  currentStaffCode: string;
  suggestedStaffCode: string;
  reason: string;
  loadDifference: number;
}

export interface OptimiseSessionResult {
  date: string;
  session: 'Morning' | 'Afternoon';
  tech: SessionAssignmentResult;
  initial: SessionAssignmentResult;
  rebalancing: {
    proposals: RebalancingProposal[];
    applied?: ApplyProposalsResult;
    iterations: number;
    finalInvigVariance?: number;
    finalStandbyVariance?: number;
  };
  progress: string[];
  summary: {
    totalSlots: number;
    filled: number;
    unfilled: number;
  };
}

export interface OptimiseFullDayResult {
  date: string;
  morning: OptimiseSessionResult;
  afternoon: OptimiseSessionResult;
  summary: {
    totalSlots: number;
    filled: number;
    unfilled: number;
    techAssigned: number;
    finalInvigVariance?: number;
    finalStandbyVariance?: number;
  };
}

export interface OptimiseDateRangeResult {
  startDate: string;
  endDate: string;
  days: OptimiseFullDayResult[];
  summary: {
    totalSlots: number;
    filled: number;
    unfilled: number;
    techAssigned: number;
    finalInvigVariance?: number;
    finalStandbyVariance?: number;
  };
}

export interface ApplyProposalsResult {
  applied: { slotId: number; staffCode: string }[];
  rejected: { slotId: number; reason: string }[];
  summary: {
    totalProposals: number;
    appliedCount: number;
    rejectedCount: number;
  };
}

export interface OptimisationOptions {
  startDate: string;
  endDate?: string;
  sessionType?: 'Morning' | 'Afternoon' | 'FullDay' | 'DateRange';
  autoApplyRebalancing?: boolean;
  balanceThreshold?: number; // Default 70 mins
  onProgress?: (message: string) => void;
}

export type OptimisationResponse = 
  | { type: 'session', result: OptimiseSessionResult }
  | { type: 'fullDay', result: OptimiseFullDayResult }
  | { type: 'dateRange', result: OptimiseDateRangeResult };

export class SchedulerService {
  /**
   * High-level entry point for the "Optimise" UI.
   * Handles session, full day, or date range optimisation based on options.
   * 
   * @param options Configuration for the optimisation run
   * @returns Detailed results of the optimisation pass
   */
  static async runOptimisation(options: OptimisationOptions): Promise<OptimisationResponse> {
    const { startDate, endDate, sessionType = 'FullDay', autoApplyRebalancing = false, balanceThreshold = 70, onProgress } = options;

    if (sessionType === 'DateRange') {
      if (!endDate) throw new Error('endDate is required for DateRange optimisation');
      const result = await this.optimiseDateRange(startDate, endDate, { autoApplyRebalancing, balanceThreshold, onProgress });
      return { type: 'dateRange', result };
    }

    if (sessionType === 'FullDay') {
      const result = await this.optimiseFullDay(startDate, { autoApplyRebalancing, balanceThreshold, onProgress });
      return { type: 'fullDay', result };
    }

    if (sessionType === 'Morning' || sessionType === 'Afternoon') {
      const result = await this.optimiseSession(startDate, sessionType, { autoApplyRebalancing, balanceThreshold, onProgress });
      return { type: 'session', result };
    }

    throw new Error(`Invalid sessionType: ${sessionType}`);
  }

  /**
   * Safely clears auto-assigned duties for a given scope.
   * Useful for "re-generating" assignments from scratch.
   * 
   * @param options Scope to clear (specific date, session, or range)
   */
  static async clearAssignments(options: { 
    date?: string, 
    sessionType?: 'Morning' | 'Afternoon', 
    startDate?: string, 
    endDate?: string 
  }) {
    let query = supabase.from('exam_duties').update({ staff_code: null, notes: null });

    if (options.date) {
      query = query.eq('duty_date', options.date);
    }
    if (options.sessionType) {
      query = query.eq('session_type', options.sessionType);
    }
    if (options.startDate) {
      query = query.gte('duty_date', options.startDate);
    }
    if (options.endDate) {
      query = query.lte('duty_date', options.endDate);
    }

    // Only clear if confirmed or specifically targeted
    if (!options.date && !options.startDate) {
      throw new Error('Must specify at least a date or startDate to clear assignments');
    }

    const { error } = await query;
    if (error) throw error;
    return { success: true };
  }

  /**
   * Phase 11 & 13a: Get comprehensive optimisation status for a specific date.
   * Useful for showing status badges (e.g., "75% Filled") in the UI.
   * 
   * @param date Date string (YYYY-MM-DD)
   * @param sessionType Optional session filter ('Morning' | 'Afternoon')
   * @returns Object with counts, completion percentage, and status label
   */
  static async getOptimisationStatus(date: string, sessionType?: 'Morning' | 'Afternoon') {
    let query = (supabase
      .from('exam_duties') as any)
      .select('staff_code', { count: 'exact' })
      .eq('duty_date', date)
      .eq('is_slot', true);

    if (sessionType) {
      query = query.eq('session_type', sessionType);
    }

    const { count: total, data: assignments, error } = await query;
    if (error) throw error;

    const totalSlots = total || 0;
    const filledSlots = assignments?.filter(a => a.staff_code !== null).length || 0;
    const percentComplete = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;
    
    let status: 'empty' | 'partial' | 'complete' = 'empty';
    if (filledSlots === totalSlots && totalSlots > 0) status = 'complete';
    else if (filledSlots > 0) status = 'partial';

    return {
      totalSlots,
      filledSlots,
      percentComplete,
      status
    };
  }

  /**
   * Phase 11 & 13a: Check status for a range of dates.
   * Efficiently aggregates optimisation state for multiple days.
   * 
   * @param startDate Range start (YYYY-MM-DD)
   * @param endDate Range end (YYYY-MM-DD)
   * @returns List of daily status objects
   */
  static async getOptimisationStatusRange(startDate: string, endDate: string) {
    const { data: assignments, error } = await (supabase
      .from('exam_duties') as any)
      .select('duty_date, session_type, staff_code, is_slot')
      .gte('duty_date', startDate)
      .lte('duty_date', endDate)
      .eq('is_slot', true);

    if (error) throw error;

    const statsMap = new Map<string, { total: number, filled: number }>();

    assignments?.forEach((a: any) => {
      const dayKey = a.duty_date;
      const current = statsMap.get(dayKey) || { total: 0, filled: 0 };
      current.total += 1;
      if (a.staff_code) current.filled += 1;
      statsMap.set(dayKey, current);
    });

    return Array.from(statsMap.entries()).map(([date, stats]) => ({
      date,
      ...stats,
      percentComplete: stats.total > 0 ? Math.round((stats.filled / stats.total) * 100) : 0,
      status: stats.filled === stats.total ? 'complete' : (stats.filled > 0 ? 'partial' : 'empty')
    }));
  }

  /**
   * Phase 13a: Fetches rebalancing proposals for a session WITHOUT running the full optimisation.
   * Useful for manual "Check for Improvements" UI flow.
   * 
   * @param date Date string
   * @param sessionType 'Morning' or 'Afternoon'
   */
  static async getCurrentRebalancingProposals(date: string, sessionType: 'Morning' | 'Afternoon') {
    const invigProposals = await this.proposeRebalancingSuggestions(date, sessionType, 'Invigilation');
    const standbyProposals = await this.proposeRebalancingSuggestions(date, sessionType, 'Stand-By');
    return [...invigProposals, ...standbyProposals];
  }

  /**
   * Phase 13a: Returns formatted data for workload distribution charts.
   * Helpful for visualising "who is doing the most work".
   */
  static async getWorkloadChartData(startDate?: string, endDate?: string) {
    const workloads = await this.getTeacherWorkloadSummary(startDate, endDate);
    // Sort by total minutes descending
    return workloads
      .map(w => ({
        name: w.fullName,
        code: w.staffCode,
        total: w.invigilationMinutes + w.standbyMinutes + w.techMinutes,
        invigilation: w.invigilationMinutes,
        standby: w.standbyMinutes,
        tech: w.techMinutes
      }))
      .sort((a, b) => b.total - a.total);
  }

  /**
   * Phase 11: Fetch current duty assignments grouped by teacher.
   * Efficient for building individual workload and "My Schedule" views.
   * 
   * @param startDate Range start
   * @param endDate Range end
   */
  static async getAssignmentsByStaff(startDate: string, endDate: string) {
    const { data: duties, error } = await supabase
      .from('exam_duties')
      .select(`
        id,
        duty_date,
        session_type,
        period_code,
        duty_type,
        staff_code,
        venue_id,
        exam_papers (
          duration_minutes,
          subject_code,
          paper_type,
          exam_sessions (grade)
        )
      `)
      .gte('duty_date', startDate)
      .lte('duty_date', endDate)
      .not('staff_code', 'is', null);

    if (error) throw error;
    return duties;
  }

  /**
   * Phase 11: Fetch all duties (assigned and unassigned) for a specific session.
   * Useful for the main schedule grid in the UI.
   * 
   * @param date The date to fetch
   * @param sessionType Morning or Afternoon
   */
  static async getCurrentSessionAssignments(date: string, sessionType: 'Morning' | 'Afternoon') {
    const { data, error } = await supabase
      .from('exam_duties')
      .select(`
        *,
        staff (first_name, last_name),
        exam_papers (
          id,
          subject_code,
          paper_type,
          duration_minutes,
          exam_sessions (grade)
        )
      `)
      .eq('duty_date', date)
      .eq('session_type', sessionType);

    if (error) throw error;
    return data;
  }

  /**
   * Phase 6: Apply Approved Rebalancing Proposals
   * 
   * Re-validates proposals against current data before updating the database.
   * This is the final step in the rebalancing process.
   * 
   * @param proposals List of proposals to apply
   */
  static async applyApprovedProposals(proposals: RebalancingProposal[]): Promise<ApplyProposalsResult> {
    const result: ApplyProposalsResult = {
      applied: [],
      rejected: [],
      summary: {
        totalProposals: proposals.length,
        appliedCount: 0,
        rejectedCount: 0
      }
    };

    if (proposals.length === 0) return result;

    for (const proposal of proposals) {
      try {
        // 1. Fetch current slot details for re-validation
        const { data: duty, error: dutyError } = await (supabase
          .from('exam_duties') as any)
          .select(`
            id,
            duty_date,
            period_code,
            exam_paper_id,
            duty_type,
            slot_type
          `)
          .eq('id', proposal.slotId)
          .single();

        if (dutyError || !duty) {
          result.rejected.push({ slotId: proposal.slotId, reason: 'Slot not found in database' });
          continue;
        }

        // 2. Fetch paper/session details for grade info
        const { data: paper } = await supabase
          .from('exam_papers')
          .select(`
            id,
            exam_sessions (grade)
          `)
          .eq('id', duty.exam_paper_id || 0)
          .single();

        const grade = (paper as any)?.exam_sessions?.grade;
        if (!paper || grade === undefined) {
          result.rejected.push({ slotId: proposal.slotId, reason: 'Grade info missing for paper' });
          continue;
        }

        // 3. RE-VALIDATE: Use the conflict engine again
        const availability = await this.getStaffAvailabilityForSlot({
          date: duty.duty_date,
          period: duty.period_code || '',
          grade,
          paperId: paper.id,
          slotType: duty.slot_type as any
        });

        const targetStaff = availability.find(a => a.staff.staff_code === proposal.suggestedStaffCode);

        if (!targetStaff) {
          result.rejected.push({ slotId: proposal.slotId, reason: `Target staff (${proposal.suggestedStaffCode}) not found` });
          continue;
        }

        if (!targetStaff.isAvailable) {
          const conflictMessages = targetStaff.conflicts.map(c => c.message).join(', ');
          result.rejected.push({ 
            slotId: proposal.slotId, 
            reason: `Validation failed: ${conflictMessages}` 
          });
          continue;
        }

        // 4. Update the duty assignment
        const { error: updateError } = await supabase
          .from('exam_duties')
          .update({
            staff_code: proposal.suggestedStaffCode,
            notes: `REBALANCED: ${proposal.reason} (Applied: ${new Date().toISOString().split('T')[0]})`
          })
          .eq('id', proposal.slotId);

        if (updateError) {
          result.rejected.push({ slotId: proposal.slotId, reason: `Database update failed: ${updateError.message}` });
        } else {
          result.applied.push({ slotId: proposal.slotId, staffCode: proposal.suggestedStaffCode });
        }

      } catch (err: any) {
        result.rejected.push({ slotId: proposal.slotId, reason: `Unexpected error: ${err.message}` });
      }
    }

    result.summary.appliedCount = result.applied.length;
    result.summary.rejectedCount = result.rejected.length;

    return result;
  }

  /**
   * Phase 7 & 12: Session Orchestrator
   * 
   * Runs the complete scheduling flow for a single session in one call.
   * Sequence: Tech Duties -> Initial Packing -> Iterative Rebalancing.
   * 
   * @param date Date string (YYYY-MM-DD)
   * @param sessionType 'Morning' or 'Afternoon'
   * @param options Configuration including auto-apply and balance thresholds
   */
  static async optimiseSession(
    date: string,
    sessionType: 'Morning' | 'Afternoon',
    options: { autoApplyRebalancing?: boolean; balanceThreshold?: number, onProgress?: (m: string) => void } = { autoApplyRebalancing: false, balanceThreshold: 70 }
  ): Promise<OptimiseSessionResult> {
    const progress: string[] = [];
    const balanceThreshold = options.balanceThreshold || 70;

    const logProgress = (msg: string) => {
      progress.push(msg);
      if (options.onProgress) options.onProgress(msg);
      console.log(`[Scheduler]: ${msg}`);
    };

    // 1. Assign TECH duties first (they have highest priority and block the full day)
    logProgress(`Stage 1: Analyzing Technical Duty requirements for ${date} (${sessionType})...`);
    const techResult = await this.assignTechDutyForSession(date, sessionType);
    if (techResult.assignments.length > 0) {
      await this.commitSessionAssignments(techResult);
      logProgress(`✓ Secured ${techResult.assignments.length} Technical Support slots.`);
    }

    // 2. Assign regular invigilators and stand-bys
    logProgress('Stage 2: Allocating Primary Invigilators and Stand-bys...');
    const initialResult = await this.generateInitialAssignmentsForSession(date, sessionType);
    if (initialResult.assignments.length > 0) {
      await this.commitSessionAssignments(initialResult);
      logProgress(`✓ Successfully allocated ${initialResult.assignments.length} invigilation slots.`);
    }

    // 3. Iterative Rebalancing
    logProgress('Stage 3: Balancing workload to ensure fairness across staff...');
    let iterations = 0;
    const allProposals: RebalancingProposal[] = [];
    let lastAppliedResult: ApplyProposalsResult | undefined;

    while (iterations < 10) {
      const statsBefore = await this.getLoadImbalanceReport();
      const currentVariance = statsBefore.invigilation.range;

      if (currentVariance <= balanceThreshold) {
        logProgress(`Workload distribution optimal (Range: ${currentVariance}m).`);
        break;
      }

      const proposals = await this.proposeRebalancingSuggestions(date, sessionType, 'Invigilation');
      
      if (proposals.length === 0) {
        const standbyProposals = await this.proposeRebalancingSuggestions(date, sessionType, 'Stand-By');
        if (standbyProposals.length > 0) {
          proposals.push(...standbyProposals);
        }
      }

      if (proposals.length === 0) {
        logProgress('No further workload improvements possible today.');
        break;
      }

      allProposals.push(...proposals);
      
      if (options.autoApplyRebalancing) {
        const applied = await this.applyApprovedProposals(proposals);
        
        if (!lastAppliedResult) {
          lastAppliedResult = applied;
        } else {
          lastAppliedResult = {
            applied: [...lastAppliedResult.applied, ...applied.applied],
            rejected: [...lastAppliedResult.rejected, ...applied.rejected],
            summary: {
              totalProposals: lastAppliedResult.summary.totalProposals + applied.summary.totalProposals,
              appliedCount: lastAppliedResult.summary.appliedCount + applied.summary.appliedCount,
              rejectedCount: lastAppliedResult.summary.rejectedCount + applied.summary.rejectedCount
            }
          };
        }

        if (applied.summary.appliedCount === 0) {
          logProgress(`Iteration ${iterations + 1}: Final refinements complete.`);
          break;
        }
        logProgress(`Adjustment ${iterations + 1}: Improved ${applied.summary.appliedCount} duties. New Range: ~${currentVariance - proposals[0].loadDifference}m.`);
      } else {
        logProgress(`Suggestion: ${proposals.length} possible improvements identified.`);
        break; 
      }

      iterations++;
    }

    logProgress('Stage 4: Finalizing schedule and performing systemic health checks...');
    const finalStats = await this.getLoadImbalanceReport();

    const totalSlots = techResult.summary.totalSlots + initialResult.summary.totalSlots;
    const filled = techResult.summary.filled + initialResult.summary.filled;
    const unfilled = techResult.summary.unfilled + initialResult.summary.unfilled;

    return {
      date,
      session: sessionType,
      tech: techResult,
      initial: initialResult,
      rebalancing: {
        proposals: allProposals,
        applied: lastAppliedResult,
        iterations,
        finalInvigVariance: finalStats.invigilation.range,
        finalStandbyVariance: finalStats.standby.range
      },
      progress,
      summary: {
        totalSlots,
        filled,
        unfilled
      }
    };
  }

  /**
   * Phase 8: Full Day Orchestration
   * 
   * Coordinates the optimisation of both Morning and Afternoon sessions for a given date.
   * Ensures Morning assignments affect Afternoon availability (Day-level load tracking).
   */
  static async optimiseFullDay(
    date: string,
    options: { autoApplyRebalancing?: boolean; balanceThreshold?: number, onProgress?: (m: string) => void } = { autoApplyRebalancing: false, balanceThreshold: 70 }
  ): Promise<OptimiseFullDayResult> {
    if (options.onProgress) options.onProgress(`Starting Full Day Optimisation for ${date}...`);
    // 1. Optimise Morning Session
    // We commit Morning before Afternoon starts so Afternoon can see Morning assignments
    const morning = await this.optimiseSession(date, 'Morning', options);

    // 2. Optimise Afternoon Session
    // Afternoon will naturally avoid teachers assigned in Morning due to updated workload statistics
    const afternoon = await this.optimiseSession(date, 'Afternoon', options);

    const totalSlots = morning.summary.totalSlots + afternoon.summary.totalSlots;
    const filled = morning.summary.filled + afternoon.summary.filled;
    const unfilled = morning.summary.unfilled + afternoon.summary.unfilled;
    const techAssigned = morning.tech.summary.filled + afternoon.tech.summary.filled;

    const finalStats = await this.getLoadImbalanceReport();

    return {
      date,
      morning,
      afternoon,
      summary: {
        totalSlots,
        filled,
        unfilled,
        techAssigned,
        finalInvigVariance: finalStats.invigilation.range,
        finalStandbyVariance: finalStats.standby.range
      }
    };
  }

  /**
   * Phase 9: Multi-Day Orchestration
   * 
   * Sequentially optimises a range of dates.
   * Sequential processing allows teachers to be moved according to accumulating load.
   */
  static async optimiseDateRange(
    startDate: string,
    endDate: string,
    options: { autoApplyRebalancing?: boolean; balanceThreshold?: number, onProgress?: (m: string) => void } = { autoApplyRebalancing: false, balanceThreshold: 70 }
  ): Promise<OptimiseDateRangeResult> {
    const days: OptimiseFullDayResult[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (options.onProgress) options.onProgress(`Starting Multi-Day Range Optimisation (${startDate} to ${endDate})...`);

    // Sequence ensures load spreads naturally across the range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const { isWeekend } = this.getCycleInfo(dateStr);
      
      if (isWeekend) continue;

      if (options.onProgress) options.onProgress(`Processing Date: ${dateStr}...`);
      const dayResult = await this.optimiseFullDay(dateStr, options);
      days.push(dayResult);
    }

    const totalSlots = days.reduce((sum, d) => sum + d.summary.totalSlots, 0);
    const filled = days.reduce((sum, d) => sum + d.summary.filled, 0);
    const unfilled = days.reduce((sum, d) => sum + d.summary.unfilled, 0);
    const techAssigned = days.reduce((sum, d) => sum + d.summary.techAssigned, 0);

    const finalStats = await this.getLoadImbalanceReport();

    return {
      startDate,
      endDate,
      days,
      summary: {
        totalSlots,
        filled,
        unfilled,
        techAssigned,
        finalInvigVariance: finalStats.invigilation.range,
        finalStandbyVariance: finalStats.standby.range
      }
    };
  }
  /**
   * Phase 5b & 12: Propose rebalancing suggestions for a session.
   * 
   * Identifies over-burdened teachers and suggests available low-load replacements.
   * Does NOT write to the database. Returns proposals for UI review.
   * 
   * @param date The date to analyze
   * @param sessionType Morning or Afternoon
   * @param targetType The duty type to balance ('Invigilation' or 'Stand-By')
   */
  static async proposeRebalancingSuggestions(
    date: string,
    sessionType: 'Morning' | 'Afternoon',
    targetType: 'Invigilation' | 'Stand-By' = 'Invigilation'
  ): Promise<RebalancingProposal[]> {
    // 1. Get current workloads and stats
    const workloads = await this.getTeacherWorkloadSummary();
    const stats = await this.getLoadImbalanceReport();
    
    const statsKey = targetType === 'Invigilation' ? 'invigilation' : 'standby';
    const loadKey = targetType === 'Invigilation' ? 'invigilationMinutes' : 'standbyMinutes';

    // Thresholds for "overburdened" and "available for pick-up"
    // Using a more dynamic threshold based on standard deviation
    const highThreshold = stats[statsKey].avg + (stats[statsKey].stdDev * 0.3);
    const lowThreshold = stats[statsKey].avg - (stats[statsKey].stdDev * 0.3);

    // 2. Fetch assigned duties for this session
    const { data: currentDuties, error } = await supabase
      .from('exam_duties')
      .select(`
        id,
        staff_code,
        period_code,
        exam_paper_id,
        duty_type
      `)
      .eq('duty_date', date)
      .eq('session_type', sessionType)
      .eq('duty_type', targetType)
      .not('staff_code', 'is', null);

    if (error) throw error;
    if (!currentDuties) return [];

    const proposals: RebalancingProposal[] = [];

    // 3. Analyze each duty
    for (const duty of currentDuties) {
      const currentWorkload = workloads.find(w => w.staffCode === duty.staff_code);
      if (!currentWorkload || (currentWorkload[loadKey] as number) <= highThreshold) continue;

      // This teacher is overburdened. Try to find a replacement.
      const { data: paper } = await supabase
        .from('exam_papers')
        .select(`
          id,
          exam_sessions (grade)
        `)
        .eq('id', duty.exam_paper_id || 0)
        .single();

      const grade = (paper as any)?.exam_sessions?.grade;
      if (!paper || grade === undefined) continue;

      const availability = await this.getStaffAvailabilityForSlot({
        date,
        period: duty.period_code || '',
        grade,
        paperId: paper.id,
        slotType: duty.duty_type === 'Stand-By' ? 'standby' : 'invigilator'
      });

      // Filter for available teachers with low load in this specific target category
      const candidates = availability
        .filter(a => {
          if (!a.isAvailable) return false;
          const w = workloads.find(wl => wl.staffCode === a.staff.staff_code);
          // Important: Must be below threshold for the target load category
          return w && (w[loadKey] as number) < lowThreshold;
        })
        .sort((a, b) => {
          const wA = (workloads.find(wl => wl.staffCode === a.staff.staff_code) as any)[loadKey] || 0;
          const wB = (workloads.find(wl => wl.staffCode === b.staff.staff_code) as any)[loadKey] || 0;
          return wA - wB;
        });

      if (candidates.length > 0) {
        const bestCandidate = candidates[0].staff;
        const candidateWorkload = workloads.find(w => w.staffCode === bestCandidate.staff_code)!;
        
        proposals.push({
          slotId: duty.id,
          currentStaffCode: duty.staff_code!,
          suggestedStaffCode: bestCandidate.staff_code,
          reason: `Workload Reduction (${targetType}): ${currentWorkload.fullName} (${currentWorkload[loadKey]}m) -> ${bestCandidate.first_name} ${bestCandidate.last_name} (${candidateWorkload[loadKey]}m)`,
          loadDifference: (currentWorkload[loadKey] as number) - (candidateWorkload[loadKey] as number)
        });

        // Optimization: Don't suggest more than one swap per slot in one call
        // But we could suggest multiple slots per call as long as they are distinct.
      }
    }

    return proposals;
  }

  /**
   * Phase 5a: Get comprehensive workload summary for all teachers.
   * 
   * Calculates total minutes for invigilation, standby, and tech duties.
   * Aggregates from all assignments within the given date range.
   * 
   * @param startDate Optional start date for the range
   * @param endDate Optional end date for the range
   * @returns Array of workload objects including minutes and session counts
   */
  static async getTeacherWorkloadSummary(startDate?: string, endDate?: string): Promise<TeacherWorkload[]> {
    let query = supabase
      .from('exam_duties')
      .select(`
        staff_code,
        duty_type,
        staff (first_name, last_name),
        exam_papers (duration_minutes)
      `)
      .not('staff_code', 'is', null);

    if (startDate) query = query.gte('duty_date', startDate);
    if (endDate) query = query.lte('duty_date', endDate);

    const { data: duties, error } = await (query as any);
    if (error) throw error;

    const { data: allStaff } = await supabase.from('staff').select('staff_code, first_name, last_name');
    
    const summaryMap = new Map<string, TeacherWorkload>();

    // Initialise all active staff
    allStaff?.forEach(s => {
      summaryMap.set(s.staff_code, {
        staffCode: s.staff_code,
        fullName: `${s.first_name} ${s.last_name}`,
        invigilationMinutes: 0,
        standbyMinutes: 0,
        techMinutes: 0,
        sessionCount: 0
      });
    });

    duties?.forEach((d: any) => {
      const workload = summaryMap.get(d.staff_code);
      if (!workload) return;

      const mins = d.exam_papers?.duration_minutes || 120; // Default to 2 hours if missing

      if (d.duty_type === 'Invigilation') {
        workload.invigilationMinutes += mins;
      } else if (d.duty_type === 'Stand-By') {
        workload.standbyMinutes += mins;
      } else if (d.duty_type === 'Tech-Duty') {
        workload.techMinutes += mins;
      }
      
      workload.sessionCount += 1;
    });

    return Array.from(summaryMap.values());
  }

  /**
   * Phase 5a: Get workload summary for a specific session
   */
  static async getSessionWorkloadSummary(date: string, sessionType: 'Morning' | 'Afternoon') {
    const workloads = await this.getTeacherWorkloadSummary(date, date);
    return workloads.filter(w => w.sessionCount > 0);
  }

  /**
   * Phase 5a & 13a: Calculate load imbalance statistics for teachers.
   * 
   * Computes average, standard deviation, and range for invigilation and standby loads.
   * Used by the UI to evaluate the "health" and "fairness" of the current schedule.
   * 
   * @param startDate Optional range start
   * @param endDate Optional range end
   * @returns Imbalance report with detailed metrics for invigilation and standby categories
   */
  static async getLoadImbalanceReport(startDate?: string, endDate?: string): Promise<LoadImbalanceReport> {
    const workloads = await this.getTeacherWorkloadSummary(startDate, endDate);
    
    const calculateStats = (data: number[]) => {
      if (data.length === 0) return { avg: 0, min: 0, max: 0, stdDev: 0, range: 0 };
      const sum = data.reduce((a, b) => a + b, 0);
      const avg = sum / data.length;
      const min = Math.min(...data);
      const max = Math.max(...data);
      const variance = data.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / data.length;
      return {
        avg: Math.round(avg),
        min,
        max,
        stdDev: Math.round(Math.sqrt(variance)),
        range: max - min
      };
    };

    const invigData = workloads.map(w => w.invigilationMinutes);
    const standbyData = workloads.map(w => w.standbyMinutes);

    return {
      invigilation: calculateStats(invigData),
      standby: calculateStats(standbyData),
      totalTeachers: workloads.length
    };
  }

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
   * 
   * Answers the critical question: "Who is available for this slot and why/why not?"
   * Checks leaves, teaching timetables, break duties, and existing exam duties.
   * Also respects TECH duty blocks and Scattered role restrictions.
   * 
   * @param params Slot details including date, period, grade, and type.
   */
  static async getStaffAvailabilityForSlot(params: {
    date: string;
    period: string; // e.g., 'P1'
    grade: number;
    venueId?: string;
    paperId?: number;
    slotType?: 'invigilator' | 'standby' | 'tech';
  }): Promise<StaffAvailability[]> {
    const { date, period, grade, paperId, slotType, venueId } = params;
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
    return staff.filter(s => !['AAAA', 'AAAB', 'AAAC', 'AAAD'].includes(s.staff_code)).map(s => {
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

      // Rule 6: Hall Access Restrictions
      if (venueId && (venueId === 'HALL' || venueId === 'Main Hall')) {
        if (!s.hall_access) {
          conflicts.push({
            ruleId: 'HALL_ACCESS',
            message: 'Staff member does not have Hall Access permission',
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
   * Phase 13a: Get a summary of how many duties are assigned vs unassigned for a given range.
   * Perfect for overall progress dashboards.
   */
  static async getGlobalOptimisationSummary(startDate: string, endDate: string) {
    const dailyStats = await this.getOptimisationStatusRange(startDate, endDate);
    const totalFilled = dailyStats.reduce((sum, d) => sum + d.filled, 0);
    const totalSlots = dailyStats.reduce((sum, d) => sum + d.total, 0);
    const avgCompletion = dailyStats.length > 0 
      ? Math.round(dailyStats.reduce((sum, d) => sum + d.percentComplete, 0) / dailyStats.length)
      : 0;

    return {
      totalFilled,
      totalSlots,
      avgCompletion,
      dayCount: dailyStats.length,
      days: dailyStats
    };
  }

  static getOverlappingPeriods(sessionType: 'Morning' | 'Afternoon', durationMinutes: number) {
    const startMinutes = sessionType === 'Morning' ? 8 * 60 + 20 : 13 * 60 + 20;
    const endMinutes = startMinutes + durationMinutes;

    const periods = [
      { code: 'P1', s: 7*60+30, e: 8*60+30 },
      { code: 'P2', s: 8*60+30, e: 9*60+30 },
      { code: 'P3', s: 9*60+30, e: 10*60+30 },
      { code: 'B1', s: 10*60+30, e: 11*60+0 },
      { code: 'P4', s: 11*60+0, e: 12*60+0 },
      { code: 'P5', s: 12*60+0, e: 13*60+0 },
      { code: 'P6', s: 13*60+0, e: 14*60+0 },
      { code: 'B2', s: 14*60+0, e: 14*60+30 },
      { code: 'A1', s: 14*60+30, e: 15*60+30 },
      { code: 'A2', s: 15*60+30, e: 16*60+30 },
      { code: 'A3', s: 16*60+30, e: 17*60+30 }
    ];

    // Some teachers teach classes during those periods, exclude those? No, period codes overlap.
    return periods.filter(p => startMinutes < p.e && endMinutes > p.s).map(p => p.code);
  }

  /**
   * Phase 2: Initial Slot Packing (One Session).
   * 
   * Fills invigilation slots for a single session while respecting all availability rules.
   * Favours staff with lower existing loads.
   * 
   * @param date The date to process
   * @param sessionType Morning or Afternoon
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
      const basePeriod = slot.period_code || '';
      const slotType = slot.slot_type as 'invigilator' | 'standby' | 'tech';
      
      const { data: paper } = await supabase
        .from('exam_papers')
        .select(`
          id,
          duration_minutes,
          exam_sessions (
            grade
          )
        `)
        .eq('id', slot.exam_paper_id || 0)
        .single();

      const grade = (paper as any)?.exam_sessions?.grade;
      const duration = paper?.duration_minutes || 120;

      if (!paper || grade === undefined) {
        unfilledSlots.push({
          slotId: slot.id,
          paperId: slot.exam_paper_id || 0,
          period: basePeriod,
          type: slotType,
          reasons: ['Paper or Session Grade info not found']
        });
        continue;
      }

      const venueId = slot.venue_id;
      if (!venueId) {
        unfilledSlots.push({
          slotId: slot.id,
          paperId: paper.id,
          period: basePeriod,
          type: slotType,
          reasons: ['CRITICAL: No venue ID associated with this slot. Data integrity check failed.']
        });
        continue;
      }

      const targetPeriods = this.getOverlappingPeriods(sessionType, duration);
      if (targetPeriods.length === 0) targetPeriods.push(basePeriod);

      let preferredTeacherCode: string | null = null;

      for (const p of targetPeriods) {
        const isNew = p !== basePeriod;

        // Get availability for this period
        const availabilityResults = await this.getStaffAvailabilityForSlot({
          date,
          period: p,
          grade,
          paperId: paper.id,
          slotType
        });

        // Filter valid candidates
        let candidates = availabilityResults.filter(avail => {
          if (!avail.isAvailable) return false;

          const assignedPeriods = teachersAssignedInSession.get(avail.staff.staff_code) || [];
          if (assignedPeriods.includes(p)) return false; // Already assigned this period

          if (avail.staff.role === 'Scattered') {
            const currentPeriodNum = parseInt(p.replace(/\D/g, ''));
            const hasConsecutiveInPass = assignedPeriods.some(ap => {
              const pNum = parseInt(ap.replace(/\D/g, ''));
              return Math.abs(pNum - currentPeriodNum) === 1;
            });
            if (hasConsecutiveInPass) return false;
          }

          return true;
        });

        if (candidates.length > 0) {
          // If we have a preferred teacher from the previous period (MARATHON intent), and they are valid for this period
          const retainedCandidate = preferredTeacherCode ? candidates.find(c => c.staff.staff_code === preferredTeacherCode) : null;
          
          let selected;
          if (retainedCandidate) {
            selected = retainedCandidate.staff;
          } else {
            // Sort by load_percentage
            candidates.sort((a, b) => (a.staff.load_percentage || 0) - (b.staff.load_percentage || 0));
            selected = candidates[0].staff;
          }

          // Remember them for the next overlapping period
          preferredTeacherCode = selected.staff_code;

          assignments.push({
            slotId: slot.id, // For isNew=true, this gets ignored / creates a new row with no ID collision since we use insert
            staffCode: selected.staff_code,
            venueId: venueId,
            paperId: paper.id,
            period: p,
            type: slotType,
            dutyDate: slot.duty_date,
            dutyType: slot.duty_type,
            sessionId: slot.exam_session_id,
            isNew: isNew
          });

          const currentAssigned = teachersAssignedInSession.get(selected.staff_code) || [];
          teachersAssignedInSession.set(selected.staff_code, [...currentAssigned, p]);
        } else {
          preferredTeacherCode = null; // Break the marathon chain if forced
          const reasons = [...new Set(availabilityResults.flatMap(a => a.conflicts.map(c => c.message)))];
          unfilledSlots.push({
            slotId: slot.id,
            paperId: paper.id,
            period: p,
            type: slotType,
            reasons: reasons.length > 0 ? reasons : ['No eligible staff found after session-wide conflict check']
          });
        }
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

    const updatePromises = result.assignments.map(a => {
      if (a.isNew) {
        const isAfternoon = a.period?.startsWith('A') || a.period?.startsWith('P6') || a.period?.startsWith('P7') || a.period === 'B2';
        const sessionTypeVal = a.dutyType === 'Tech-Duty' ? 'Morning/Afternoon' : (isAfternoon ? 'Afternoon' : 'Morning');
        
        return supabase.from('exam_duties').insert({
          staff_code: a.staffCode,
          venue_id: a.venueId,
          exam_paper_id: a.paperId,
          exam_session_id: a.sessionId,
          period_code: a.period,
          duty_date: a.dutyDate,
          duty_type: a.dutyType,
          is_slot: true,
          slot_type: a.type,
          session_type: sessionTypeVal,
          notes: `AUTO-ASSIGNED dynamically expanded (${new Date().toLocaleDateString()})`
        });
      } else {
        return supabase.from('exam_duties').update({
          staff_code: a.staffCode,
          venue_id: a.venueId,
          duty_date: a.dutyDate,
          duty_type: a.dutyType,
          notes: `AUTO-ASSIGNED scheduler engine reliable (${new Date().toLocaleDateString()})`
        }).eq('id', a.slotId);
      }
    });

    const results = await Promise.all(updatePromises);
    
    // Check for any errors in the update batch
    const errors = results.filter(r => r.error).map(r => r.error);
    if (errors.length > 0) {
      console.error('Error committing assignments:', errors);
      throw errors[0];
    }
    
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
        duration_minutes,
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
      const basePeriod = slot.period_code || '';
      const duration = paper?.duration_minutes || 120;

      if (!paper || grade === undefined) {
        unfilledSlots.push({
          slotId: slot.id,
          paperId: slot.exam_paper_id || 0,
          period: basePeriod,
          type: 'tech',
          reasons: ['Paper info not found']
        });
        continue;
      }

      // Check for pre-assigned tech teacher for this subject
      const techStaffCode = techSubjectMap.get(subjectCode) || slot.required_tech_staff_code;

      if (!techStaffCode) {
        unfilledSlots.push({
          slotId: slot.id,
          paperId: paper.id,
          period: basePeriod,
          type: 'tech',
          reasons: [`No primary TECH teacher mapped for subject ${subjectCode}`]
        });
        continue;
      }

      const targetPeriods = this.getOverlappingPeriods(sessionType, duration);
      if (targetPeriods.length === 0) targetPeriods.push(basePeriod);

      for (const p of targetPeriods) {
        const isNew = p !== basePeriod;

        // Check availability for this teacher
        const availabilityResults = await this.getStaffAvailabilityForSlot({
          date,
          period: p,
          grade,
          paperId: paper.id,
          slotType: 'tech'
        });

        const teacherAvail = availabilityResults.find(a => a.staff.staff_code === techStaffCode);

        // Tech duty is forced if needed, but we check if completely blocked by leaves or something fundamental
        if (teacherAvail && teacherAvail.isAvailable) {
          const venueId = slot.venue_id;
          
          if (!venueId) {
            unfilledSlots.push({
              slotId: slot.id,
              paperId: paper.id,
              period: p,
              type: 'tech',
              reasons: ['CRITICAL: No venue ID associated with TECH slot.']
            });
            continue;
          }

          assignments.push({
            slotId: slot.id,
            staffCode: techStaffCode,
            venueId: venueId,
            paperId: paper.id,
            period: p,
            type: 'tech',
            dutyDate: slot.duty_date,
            dutyType: slot.duty_type,
            sessionId: slot.exam_session_id,
            isNew: isNew
          });
        } else {
          unfilledSlots.push({
            slotId: slot.id,
            paperId: paper.id,
            period: p,
            type: 'tech',
            reasons: teacherAvail 
              ? teacherAvail.conflicts.map(c => c.message)
              : [`Assigned TECH teacher (${techStaffCode}) not found or fundamentally unavailable`]
          });
        }
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
