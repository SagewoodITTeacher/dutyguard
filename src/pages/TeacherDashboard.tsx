import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, MapPin, BookOpen, AlertCircle, 
  Droplets, Megaphone, ArrowRight, ChevronRight, 
  CheckCircle2, Calendar, Ghost, ArrowRightLeft, 
  X, Shield, MoreVertical, LogOut, Phone,
  Signal, Wifi, Battery, Loader2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type TodayDuty = Database['public']['Views']['vw_today_duties']['Row'] & {
  start_time?: string;
  end_time?: string;
  exam_session_id?: number;
};

const HELP_OPTIONS = [
  { id: 'bathroom', label: 'Bathroom Break', icon: Droplets, color: 'bg-blue-500', type: 'bathroom' as const },
  { id: 'paper', label: 'Missing Paper', icon: BookOpen, color: 'bg-indigo-500', type: 'paper' as const },
  { id: 'toilet_paper', label: 'Toilet Paper', icon: Ghost, color: 'bg-stone-500', type: 'toilet_paper' as const },
  { id: 'noise', label: 'Noise Complaint', icon: Megaphone, color: 'bg-amber-50', type: 'noise' as const }, // Fixed color name if it was bg-amber-500
  { id: 'sos', label: 'SOS Emergency', icon: AlertCircle, color: 'bg-red-500', type: 'sos' as const },
];

export function TeacherDashboard() {
  const [duties, setDuties] = useState<TodayDuty[]>([]);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<any>(null);
  const [isHelpSent, setIsHelpSent] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveReason, setLeaveReason] = useState('');

  useEffect(() => {
    fetchStaffAndDuties();
  }, []);

  async function fetchStaffAndDuties() {
    const isDemo = !!localStorage.getItem('dutyguard_demo_session');
    const demoUserId = localStorage.getItem('dutyguard_demo_session');

    try {
      setLoading(true);
      
      if (isDemo) {
        console.log('[DutyGuard] Running Teacher Dashboard in Demo Mode');
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
        
        const isAyam = demoUserId === 'demo-ayam-uid' || demoUserId?.includes('ayam');
        
        setStaff({
          id: isAyam ? 'ayam-id' : 'amop-id',
          full_name: isAyam ? 'Ayam Staff' : 'Amop Teacher',
          email: `${isAyam ? 'ayam' : 'amop'}@school.edu`,
          staff_code: isAyam ? 'AYAM' : 'AMOP'
        });

        setDuties([
          { 
            id: 'd1', 
            staff_id: 'ayam-id', 
            role: 'Invigilator', 
            venue_name: 'Great Hall', 
            subject_name: 'English Paper 1', 
            start_time: '08:00', 
            end_time: '10:00',
            session_id: 's1'
          },
          { 
            id: 'd2', 
            staff_id: 'ayam-id', 
            role: 'Standby', 
            venue_name: 'Staff Room', 
            subject_name: 'Maths Literacy', 
            start_time: '11:00', 
            end_time: '13:00',
            session_id: 's2'
          },
          { 
            id: 'd3', 
            staff_id: 'ayam-id', 
            role: 'Invigilator', 
            venue_name: 'Lab 4', 
            subject_name: 'Physics', 
            start_time: '14:00', 
            end_time: '16:00',
            session_id: 's3'
          }
        ] as any);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn("[DutyGuard] No user found in Teacher Dashboard");
        return;
      }

      // Get staff profile from view which includes email
      const { data: staffData, error: staffError } = await supabase
        .from('vw_user_roles')
        .select('*')
        .eq('email', user.email)
        .single();

      if (!staffData) throw new Error('Staff data not found');
      setStaff(staffData);

      // Get duties from view - use full_schedule_grid if times are needed, but let's stick to today_duties for now if possible
      const { data: dutiesData, error: dutiesError } = await supabase
        .from('vw_today_duties')
        .select('*')
        .eq('staff_code', staffData.staff_code);

      if (dutiesError) throw dutiesError;
      setDuties(dutiesData || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }

  const getDutyStatus = (start: string, end: string) => {
    const now = new Date();
    // Assuming mock local time or real time
    // For demo, we parse 'HH:MM' into date objects for today
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    
    const startTime = new Date();
    startTime.setHours(startH, startM, 0);
    
    const endTime = new Date();
    endTime.setHours(endH, endM, 0);

    if (now > endTime) return 'finished';
    if (now >= startTime && now <= endTime) return 'active';
    return 'upcoming';
  };

  const handleCallHelp = async (type: Database['public']['Tables']['help_requests']['Row']['help_type']) => {
    try {
      // Find active duty to attach to
      const activeDuty = duties[0]; // Simplified for now since today_duties doesn't have times in schema
      
      if (!activeDuty) {
        alert('No duty found to request help for.');
        return;
      }

      const { error } = await supabase
        .from('help_requests')
        .insert({
          exam_session_id: activeDuty.exam_session_id || null, // Assuming exam_session_id is available or handled by DB
          help_type: type,
          status: 'pending',
          venue_id: activeDuty.venue_id,
          requester_staff_code: staff.staff_code,
          duty_date: activeDuty.duty_date
        } as any);

      if (error) throw error;

      setIsHelpSent(true);
      setShowHelpModal(false);
      setTimeout(() => setIsHelpSent(false), 4000);
    } catch (err) {
      console.error('Error sending help request:', err);
      alert('Failed to send help request. Please try again.');
    }
  };

  const handleLeaveRequest = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !staff) return;

      // Find active duty
      const activeDuty = duties[0];

      const { error } = await supabase
        .from('emergency_leave_requests')
        .insert({
          requester_staff_code: staff.staff_code,
          exam_session_id: activeDuty?.exam_session_id || null,
          reason: leaveReason,
          status: 'pending',
          duty_date: new Date().toISOString().split('T')[0] // Use current date
        } as any);

      if (error) throw error;

      setShowLeaveModal(false);
      setLeaveReason('');
      (window as any).toast?.('Emergency Signal Sent to Command', 'error');
    } catch (err) {
      console.error('Error sending leave request:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a]">
        <motion.div
           animate={{ rotate: 360 }}
           transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
           className="mb-4"
        >
          <Loader2 className="h-12 w-12 text-indigo-500" />
        </motion.div>
        <p className="text-white font-black uppercase tracking-[0.3em] text-[10px]">Loading Operations...</p>
      </div>
    );
  }

  const activeDuty = duties.find(d => getDutyStatus(d.start_time || '', d.end_time || '') === 'active');
  const completedCount = duties.filter(d => getDutyStatus(d.start_time || '', d.end_time || '') === 'finished').length;

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-white shadow-[0_50px_100px_-12px_rgba(0,0,0,0.25)] relative overflow-hidden flex flex-col border-[12px] border-slate-900 rounded-[3.5rem] font-sans selection:bg-indigo-100 mb-10">
      {/* iOS Style Status Bar */}
      <div className="h-10 w-full flex items-center justify-between px-8 pt-4 pb-2 shrink-0">
        <span className="text-[13px] font-bold text-slate-400 tabular-nums">17:02</span>
        <div className="h-7 bg-slate-900 w-36 rounded-b-2xl flex items-center justify-center">
          <div className="h-1 w-8 bg-slate-700 rounded-full"></div>
        </div>
        <div className="flex items-center gap-1.5 grayscale opacity-30">
          <Signal className="h-3 w-3" />
          <Wifi className="h-3 w-3" />
          <Battery className="h-3 w-3" />
        </div>
      </div>
      
      {/* Premium Header Container */}
      <header className="bg-[#0f172a] p-8 pt-6 text-white shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div className="space-y-1">
            <h3 className="text-2xl font-black tracking-tight leading-none italic">{staff?.full_name || 'Loading...'}</h3>
            <p className="text-[10px] uppercase font-black tracking-[0.25em] text-indigo-400 flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              On Duty: {activeDuty?.venue_name || 'Standby'}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all shadow-inner"><Calendar className="h-5 w-5" /></button>
            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all shadow-inner"><LogOut className="h-5 w-5" /></button>
          </div>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex items-center justify-between relative z-10"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-sm shadow-xl shadow-indigo-500/30">
              {staff?.full_name?.split(' ').map((n: string) => n[0]).join('') || '??'}
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300/60 mb-0.5">Active Session</p>
              <p className="text-sm font-bold tracking-tight">{activeDuty?.subject_name || 'No Active Subject'}</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Role</p>
             <p className="text-sm font-black text-indigo-400 uppercase">{activeDuty?.role || 'Teacher'}</p>
          </div>
        </motion.div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 space-y-8 scrollbar-hide">
        
        {/* Timeline Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" />
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Duty Timeline</h4>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
              {completedCount.toString().padStart(2, '0')} / {duties.length.toString().padStart(2, '0')} Duties
            </span>
          </div>

          <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[px] before:bg-slate-200 before:border-dashed">
            <div className="absolute left-[11.5px] top-4 bottom-4 w-px bg-slate-200/60 z-0"></div>
            {duties.map((p, idx) => {
              const status = getDutyStatus(p.start_time || '', p.end_time || '');
              return (
              <motion.div 
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "relative pl-10 transition-all duration-300",
                  status === 'active' ? "scale-100" : "opacity-50"
                )}
              >
                {/* Dot */}
                <div className={cn(
                  "absolute left-1 top-2.5 h-6 w-6 rounded-full border-4 border-slate-50 shadow-sm z-10 flex items-center justify-center transition-all",
                  status === 'active' ? "bg-indigo-600 ring-4 ring-indigo-100 scale-110" : 
                  status === 'finished' ? "bg-emerald-500" : "bg-white border-2 border-slate-200"
                )}>
                  {status === 'finished' && <CheckCircle2 className="h-3 w-3 text-white" />}
                  {status === 'active' && <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse"></div>}
                </div>
                
                <div className={cn(
                  "p-5 rounded-3xl border transition-all duration-500 relative overflow-hidden group shadow-sm",
                  status === 'active' 
                    ? "bg-white border-indigo-100 shadow-xl shadow-indigo-200/20" 
                    : "bg-white/60 border-slate-100 hover:bg-white hover:border-slate-200"
                )}>
                  {status === 'active' && <div className="absolute top-0 right-0 p-3"><div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div></div>}
                  
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-0.5">
                      <h5 className={cn("text-xs font-black uppercase tracking-tight", status === 'active' ? "text-slate-900" : "text-slate-600")}>
                        {p.role} Activity
                      </h5>
                      <div className="flex items-center gap-3">
                         <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {p.venue_name}
                        </p>
                        {status === 'active' && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 rounded-md">
                            <span className="h-1 w-1 rounded-full bg-indigo-500"></span>
                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-tighter">Live Now</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-slate-300 tabular-nums bg-slate-50 px-2 py-1 rounded-lg">
                      {p.start_time?.slice(0, 5)} - {p.end_time?.slice(0, 5)}
                    </span>
                  </div>
                  
                  {p.subject_name && (
                    <div className={cn(
                      "mt-3 pt-3 border-t border-slate-50 flex items-center justify-between",
                      status === 'active' ? "border-indigo-50" : ""
                    )}>
                       <div className="flex items-center gap-2">
                         <div className="h-2 w-2 rounded-full bg-indigo-400"></div>
                         <p className="text-[10px] font-bold text-slate-700 uppercase tracking-tight italic">{p.subject_name}</p>
                       </div>
                       <ChevronRight className="h-3 w-3 text-slate-300" />
                    </div>
                  )}
                </div>
              </motion.div>
            )})}
          </div>
        </div>

      </div>

      {/* Hero Interaction Bar */}
      <div className="px-8 pt-6 pb-12 bg-white border-t border-slate-100 shadow-[0_-15px_40px_rgba(0,0,0,0.04)] space-y-6">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowHelpModal(true)}
          className="w-full bg-[#0f172a] text-white p-6 rounded-[2.5rem] shadow-2xl shadow-slate-200 flex items-center justify-center gap-4 group relative overflow-hidden active:bg-indigo-600 transition-colors"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
            <AlertCircle className="h-7 w-7 text-indigo-400" />
          </motion.div>
          <span className="text-sm font-black uppercase tracking-[0.25em] italic">Call Assistance</span>
        </motion.button>
        
        <button 
          onClick={() => setShowLeaveModal(true)}
          className="w-full py-4 rounded-[1.8rem] border-2 border-dashed border-slate-200 text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <LogOut className="h-4 w-4" />
          Emergency Leave / Swap
        </button>
      </div>

      {/* Floating Alert HUD */}
      <AnimatePresence>
        {isHelpSent && (
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: -120, opacity: 1 }}
            exit={{ y: 150, opacity: 0 }}
            className="fixed bottom-0 left-8 right-8 z-[150]"
          >
            <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.4)] flex items-center gap-5 border border-white/10 backdrop-blur-xl">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                 <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-black uppercase tracking-[0.2em] leading-none mb-1">Help Confirmed</p>
                <p className="text-[11px] font-medium text-slate-400 italic">Stand-by response team is en route</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assistance Selection Modal */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center p-0">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowHelpModal(false)}
               className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
             />
            <motion.div 
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 30, stiffness: 300 }}
               className="bg-white w-full rounded-t-[4rem] p-10 pb-12 shadow-2xl relative z-20"
            >
              <div className="w-16 h-1.5 bg-slate-100 rounded-full mx-auto mb-10"></div>
              <div className="flex justify-between items-center mb-10">
                 <div className="space-y-1">
                   <h3 className="text-3xl font-black text-slate-900 tracking-tight italic leading-none">Assistance</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Select Support Logic Type</p>
                 </div>
                 <button onClick={() => setShowHelpModal(false)} className="h-12 w-12 bg-slate-50 flex items-center justify-center rounded-full hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"><X className="h-6 w-6" /></button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {HELP_OPTIONS.map((opt) => (
                  <motion.button
                    key={opt.id}
                    whileHover={{ x: 10 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCallHelp(opt.type)}
                    className="flex items-center gap-5 p-6 bg-slate-50/50 border border-slate-100 rounded-[2.5rem] hover:bg-white hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-50 transition-all group"
                  >
                    <div className={cn("h-14 w-14 rounded-2xl text-white shadow-xl flex items-center justify-center transition-transform group-hover:rotate-6", opt.color)}>
                      <opt.icon className="h-7 w-7" />
                    </div>
                    <div className="text-left">
                       <p className="text-base font-black text-slate-900 italic tracking-tight">{opt.label}</p>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">High Priority Notification</p>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                       <div className="h-2 w-2 rounded-full bg-slate-200 group-hover:bg-indigo-500 transition-colors"></div>
                       <ChevronRight className="h-6 w-6 text-slate-200 group-hover:text-indigo-600 transition-colors" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Emergency Leave / Swap Modal */}
      <AnimatePresence>
        {showLeaveModal && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center p-0">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowLeaveModal(false)}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
             />
            <motion.div 
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="bg-white w-full rounded-t-[4rem] p-10 pb-14 shadow-2xl relative z-20"
            >
              <div className="space-y-10">
                <div className="text-center">
                  <div className="h-20 w-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner shadow-red-100/50">
                    <AlertCircle className="h-10 w-10 animate-pulse" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-2 italic">Urgent Departure</h3>
                  <p className="text-slate-400 text-sm font-medium px-8 leading-relaxed">
                    Broadcast an SOS to all operations staff. Use only for strictly critical matters.
                  </p>
                </div>

                <div className="space-y-6">
                   <div className="p-6 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 flex justify-between items-center shadow-sm">
                      <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Impacted Duty</p>
                        <p className="text-base font-black text-indigo-900 tracking-tight italic">
                          {activeDuty ? `${activeDuty.role}: ${activeDuty.venue_name}` : 'No active duty'}
                        </p>
                      </div>
                      <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-indigo-300">
                        <MapPin className="h-6 w-6" />
                      </div>
                   </div>
                   
                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-4">Emergency Reason</label>
                     <textarea 
                       value={leaveReason}
                       onChange={(e) => setLeaveReason(e.target.value)}
                       className="w-full p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] resize-none focus:ring-8 focus:ring-red-500/5 focus:border-red-500 outline-none transition-all font-bold text-base text-slate-800 placeholder:text-slate-300 shadow-inner"
                       placeholder="Please specify urgency reason..."
                       rows={3}
                     />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <button 
                    onClick={() => setShowLeaveModal(false)}
                    className="py-6 bg-slate-100 text-slate-600 rounded-[2.2rem] font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all hover:bg-slate-200"
                  >
                    Discard
                  </button>
                  <button 
                    disabled={!leaveReason.trim()}
                    onClick={handleLeaveRequest}
                    className="py-6 bg-red-600 disabled:opacity-50 text-white rounded-[2.2rem] font-black uppercase tracking-widest text-[11px] shadow-[0_20px_40px_-12px_rgba(220,38,38,0.4)] active:scale-95 transition-all hover:bg-red-700"
                  >
                    Send Signal
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
