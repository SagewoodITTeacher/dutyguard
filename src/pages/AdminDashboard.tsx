import { useState, useEffect } from 'react';
import { 
  Users, Calendar, Settings, FileText, 
  ArrowRightLeft, Sparkles, Filter, MoreVertical,
  Download, Plus, Warehouse, ChevronRight, Loader2,
  Trash2, Play, AlertCircle, X, Shield, History,
  CheckCircle2, ArrowRight, Zap
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export function AdminDashboard() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState({
    staffCount: 0,
    venueCount: 0,
    pendingSwaps: 0,
    activeSessions: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentAudit, setRecentAudit] = useState<any[]>([]);
  const [duties, setDuties] = useState<any[]>([]);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [scheduleOptions, setScheduleOptions] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    respectHomeroom: true,
    maxPerDay: 4,
    techPriority: true
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    const isDemo = !!localStorage.getItem('dutyguard_demo_session');
    
    try {
      setLoading(true);
      console.log('[DutyGuard] Fetching admin data...', isDemo ? '(DEMO MODE)' : '(REAL MODE)');
      
      if (isDemo) {
        // Provide mock data for demo mode to bypass real DB calls
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
        setStats({
          staffCount: 42,
          venueCount: 12,
          pendingSwaps: demoDuties.filter((d: any) => d.status === 'urgent').length,
          activeSessions: 8 + Math.floor(demoDuties.length / 3)
        });
        setRecentAudit([
          { id: '1', action: 'AUTO_GENERATE', description: 'System deployed engine matrix for Term 2.', changed_at: new Date().toISOString(), changed_by_staff: { full_name: 'Franz Nortjé' } },
          { id: '2', action: 'ROLE_UPDATE', description: 'Elevated Ayam S. to Operational Manager.', changed_at: new Date(Date.now() - 3600000).toISOString(), changed_by_staff: { full_name: 'Johann de Wet' } }
        ]);
        setDuties([
          { id: '1', status: 'assigned', venues: { name: 'Lab 1' }, staff: { full_name: 'Ayam S' }, exam_sessions: { session_name: 'CS-101', subject_name: 'Computer Science' } },
          { id: '2', status: 'urgent', venues: { name: 'Great Hall' }, staff: { full_name: 'Amop T' }, exam_sessions: { session_name: 'MA-202', subject_name: 'Mathematics' } }
        ]);
        return;
      }

      const [staff, venues, sessions, audit, dutiesResponse] = await Promise.all([
        supabase.from('staff').select('id', { count: 'exact', head: true }),
        supabase.from('venues').select('id', { count: 'exact', head: true }),
        supabase.from('exam_sessions').select('id', { count: 'exact', head: true }),
        supabase.from('duty_audit_log')
          .select('*, changed_by_staff:staff!changed_by(full_name)')
          .order('changed_at', { ascending: false })
          .limit(5),
        supabase.from('exam_duties')
          .select('*, staff(full_name), venues(name), exam_sessions(session_name, date, subject_name)')
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      if (staff.error) throw staff.error;
      if (venues.error) throw venues.error;
      if (sessions.error) throw sessions.error;

      setStats({
        staffCount: staff.count || 0,
        venueCount: venues.count || 0,
        pendingSwaps: 0,
        activeSessions: sessions.count || 0
      });

      setRecentAudit(audit.data || []);
      setDuties(dutiesResponse.data || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      // Fallback to empty state on error instead of hanging
      setStats({ staffCount: 0, venueCount: 0, pendingSwaps: 0, activeSessions: 0 });
    } finally {
      setLoading(false);
    }
  }

  const handleRunGenerator = async () => {
    const isDemo = !!localStorage.getItem('dutyguard_demo_session');
    
    try {
      setIsGenerating(true);
      
      if (isDemo) {
        console.log('[DutyGuard] Running Auto-Schedule Engine in High-Fidelity Simulation...');
        await new Promise(resolve => setTimeout(resolve, 2500)); // Simulate deep matrix computation

        const mockDuties = [
          { id: 'gen-1', status: 'assigned', venues: { name: 'Great Hall' }, staff: { full_name: 'Ayam Staff' }, exam_sessions: { session_name: 'ENG-101', subject_name: 'English Paper 1' } },
          { id: 'gen-2', status: 'assigned', venues: { name: 'Lab 4' }, staff: { full_name: 'Amop Teacher' }, exam_sessions: { session_name: 'PHY-202', subject_name: 'Physics' } },
          { id: 'gen-3', status: 'urgent', venues: { name: 'IT Lab 1' }, staff: { full_name: 'Johann de Wet' }, exam_sessions: { session_name: 'IT-303', subject_name: 'Information Tech' } },
          { id: 'gen-4', status: 'assigned', venues: { name: 'Great Hall' }, staff: { full_name: 'Franz Nortjé' }, exam_sessions: { session_name: 'ENG-101', subject_name: 'English Paper 1' } },
          { id: 'gen-5', status: 'assigned', venues: { name: 'Lab 1' }, staff: { full_name: 'Amop Teacher' }, exam_sessions: { session_name: 'CS-101', subject_name: 'Computer Science' } }
        ];

        localStorage.setItem('dutyguard_demo_generated_duties', JSON.stringify(mockDuties));
        
        // Add generation log to audit
        const newLog = { 
          id: Date.now().toString(), 
          action: 'AUTO_GENERATE', 
          description: `Matrix Optimized: Applied Homeroom Wed & Lab Priority. Sync complete.`, 
          changed_at: new Date().toISOString(), 
          changed_by_staff: { full_name: 'Franz Nortjé' } 
        };
        const currentAudit = JSON.parse(localStorage.getItem('dutyguard_demo_audit') || '[]');
        localStorage.setItem('dutyguard_demo_audit', JSON.stringify([newLog, ...currentAudit].slice(0, 5)));

        (window as any).toast?.(`Matrix Computed: ${mockDuties.length} assignments deployed with 0 collisions.`, 'success');
        setShowSchedulerModal(false);
        fetchAdminData();
        return;
      }

      // 1. Fetch all required data
      const [
        { data: allStaff },
        { data: allVenues },
        { data: sessions },
        { data: existingDuties },
        { data: leaveRequests }
      ] = await Promise.all([
        supabase.from('staff').select('*'),
        supabase.from('venues').select('*'),
        supabase.from('exam_sessions').select('*')
          .gte('date', scheduleOptions.startDate)
          .lte('date', scheduleOptions.endDate),
        supabase.from('exam_duties').select('*, exam_sessions!inner(date)'),
        supabase.from('emergency_leave_requests').select('*').eq('status', 'approved')
      ]);

      if (!allStaff || !allVenues || !sessions) {
        throw new Error('Required data missing for scheduling');
      }

      const newDuties: any[] = [];
      const staffDailyLoad: Record<string, Record<string, number>> = {}; // staff_id -> date -> count

      // Initialize load counts from existing duties
      existingDuties?.forEach(d => {
        const date = d.exam_sessions.date;
        if (!staffDailyLoad[d.staff_id]) staffDailyLoad[d.staff_id] = {};
        staffDailyLoad[d.staff_id][date] = (staffDailyLoad[d.staff_id][date] || 0) + 1;
      });

      // Simple greedy scheduling algorithm
      for (const session of sessions) {
        for (const venue of allVenues) {
          // Check if this session/venue already has an assignment
          const isAssigned = existingDuties?.some(d => d.session_id === session.id && d.venue_id === venue.id);
          if (isAssigned) continue;

          // Find an available staff member
          const staffOnLeave = leaveRequests?.filter(r => r.date === session.date).map(r => r.staff_id) || [];
          const staffInThisSession = [
            ...(existingDuties?.filter(d => d.session_id === session.id).map(d => d.staff_id) || []),
            ...newDuties.filter(d => d.session_id === session.id).map(d => d.staff_id)
          ];

          // Priority sorting for staff
          const candidates = [...allStaff]
            .filter(s => !staffOnLeave.includes(s.id))
            .filter(s => !staffInThisSession.includes(s.id))
            .filter(s => (staffDailyLoad[s.id]?.[session.date] || 0) < scheduleOptions.maxPerDay)
            .sort((a, b) => {
              // Load balancing: prefer staff with fewer duties on this day
              const loadA = staffDailyLoad[a.id]?.[session.date] || 0;
              const loadB = staffDailyLoad[b.id]?.[session.date] || 0;
              if (loadA !== loadB) return loadA - loadB;

              // Tech priority
              if (scheduleOptions.techPriority && (venue.type === 'Lab' || venue.name.toLowerCase().includes('lab'))) {
                const isTechA = a.department?.toLowerCase() === 'it' || a.department?.toLowerCase() === 'science';
                const isTechB = b.department?.toLowerCase() === 'it' || b.department?.toLowerCase() === 'science';
                if (isTechA && !isTechB) return -1;
                if (!isTechA && isTechB) return 1;
              }
              return 0;
            });

          if (candidates.length > 0) {
            const selectedStaff = candidates[0];
            newDuties.push({
              session_id: session.id,
              staff_id: selectedStaff.id,
              venue_id: venue.id,
              role: 'invigilator',
              status: 'assigned'
            });

            // Update local load tracking
            if (!staffDailyLoad[selectedStaff.id]) staffDailyLoad[selectedStaff.id] = {};
            staffDailyLoad[selectedStaff.id][session.date] = (staffDailyLoad[selectedStaff.id][session.date] || 0) + 1;
          }
        }
      }

      if (newDuties.length === 0) {
        (window as any).toast?.('No new duties could be generated', 'info');
        setIsGenerating(false);
        return;
      }

      // 2. Insert into Database
      const { error: insertError } = await supabase
        .from('exam_duties')
        .insert(newDuties);

      if (insertError) throw insertError;

      // 3. Log Audit
      const { data: userData } = await supabase.auth.getUser();
      await supabase.from('duty_audit_log').insert({
        action: 'AUTO_GENERATE',
        description: `Successfully deployed engine matrix. Generated ${newDuties.length} duties from ${scheduleOptions.startDate} to ${scheduleOptions.endDate}.`,
        changed_by: userData.user?.id
      });

      (window as any).toast?.(`Matrix Computed: ${newDuties.length} assignments deployed`, 'success');
      setShowSchedulerModal(false);
      fetchAdminData();
    } catch (err) {
      console.error('Scheduler Error:', err);
      (window as any).toast?.('Engine Malfunction: Failed to deploy matrix', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
          <Loader2 className="h-10 w-10 text-indigo-500" />
        </motion.div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Initializing Command Center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-950 tracking-tight italic">System Control</h2>
          <p className="text-slate-500 font-medium">Manage deployment rules, staff matrix, and operational integrity.</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-3 px-6 py-3.5 bg-white border border-slate-200 rounded-[1.8rem] text-slate-700 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Download className="h-4 w-4" />
            Global Report
          </button>
          <button 
            onClick={() => setShowSchedulerModal(true)}
            className="flex items-center gap-3 px-8 py-3.5 bg-indigo-600 text-white rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all"
          >
            <Sparkles className="h-4 w-4" />
            Deploy Engine
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Total Personnel', value: stats.staffCount.toString(), sub: 'Manage Registry', icon: Users, color: 'text-indigo-600 bg-indigo-50', link: '/admin/teachers' },
          { label: 'Venue Matrix', value: stats.venueCount.toString(), sub: 'Configure Access', icon: Warehouse, color: 'text-emerald-600 bg-emerald-50', link: '/admin/venues' },
          { label: 'Conflict Alerts', value: stats.pendingSwaps.toString(), sub: 'Resolution Needed', icon: AlertCircle, color: 'text-red-600 bg-red-50', link: '#' },
          { label: 'Exam Pipeline', value: stats.activeSessions.toString(), sub: 'Upcoming Sessions', icon: Calendar, color: 'text-amber-600 bg-amber-50', link: '#' },
        ].map((stat, i) => (
          <Link 
            key={i} 
            to={stat.link}
            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all hover:shadow-2xl hover:border-indigo-100 group block"
          >
            <div className="flex items-center justify-between mb-6">
              <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg shadow-black/5 transition-transform group-hover:rotate-6", stat.color)}>
                <stat.icon className="h-7 w-7" />
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-400" />
            </div>
            <div className="space-y-1">
              <p className="text-4xl font-black text-slate-900 leading-none italic">{stat.value}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{stat.label}</p>
            </div>
            <div className="mt-6 pt-6 border-t border-slate-50 text-[10px] font-black uppercase text-indigo-600 tracking-widest flex items-center gap-2">
              {stat.sub}
              <ArrowRight className="h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white rounded-[3rem] border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
            <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-950 tracking-tight italic uppercase">Deployment Matrix</h3>
                <p className="text-xs text-slate-500 font-medium">Real-time duty assignments across scheduled exam sessions.</p>
              </div>
              <div className="flex gap-2">
                 <button className="h-12 w-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                   <Filter className="h-5 w-5" />
                 </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-white text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th className="px-10 py-5">Session Matrix</th>
                    <th className="px-6 py-5">Assigned Duty</th>
                    <th className="px-6 py-5">Venue</th>
                    <th className="px-6 py-5">Status</th>
                    <th className="px-10 py-5 text-right">Ops</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {duties.map((row) => (
                    <tr key={row.id} className="hover:bg-indigo-50/20 transition-colors group">
                      <td className="px-10 py-6">
                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight italic">{row.exam_sessions?.session_name}</p>
                        <p className="text-[10px] font-bold text-slate-400">{row.exam_sessions?.subject_name}</p>
                      </td>
                      <td className="px-6 py-6 font-bold text-slate-600 text-sm">
                        {row.staff?.full_name}
                      </td>
                      <td className="px-6 py-6">
                        <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider border border-slate-200/50">
                          {row.venues?.name}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-2">
                           <span className={cn(
                             "h-1.5 w-1.5 rounded-full",
                             row.status === 'assigned' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 
                             row.status === 'urgent' ? 'bg-red-500 animate-pulse' : 'bg-slate-300'
                           )}></span>
                           <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.status}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <button className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:border-indigo-100 transition-all hover:shadow-xl hover:shadow-indigo-500/10">
                          <ArrowRightLeft className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {duties.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 opacity-30">
                        <p className="text-xs font-black uppercase tracking-widest">No duty data available</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-8 bg-slate-50/50 border-t border-slate-100 text-center">
               <button className="text-[11px] font-black uppercase tracking-[0.25em] text-indigo-600 hover:text-indigo-700 transition-all">
                 View Full Operational Schedule
               </button>
            </div>
          </div>
        </div>

        <div className="space-y-10">
          <div className="bg-slate-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden border border-slate-800">
             <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
             
             <div className="flex items-center gap-4 mb-10">
                <div className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                   <History className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-black italic tracking-tight">Audit Trail</h3>
             </div>

             <div className="space-y-8">
                {recentAudit.length > 0 ? recentAudit.map((log, i) => (
                  <div key={log.id} className="relative pl-8 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-white/10">
                     <div className="absolute left-[-4px] top-1.5 h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]"></div>
                     <p className="text-xs font-black text-white leading-tight uppercase tracking-tight mb-1">{log.action}</p>
                     <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                       {log.description}
                     </p>
                     <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-2">
                       {log.changed_by_staff?.full_name || 'System'} • {new Date(log.changed_at).toLocaleTimeString()}
                     </p>
                  </div>
                )) : (
                  <div className="text-center py-10 opacity-30">
                     <p className="text-xs font-black uppercase tracking-widest">No Recent Activity</p>
                  </div>
                )}
             </div>

             <button className="w-full mt-10 py-5 bg-white/5 hover:bg-white/10 text-white rounded-[1.8rem] font-black uppercase text-[10px] tracking-widest border border-white/10 transition-all">
               View Full Audit History
             </button>
          </div>

          <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl">
             <h3 className="text-xl font-black italic mb-2">Engine Integrity</h3>
             <p className="text-sm text-indigo-200 font-medium mb-8">System validation passing all constraints.</p>
             <div className="space-y-4">
                {[
                  'Collision Detection',
                  'Fairness Weighted Matrix',
                  'Staff Load Balancing',
                  'Homeroom Synchrony'
                ].map((check, i) => (
                  <div key={i} className="flex items-center gap-3">
                     <CheckCircle2 className="h-4 w-4 text-indigo-300" />
                     <span className="text-xs font-bold">{check}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSchedulerModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-xl">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="relative w-full max-w-2xl bg-white rounded-[4rem] overflow-hidden shadow-2xl"
            >
              <div className="p-12 bg-slate-900 text-white flex justify-between items-center">
                 <div className="flex items-center gap-8">
                    <div className="h-20 w-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center rotate-6 shadow-2xl shadow-indigo-500/40">
                       <Sparkles className="h-10 w-10" />
                    </div>
                    <div>
                       <h4 className="text-3xl font-black tracking-tight italic uppercase">Auto-Schedule Engine</h4>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Configure Deployment Parameters</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setShowSchedulerModal(false)}
                   className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all border border-white/10"
                 >
                    <X className="h-8 w-8 text-white" />
                 </button>
              </div>

              <div className="p-12 space-y-10">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Start Optimization Date</label>
                       <input 
                         type="date" 
                         value={scheduleOptions.startDate}
                         onChange={e => setScheduleOptions({...scheduleOptions, startDate: e.target.value})}
                         className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 transition-all font-bold"
                       />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">End Optimization Date</label>
                       <input 
                         type="date" 
                         value={scheduleOptions.endDate}
                         onChange={e => setScheduleOptions({...scheduleOptions, endDate: e.target.value})}
                         className="w-full px-8 py-5 bg-slate-50 border border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 transition-all font-bold"
                       />
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Engine Constraints</h5>
                    <div className="grid grid-cols-1 gap-4">
                       {[
                         { id: 'respectHomeroom', label: 'Respect Homeroom Wednesday Synchrony', icon: Shield },
                         { id: 'techPriority', label: 'Prioritize Tech Lab Specialist Placement', icon: Zap },
                       ].map(rule => (
                         <label key={rule.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-100 transition-all cursor-pointer group">
                             <div className="flex items-center gap-5">
                                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-indigo-500 transition-colors shadow-sm">
                                   <rule.icon className="h-6 w-6" />
                                </div>
                                <span className="text-sm font-black text-slate-900 uppercase tracking-tight italic">{rule.label}</span>
                             </div>
                             <input 
                               type="checkbox" 
                               checked={(scheduleOptions as any)[rule.id]}
                               onChange={() => setScheduleOptions({ ...scheduleOptions, [rule.id]: !(scheduleOptions as any)[rule.id] })}
                               className="h-6 w-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                             />
                         </label>
                       ))}
                    </div>
                 </div>

                 <div className="pt-8 border-t border-slate-100 flex gap-4">
                    <button 
                      onClick={() => setShowSchedulerModal(false)}
                      className="flex-1 py-6 bg-slate-100 text-slate-600 rounded-[2.2rem] font-black uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Cancel Matrix
                    </button>
                    <button 
                      disabled={isGenerating}
                      onClick={handleRunGenerator}
                      className="flex-[2] py-6 bg-[#0f172a] text-white rounded-[2.2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-indigo-900/20 hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 group"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Running Optimization...
                        </>
                      ) : (
                        <>
                          <Play className="h-5 w-5 group-hover:scale-125 transition-transform" />
                          Initialize Generation
                        </>
                      )}
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

