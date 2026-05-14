import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line, Area, Cell
} from 'recharts';
import { 
  LayoutDashboard, TrendingUp, Calendar, Filter, 
  Download, Zap, CheckCircle2, Shield, Clock,
  ArrowRight, Users, BookOpen, AlertCircle, Loader2,
  CheckCircle, UserPlus, ChevronRight, MapPin, User,
  Droplets, Megaphone, Ghost, ShieldAlert, X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type WorkloadRow = Database['public']['Views']['vw_teacher_workload']['Row'];
type MarkingRow = Database['public']['Views']['vw_marking_schedule']['Row'];

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return date.toLocaleDateString();
}

const GET_ALERT_ICON = (type: string, subType?: string) => {
  if (type === 'leave') return ShieldAlert;
  switch (subType) {
    case 'bathroom': return Droplets;
    case 'paper': return BookOpen;
    case 'noise': return Megaphone;
    case 'toilet_paper': return Ghost;
    case 'sos': return AlertCircle;
    default: return Zap;
  }
};

export function ManagerDashboard() {
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [workloadData, setWorkloadData] = useState<WorkloadRow[]>([]);
  const [markingData, setMarkingData] = useState<MarkingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [availableStaff, setAvailableStaff] = useState<any[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchPendingAlerts();

    // Subscribe to realtime updates
    const helpSubscription = supabase
      .channel('help_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'help_requests' }, payload => {
        handleRealtimeEvent('Help Request', payload);
      })
      .subscribe();

    const leaveSubscription = supabase
      .channel('emergency_leave_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'emergency_leave_requests' }, payload => {
        handleRealtimeEvent('Emergency Leave', payload);
      })
      .subscribe();

    return () => {
      helpSubscription.unsubscribe();
      leaveSubscription.unsubscribe();
    };
  }, []);

  async function fetchAvailableStaff(sessionId: string) {
    try {
      setLoadingStaff(true);
      // 1. Get all staff
      const { data: allStaff, error: staffError } = await supabase
        .from('staff')
        .select('*');
      
      if (staffError) throw staffError;

      // 2. Get staff already assigned to this session
      const { data: assignedDuties, error: dutiesError } = await supabase
        .from('exam_duties')
        .select('staff_id')
        .eq('session_id', sessionId);

      if (dutiesError) throw dutiesError;

      const assignedStaffIds = assignedDuties?.map(d => d.staff_id) || [];
      
      // 3. Filter out assigned staff
      const available = (allStaff || []).filter(s => !assignedStaffIds.includes(s.id));
      setAvailableStaff(available);
    } catch (err) {
      console.error('Error fetching available staff:', err);
    } finally {
      setLoadingStaff(false);
    }
  }

  const handleReliefClick = (alert: any) => {
    const sessionId = alert.session_id || alert.duty?.session_id;
    if (!sessionId) {
      (window as any).toast?.('Cannot identify session for relief', 'error');
      return;
    }
    setSelectedAlert(alert);
    fetchAvailableStaff(sessionId);
  };

  const assignRelief = async (staffId: string) => {
    try {
      if (!selectedAlert) return;
      const sessionId = selectedAlert.session_id || selectedAlert.duty?.session_id;
      const venueId = selectedAlert.duty?.venue_id;

      // 1. Create new duty for relief teacher
      const { error: dutyError } = await supabase
        .from('exam_duties')
        .insert({
          session_id: sessionId,
          staff_id: staffId,
          venue_id: venueId || '', // Defaulting to same venue if help request
          role: 'invigilator',
          status: 'assigned'
        });

      if (dutyError) throw dutyError;

      // 2. Resolve the original request
      const table = selectedAlert.type === 'help' ? 'help_requests' : 'emergency_leave_requests';
      const { error: resolveError } = await supabase
        .from(table)
        .update({ status: 'resolved' })
        .eq('id', selectedAlert.id);

      if (resolveError) throw resolveError;

      (window as any).toast?.('Relief Teacher Assigned Successfully', 'success');
      setSelectedAlert(null);
      fetchPendingAlerts();
      fetchDashboardData();
    } catch (err) {
      console.error('Error assigning relief:', err);
      (window as any).toast?.('Failed to assign relief', 'error');
    }
  };

  async function fetchPendingAlerts() {
    const isDemo = !!localStorage.getItem('dutyguard_demo_session');
    
    try {
      if (isDemo) {
        setActiveAlerts([
          { 
            id: 'a1', 
            type: 'help', 
            request_type: 'bathroom', 
            created_at: new Date(Date.now() - 300000).toISOString(),
            duty: { staff: { full_name: 'Ayam Staff' }, venue: { name: 'Great Hall' } } 
          },
          { 
            id: 'a2', 
            type: 'leave', 
            reason: 'Medical emergency - needs immediate relief.', 
            created_at: new Date(Date.now() - 600000).toISOString(),
            staff: { full_name: 'Amop Teacher' },
            session_id: 's1'
          }
        ]);
        return;
      }

      const { data: help, error: helpErr } = await supabase
        .from('help_requests')
        .select('*, duty:duties(staff:staff(full_name), venue:venues(name))')
        .eq('status', 'pending');
      
      const { data: leave, error: leaveErr } = await supabase
        .from('emergency_leave_requests')
        .select('*, staff:staff(full_name)')
        .eq('status', 'pending');

      if (helpErr || leaveErr) throw helpErr || leaveErr;
      
      const combined = [
        ...(help || []).map(h => ({ ...h, type: 'help' })),
        ...(leave || []).map(l => ({ ...l, type: 'leave' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setActiveAlerts(combined);
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  }

  const handleRealtimeEvent = (title: string, payload: any) => {
    if (payload.eventType === 'INSERT') {
      (window as any).toast?.(`New ${title} Received`, 'error');
    }
    fetchDashboardData();
    fetchPendingAlerts();
  };

  const resolveAlert = async (alert: any) => {
    try {
      const table = alert.type === 'help' ? 'help_requests' : 'emergency_leave_requests';
      const { error } = await supabase
        .from(table)
        .update({ status: 'resolved' })
        .eq('id', alert.id);

      if (error) throw error;
      (window as any).toast?.('Situation Resolved', 'success');
      fetchPendingAlerts();
    } catch (err) {
      console.error('Error resolving alert:', err);
    }
  };

  async function fetchDashboardData() {
    const isDemo = !!localStorage.getItem('dutyguard_demo_session');

    try {
      setLoading(true);
      console.log('[DutyGuard] Fetching manager data...', isDemo ? '(DEMO MODE)' : '(REAL MODE)');

      if (isDemo) {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
        setWorkloadData([
          { full_name: 'Franz Nortjé', invigilation_count: 5, standby_count: 2, tech_duty_count: 0, total_duties: 7 },
          { full_name: 'Johann de Wet', invigilation_count: 3, standby_count: 4, tech_duty_count: 1, total_duties: 8 },
          { full_name: 'Ayam Staff', invigilation_count: 8, standby_count: 1, tech_duty_count: 0, total_duties: 9 }
        ] as any);
        setMarkingData([
          { subject_id: '1', subject_name: 'English Paper 1', writing_date: '2024-05-20', status: 'Completed' },
          { subject_id: '2', subject_name: 'Mathematics', writing_date: '2024-05-22', status: 'Marking' },
          { subject_id: '3', subject_name: 'Physical Sciences', writing_date: '2024-05-25', status: 'Not Written' }
        ] as any);
        return;
      }
      
      const { data: workload, error: workloadError } = await supabase
        .from('vw_teacher_workload')
        .select('*');

      if (workloadError) throw workloadError;
      setWorkloadData(workload || []);

      const { data: marking, error: markingError } = await supabase
        .from('vw_marking_schedule')
        .select('*');

      if (markingError) throw markingError;
      setMarkingData(marking || []);

    } catch (err) {
      console.error('Error fetching manager dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
     return (
       <div className="flex flex-col items-center justify-center min-h-screen">
         <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="mb-4"
         >
           <Loader2 className="h-12 w-12 text-[#0f172a]" />
         </motion.div>
         <p className="text-[#0f172a] font-black uppercase tracking-[0.3em] text-[10px]">Syncing Operational Data...</p>
       </div>
     );
  }

  // Transform views into chart data
  const chartData = workloadData.map(w => ({
    name: w.full_name?.split(' ').map((n, i, arr) => i === arr.length - 1 ? n : n[0] + '.').join(' '),
    invigilation: w.invigilation_count || 0,
    standby: w.standby_count || 0,
    tech: w.tech_duty_count || 0,
    total: w.total_duties || 0
  }));

  return (
    <div className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000 bg-slate-50/20 p-6 lg:p-10 rounded-[5rem]">
      
      {/* Strategic Command Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-4 px-4">
        <div className="space-y-2">
          <div className="flex items-center gap-5">
             <div className="h-20 w-20 bg-[#0f172a] rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-900/10 group hover:scale-105 transition-all">
                <LayoutDashboard className="h-10 w-10 text-white group-hover:rotate-6 transition-transform" />
             </div>
             <div className="space-y-0.5">
               <h2 className="text-4xl lg:text-5xl font-black text-[#0f172a] tracking-tight italic">Operations Hub</h2>
               <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.4em] pl-1">
                 Strategic Intelligence • <span className="text-indigo-600">Final Exams 2024</span>
               </p>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-5 bg-white p-4 rounded-[3rem] shadow-sm border border-slate-100/60">
           <div className="hidden sm:flex flex-col items-end mr-8 pl-6 border-r border-slate-100 pr-8">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Alert Network</p>
              <div className="flex items-center gap-2.5">
                 <span className="flex h-2.5 w-2.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                 </span>
                 <p className="text-sm font-black text-red-600 italic">{activeAlerts.length.toString().padStart(2, '0')} Requests Hot</p>
              </div>
           </div>
           <button className="flex items-center gap-4 px-10 py-6 bg-[#0f172a] text-white rounded-[2.2rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-indigo-900/10 hover:bg-indigo-600 transition-all hover:scale-105 active:scale-95 group">
              <Zap className="h-6 w-6 group-hover:fill-current" />
              Pulse Control
           </button>
        </div>
      </div>

      {/* Real-time Activity Feed / Command Center */}
      <AnimatePresence>
        {activeAlerts.length > 0 && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 overflow-hidden"
          >
            <div className="bg-white border-2 border-red-50 rounded-[4rem] p-10 shadow-2xl shadow-red-500/5 relative overflow-hidden">
               {/* Background Glow */}
               <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-500/5 rounded-full -mr-[250px] -mt-[250px] blur-3xl"></div>
               
               <div className="flex items-center justify-between mb-10 relative z-10">
                  <div className="flex items-center gap-6">
                     <div className="h-16 w-16 bg-red-500 rounded-[1.8rem] flex items-center justify-center text-white shadow-xl shadow-red-500/20">
                        <ShieldAlert className="h-8 w-8 animate-pulse" />
                     </div>
                     <div>
                       <h4 className="text-2xl font-black text-[#0f172a] tracking-tight italic">Live Tactical Feed</h4>
                       <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] uppercase">Emergency Response Protocol: Active</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3 bg-red-50 px-6 py-3 rounded-2xl border border-red-100">
                     <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                     <span className="text-[11px] font-black text-red-600 uppercase tracking-widest">{activeAlerts.length} Active Situation{activeAlerts.length !== 1 ? 's' : ''}</span>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
                  {activeAlerts.map((alert, i) => {
                    const Icon = GET_ALERT_ICON(alert.type, alert.request_type);
                    return (
                      <motion.div 
                        key={alert.id}
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-slate-50/50 border border-slate-100 rounded-[2.5rem] p-8 flex flex-col justify-between hover:bg-white hover:border-red-100 transition-all hover:shadow-2xl hover:shadow-red-500/10 group"
                      >
                         <div className="space-y-6">
                            <div className="flex justify-between items-start">
                               <div className={cn(
                                 "h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-lg",
                                 alert.type === 'leave' ? "bg-red-600 shadow-red-500/20" : "bg-indigo-600 shadow-indigo-500/20"
                               )}>
                                  <Icon className="h-7 w-7" />
                               </div>
                               <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-slate-100">
                                 {formatRelativeTime(alert.created_at)}
                               </span>
                            </div>

                            <div className="space-y-1">
                               <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{alert.type === 'help' ? 'Help Request' : 'Emergency Exit'}</p>
                               <h5 className="text-xl font-black text-slate-900 tracking-tight italic uppercase">
                                 {alert.type === 'help' ? alert.request_type.replace('_', ' ') : 'SOS Relief'}
                               </h5>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-100">
                               <div className="flex items-center gap-3 text-slate-600">
                                  <User className="h-4 w-4 text-indigo-400" />
                                  <span className="text-xs font-bold">{alert.staff?.full_name || alert.duty?.staff?.full_name || 'Anonymous Staff'}</span>
                               </div>
                               {alert.duty?.venue?.name && (
                                 <div className="flex items-center gap-3 text-slate-600">
                                    <MapPin className="h-4 w-4 text-emerald-400" />
                                    <span className="text-xs font-bold">{alert.duty.venue.name}</span>
                                 </div>
                               )}
                               {alert.reason && (
                                 <p className="text-[11px] text-slate-500 italic bg-white p-3 rounded-xl border border-slate-100 line-clamp-2">
                                   "{alert.reason}"
                                 </p>
                               )}
                            </div>
                         </div>

                         <div className="flex gap-3 mt-8">
                            <button 
                              onClick={() => resolveAlert(alert)}
                              className="flex-1 bg-white border border-slate-200 py-4 rounded-2xl flex items-center justify-center gap-3 group/btn hover:border-emerald-500 hover:bg-emerald-50 transition-all"
                            >
                               <CheckCircle className="h-4 w-4 text-slate-400 group-hover/btn:text-emerald-500" />
                               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover/btn:text-emerald-600 font-black">Resolve</span>
                            </button>
                            <button 
                              onClick={() => handleReliefClick(alert)}
                              className="flex-1 bg-[#0f172a] py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all shadow-lg shadow-slate-900/10"
                            >
                               <UserPlus className="h-4 w-4 text-indigo-400" />
                               <span className="text-[10px] font-black uppercase tracking-widest text-white">Relief</span>
                            </button>
                         </div>
                      </motion.div>
                    );
                  })}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Relief Assignment Modal */}
      <AnimatePresence>
        {selectedAlert && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAlert(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="relative w-full max-w-2xl bg-white rounded-[4rem] overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-10 bg-indigo-600 text-white flex justify-between items-center">
                 <div className="flex items-center gap-6">
                    <div className="h-16 w-16 bg-white/20 rounded-[1.8rem] flex items-center justify-center backdrop-blur-xl">
                       <UserPlus className="h-8 w-8" />
                    </div>
                    <div>
                       <h4 className="text-2xl font-black tracking-tight italic uppercase">Select Relief Staff</h4>
                       <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Scanning Available Teachers for Tactical Deployment</p>
                    </div>
                 </div>
                 <button 
                   onClick={() => setSelectedAlert(null)}
                   className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all"
                 >
                    <X className="h-6 w-6" />
                 </button>
              </div>

              <div className="p-10 max-h-[500px] overflow-y-auto">
                 {loadingStaff ? (
                   <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                         <Loader2 className="h-10 w-10 text-indigo-500" />
                      </motion.div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scanning Staff Matrix...</p>
                   </div>
                 ) : availableStaff.length === 0 ? (
                   <div className="text-center py-20">
                      <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                         <Users className="h-10 w-10 text-slate-300" />
                      </div>
                      <p className="text-xl font-black text-slate-900 tracking-tight italic">No Available Relief Found</p>
                      <p className="text-sm text-slate-400 mt-2">All staff members are currently assigned to active duties.</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 gap-4">
                      {availableStaff.map((staff) => (
                        <motion.button
                          key={staff.id}
                          whileHover={{ x: 10 }}
                          onClick={() => assignRelief(staff.id)}
                          className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:bg-white hover:border-indigo-100 hover:shadow-xl transition-all group"
                        >
                           <div className="flex items-center gap-6">
                              <div className="h-14 w-14 bg-white rounded-2xl border border-slate-100 flex items-center justify-center shadow-sm group-hover:bg-indigo-50 group-hover:border-indigo-100 transition-colors">
                                 <span className="text-base font-black text-indigo-600 italic">
                                   {staff.full_name.split(' ').map((n: string) => n[0]).join('')}
                                 </span>
                              </div>
                              <div className="text-left">
                                 <p className="text-lg font-black text-slate-900 tracking-tight italic uppercase">{staff.full_name}</p>
                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{staff.department || 'General Staff'}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="px-5 py-2.5 bg-white rounded-xl border border-slate-200">
                                 <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">DEPLOY</span>
                              </div>
                              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-indigo-400" />
                           </div>
                        </motion.button>
                      ))}
                   </div>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Grade Triage Filter */}
      <div className="px-4">
        <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-[3.5rem] border border-slate-200/40 shadow-sm w-fit">
          <div className="flex items-center gap-3 px-6 border-r border-slate-100 mr-2">
            <Filter className="h-5 w-5 text-slate-400" />
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Division</span>
          </div>
          {['All', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((grade) => (
            <button
              key={grade}
              onClick={() => setSelectedGrade(grade)}
              className={cn(
                "px-10 py-4 rounded-full text-[12px] font-black uppercase tracking-widest transition-all relative overflow-hidden",
                selectedGrade === grade 
                  ? "bg-[#0f172a] text-white shadow-2xl shadow-indigo-900/20 scale-105" 
                  : "text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50"
              )}
            >
              {grade}
            </button>
          ))}
        </div>
      </div>

      {/* Analytic Bento Grid */}
      <div className="grid grid-cols-12 gap-10 px-4">
        
        {/* Core KPI Tiles */}
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-10">
           {[
             { label: 'Managed Venues', val: '14 / 14', sub: 'Standard Compliance', icon: Shield, color: 'bg-indigo-50 text-indigo-600' },
             { label: 'Efficiency Index', val: '94.2%', sub: 'Optimized Workflow', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
             { label: 'Marking Delta', val: '+0.8d', sub: 'Ahead of Schedule', icon: Clock, color: 'bg-amber-50 text-amber-600' },
             { label: 'Active Alerts', val: activeAlerts.length.toString(), sub: 'Urgent Processing', icon: Zap, color: 'bg-purple-50 text-purple-600' },
           ].map((kpi, i) => (
             <motion.div 
               whileHover={{ y: -10 }}
               key={i} 
               className="bg-white p-10 rounded-[4.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col justify-between group hover:border-indigo-100 transition-all cursor-default"
             >
                <div className="flex justify-between items-start mb-8">
                   <div className={cn("h-16 w-16 rounded-[1.8rem] flex items-center justify-center transition-all group-hover:rotate-6", kpi.color)}>
                      <kpi.icon className="h-7 w-7" />
                   </div>
                   <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-[12px]">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Live</span>
                   </div>
                </div>
                <div>
                   <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-2.5">{kpi.label}</p>
                   <p className="text-5xl font-black text-slate-900 tracking-tighter italic leading-none">{kpi.val}</p>
                   <p className="text-[11px] font-bold text-slate-400 mt-5 flex items-center gap-2 opacity-60">
                      <ArrowRight className="h-3.5 w-3.5" /> {kpi.sub}
                   </p>
                </div>
             </motion.div>
           ))}
        </div>

        {/* Workload Matrix */}
        <div className="col-span-12 bg-white p-14 rounded-[5.5rem] border border-slate-100 shadow-[0_45px_110px_-20px_rgba(0,0,0,0.06)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-16 opacity-5 pointer-events-none">
             <Users className="h-[400px] w-[400px] text-indigo-900" />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-20 relative z-10">
            <div className="space-y-1.5">
              <div className="flex items-center gap-4">
                 <Users className="h-8 w-8 text-indigo-600" />
                 <h3 className="text-4xl font-black text-[#0f172a] italic">Staff Load Matrix</h3>
              </div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] pl-1.5">Total Duty Allocation Breakdown Per Resource</p>
            </div>
            
            <div className="flex flex-wrap gap-10 bg-slate-50/80 backdrop-blur-sm p-7 rounded-[3rem] border border-slate-100 shadow-inner">
              {[
                { label: 'Invigilation', color: 'bg-[#4f46e5]' },
                { label: 'Stand-by', color: 'bg-[#f59e0b]' },
                { label: 'Break duties', color: 'bg-[#10b981]' },
                { label: 'Tech support', color: 'bg-[#9333ea]' },
              ].map(leg => (
                <div key={leg.label} className="flex items-center gap-3.5">
                  <div className={cn("h-4.5 w-4.5 rounded-full shadow-lg border-2 border-white", leg.color)}></div>
                  <span className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-600">{leg.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="h-[650px] w-full relative z-10 pr-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" barSize={38} margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 13, fontStyle: 'italic', fontWeight: 900, fill: '#1e293b' }}
                  width={120}
                />
                <Tooltip 
                   cursor={{ fill: '#f8fafc', radius: 24 }}
                   contentStyle={{ borderRadius: '32px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.2)', padding: '28px' }}
                />
                <Bar dataKey="invigilation" stackId="a" fill="#4f46e5" radius={[0, 0, 0, 0]} />
                <Bar dataKey="standby" stackId="a" fill="#f59e0b" />
                <Bar dataKey="tech" stackId="a" fill="#9333ea" radius={[0, 18, 18, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lifecycle Gantt */}
        <div className="col-span-12 bg-white p-14 rounded-[5.5rem] border border-slate-100 shadow-[0_45px_110px_-20px_rgba(0,0,0,0.06)] overflow-hidden mb-10">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-10 mb-20 px-4">
              <div className="space-y-1.5">
                 <div className="flex items-center gap-4">
                    <BookOpen className="h-8 w-8 text-indigo-600" />
                    <h3 className="text-4xl font-black text-[#0f172a] italic">Marking Lifecycle Gantt</h3>
                 </div>
                 <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] pl-1.5">Real-time Stage Progression: 20 May – 24 June Cycle</p>
              </div>
              <div className="flex items-center gap-5">
                 <div className="flex items-center gap-5 px-10 py-6 bg-slate-50 rounded-[3rem] border border-slate-100 group hover:shadow-xl transition-all">
                    <Calendar className="h-6 w-6 text-indigo-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 italic">Live Session: May – June 2024</span>
                 </div>
              </div>
           </div>

           <div className="overflow-x-auto pb-10">
              <div className="min-w-[900px] space-y-12">
                 {/* Gantt Header Timeline */}
                 <div className="grid grid-cols-12 gap-8 px-12 pb-10 border-b border-slate-100 relative">
                    <div className="col-span-4 text-[11px] font-black text-slate-300 uppercase tracking-widest italic">Inventory / Subject Allocation</div>
                    <div className="col-span-8 flex justify-between px-6 relative z-10">
                       {['20 May', '30 May', '10 June', '20 June', '24 June'].map(d => (
                         <span key={d} className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{d}</span>
                       ))}
                    </div>
                    {/* Green Today Line - Manually positioned at approx 10 June (Day 21 of approx 35 day range) */}
                    <div className="absolute left-[62%] top-0 h-[1000px] w-px bg-emerald-500/30 z-[5] pointer-events-none group translate-x-[1px]">
                       <div className="absolute top-0 -translate-x-1/2 flex flex-col items-center gap-4">
                          <div className="bg-emerald-500 shadow-xl shadow-emerald-500/30 text-white text-[10px] font-black px-5 py-2 rounded-full uppercase tracking-widest">Today</div>
                          <div className="w-[3px] h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                       </div>
                    </div>
                 </div>

                 {/* Gantt Rows */}
                 <div className="space-y-7 px-4">
                    {markingData.map((item, i) => {
                      // Calculate positions relative to a fixed range for the gantt demo
                      // In a real app we'd use dayjs to calculate offsets
                      const startOffset = i % 3 * 5; 
                      const width = 25 + (i * 10) % 50;
                      
                      return (
                      <motion.div 
                       initial={{ opacity: 0, x: -30 }}
                       whileInView={{ opacity: 1, x: 0 }}
                       viewport={{ once: true }}
                       transition={{ delay: i * 0.1 }}
                       key={item.subject_id} 
                       className="grid grid-cols-12 gap-8 items-center group"
                      >
                         <div className="col-span-4 flex items-center gap-6 pl-6 transition-all group-hover:translate-x-3">
                            <div className="h-14 w-14 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-[11px] font-black text-slate-300 border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-xl transition-all">
                               {idxToLetter(i)}
                            </div>
                            <div className="space-y-0.5">
                               <p className="text-lg font-black text-[#0f172a] leading-none mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight italic">{item.subject_name}</p>
                               <div className="flex items-center gap-4">
                                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Writing: {item.writing_date}</p>
                                  <span className="h-1 w-1 rounded-full bg-slate-200"></span>
                                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{item.status}</span>
                               </div>
                            </div>
                         </div>
                         <div className="col-span-8 relative h-16 bg-slate-50/40 rounded-[2.5rem] border border-slate-100 shadow-inner overflow-hidden group-hover:bg-slate-50 transition-colors">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${width}%` }}
                              transition={{ duration: 1.8, type: 'spring', bounce: 0.1 }}
                              className={cn(
                                "absolute top-0 bottom-0 flex items-center px-8 transition-all shadow-xl",
                                item.status === 'Completed' 
                                  ? "bg-emerald-500 shadow-emerald-400/20" 
                                  : item.status === 'Not Written' 
                                  ? "bg-slate-100 border-2 border-slate-200 border-dashed opacity-40 grayscale" 
                                  : "bg-indigo-600 shadow-indigo-500/30"
                              )}
                              style={{ 
                                left: `${startOffset}%`,
                              }}
                            >
                               <div className="flex items-center gap-5 w-full">
                                  <span className={cn(
                                   "text-[10px] font-black uppercase tracking-[0.3em] truncate",
                                   item.status === 'Not Written' ? "text-slate-400" : "text-white"
                                  )}>
                                    {item.status}
                                  </span>
                                  {item.status === 'Marking' && <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden ml-4"><div className="h-full bg-white opacity-40 transition-all duration-1000" style={{ width: '68%' }}></div></div>}
                               </div>
                            </motion.div>
                         </div>
                      </motion.div>
                    )})}
                 </div>
                 
                 {/* Legend */}
                 <div className="flex flex-wrap items-center justify-end gap-12 mt-16 px-16 pt-12 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                       <div className="h-5 w-5 rounded-full bg-emerald-500 shadow-xl shadow-emerald-400/20 ring-4 ring-emerald-50"></div>
                       <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Moderating Stage</span>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="h-5 w-5 rounded-full bg-indigo-600 shadow-xl shadow-indigo-600/20 ring-4 ring-indigo-50"></div>
                       <span className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">Marking Active</span>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="h-5 w-5 rounded-[10px] bg-slate-100 border-2 border-slate-200 border-dashed"></div>
                       <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 italic">Not Written Yet</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}

function idxToLetter(idx: number) {
  return String.fromCharCode(65 + idx);
}
