import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, MapPin, BookOpen, AlertCircle, 
  Droplets, Megaphone, ArrowRight, ChevronRight, 
  CheckCircle2, Calendar, Ghost, ArrowRightLeft, 
  X, Shield, MoreVertical, LogOut, Phone
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';

const PERIODS = [
  { id: 'p1', time: '07:50-08:40', label: 'P1: Session Start', room: 'Exam Hall A', status: 'finished' },
  { id: 'p2', time: '08:40-09:30', label: 'P2: Invigilation', room: 'Exam Hall A', status: 'finished', subject: 'Grade 12 English' },
  { id: 'p3', time: '09:30-10:20', label: 'P3: Invigilation', room: 'Exam Hall A', status: 'active', subject: 'Grade 12 English' },
  { id: 'b1', time: '10:20-10:45', label: 'B1: Morning Break', status: 'upcoming', room: 'Staff Room' },
  { id: 'p4', time: '10:45-11:35', label: 'P4: Session 2', room: 'Room 102', status: 'upcoming', subject: 'Grade 11 IT Theory' },
  { id: 'p5', time: '11:35-12:25', label: 'P5: Session 2', room: 'Room 102', status: 'upcoming', subject: 'Grade 11 IT Theory' },
  { id: 'p6', time: '12:25-13:15', label: 'P6: Session 2', room: 'Room 102', status: 'upcoming', subject: 'Grade 11 IT Theory' },
  { id: 'b2', time: '13:15-13:45', label: 'B2: Lunch Break', status: 'upcoming', room: 'Tuckshop' },
  { id: 'a1', time: '13:45-14:35', label: 'A1: Afternoon 1', room: 'IT Lab 1', status: 'upcoming' },
  { id: 'a2', time: '14:35-15:25', label: 'A2: Afternoon 2', room: 'IT Lab 1', status: 'upcoming' },
  { id: 'a3', time: '15:25-16:15', label: 'A3: Afternoon 3', room: 'IT Lab 1', status: 'upcoming' },
];

const HELP_OPTIONS = [
  { id: 'bathroom', label: 'Bathroom Break', icon: Droplets, color: 'bg-blue-500' },
  { id: 'paper', label: 'Missing Paper', icon: BookOpen, color: 'bg-indigo-500' },
  { id: 'toilet_paper', label: 'Toilet Paper', icon: Ghost, color: 'bg-stone-500' },
  { id: 'noise', label: 'Noise Complaint', icon: Megaphone, color: 'bg-amber-500' },
  { id: 'sos', label: 'SOS Emergency', icon: AlertCircle, color: 'bg-red-500' },
];

export function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'help' | 'leave'>('timeline');
  const [isHelpSent, setIsHelpSent] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  const handleCallHelp = async (type: string) => {
    setIsHelpSent(true);
    setShowHelpModal(false);
    setTimeout(() => setIsHelpSent(false), 3000);
  };

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-white shadow-2xl relative overflow-hidden flex flex-col border-[12px] border-slate-900 rounded-[3.5rem] font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Dynamic Island Status Bar */}
      <div className="h-7 bg-slate-900 w-36 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-2xl z-50 flex items-center justify-center">
        <div className="h-1 w-8 bg-slate-700 rounded-full"></div>
      </div>
      
      {/* Premium Header */}
      <header className="bg-[#0f172a] p-8 pt-12 text-white shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full -mr-24 -mt-24 blur-3xl"></div>
        <div className="flex justify-between items-start mb-8 relative z-10">
          <div className="space-y-1">
            <h3 className="text-2xl font-black tracking-tight leading-none">Franz Nortjé</h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-indigo-400 flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              On Duty: Hall A
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"><Calendar className="h-5 w-5" /></button>
            <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"><LogOut className="h-5 w-5" /></button>
          </div>
        </div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-5 flex items-center justify-between relative z-10"
        >
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-sm shadow-xl shadow-indigo-500/20">FN</div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-indigo-300/60 mb-0.5">Active Session</p>
              <p className="text-sm font-bold">Grade 12 English HL</p>
            </div>
          </div>
          <div className="text-right">
             <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Remaining</p>
             <p className="text-sm font-black text-indigo-400 tabular-nums">14:22</p>
          </div>
        </motion.div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 space-y-8 scrollbar-hide">
        
        {/* Timeline Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.25em]">Duty Timeline</h4>
            <span className="text-[10px] font-bold text-indigo-600 bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">03 / 11 Periods</span>
          </div>

          <div className="space-y-4 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-slate-200 before:border-dashed">
            {PERIODS.map((p, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={cn(
                  "relative pl-10 transition-all duration-300",
                  p.status === 'active' ? "scale-100" : "opacity-60"
                )}
              >
                {/* Dot */}
                <div className={cn(
                  "absolute left-1 top-2.5 h-6 w-6 rounded-full border-4 border-slate-50 shadow-sm z-10 flex items-center justify-center",
                  p.status === 'active' ? "bg-indigo-600 ring-4 ring-indigo-100" : 
                  p.status === 'finished' ? "bg-emerald-500" : "bg-white border-2 border-slate-200"
                )}>
                  {p.status === 'finished' && <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>
                
                <div className={cn(
                  "p-5 rounded-3xl border transition-all duration-500 relative overflow-hidden group",
                  p.status === 'active' 
                    ? "bg-white border-indigo-100 shadow-xl shadow-indigo-200/20" 
                    : "bg-white/60 border-slate-100 hover:bg-white hover:border-slate-200"
                )}>
                  {p.status === 'active' && <div className="absolute top-0 right-0 p-3"><div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div></div>}
                  
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-0.5">
                      <h5 className={cn("text-xs font-black tracking-tight", p.status === 'active' ? "text-slate-900" : "text-slate-600")}>{p.label}</h5>
                      <div className="flex items-center gap-3">
                         <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {p.room}
                        </p>
                        {p.status === 'active' && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 rounded-md">
                            <Clock className="h-2.5 w-2.5 text-indigo-400" />
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tighter">Live Now</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-slate-300 tabular-nums bg-slate-50 px-2 py-1 rounded-lg">{p.time.split('-')[0]}</span>
                  </div>
                  
                  {p.subject && (
                    <div className={cn(
                      "mt-3 pt-3 border-t border-slate-50 flex items-center justify-between",
                      p.status === 'active' ? "border-indigo-50" : ""
                    )}>
                       <div className="flex items-center gap-2">
                         <div className="h-2 w-2 rounded-full bg-indigo-400"></div>
                         <p className="text-[10px] font-bold text-slate-700 uppercase tracking-tight">{p.subject}</p>
                       </div>
                       <ChevronRight className="h-3 w-3 text-slate-300" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>

      {/* Hero Interaction Bar */}
      <div className="px-6 pt-5 pb-10 bg-white border-t border-slate-100 shadow-[0_-15px_40px_rgba(0,0,0,0.04)] space-y-5">
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowHelpModal(true)}
          className="w-full bg-indigo-600 text-white p-6 rounded-[2.5rem] shadow-2xl shadow-indigo-200 flex items-center justify-center gap-4 group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
            <AlertCircle className="h-7 w-7" />
          </motion.div>
          <span className="text-sm font-black uppercase tracking-[0.25em]">Call Assistance</span>
        </motion.button>
        
        <button 
          onClick={() => setActiveTab('leave')}
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
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-8 right-8 z-[100]"
          >
            <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] flex items-center gap-5 border border-white/10 backdrop-blur-xl">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
                 <CheckCircle2 className="h-7 w-7 text-white" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-black uppercase tracking-[0.2em] leading-none mb-1">Help Dispatched</p>
                <p className="text-[11px] font-medium text-slate-400 italic">Stand-by teacher is en route to Hall A</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assistance Selection Modal */}
      <AnimatePresence>
        {showHelpModal && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center p-0">
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
                   <h3 className="text-3xl font-black text-slate-900 tracking-tight italic">Assistance</h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Operational Readiness Control</p>
                 </div>
                 <button onClick={() => setShowHelpModal(false)} className="h-12 w-12 bg-slate-50 flex items-center justify-center rounded-full hover:bg-red-50 hover:text-red-600 transition-colors"><X className="h-6 w-6" /></button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {HELP_OPTIONS.map((opt) => (
                  <motion.button
                    key={opt.id}
                    whileHover={{ x: 10 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCallHelp(opt.label)}
                    className="flex items-center gap-5 p-6 bg-slate-50/50 border border-slate-100 rounded-[2.5rem] hover:bg-white hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-50 transition-all group"
                  >
                    <div className={cn("h-14 w-14 rounded-2xl text-white shadow-xl flex items-center justify-center transition-transform group-hover:rotate-6", opt.color)}>
                      <opt.icon className="h-7 w-7" />
                    </div>
                    <div className="text-left">
                       <p className="text-base font-black text-slate-900">{opt.label}</p>
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
        {activeTab === 'leave' && (
          <div className="fixed inset-0 z-[120] flex items-end justify-center p-0">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setActiveTab('timeline')}
               className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
             />
            <motion.div 
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="bg-white w-full rounded-t-[4rem] p-10 pb-12 shadow-2xl relative z-20"
            >
              <div className="space-y-10">
                <div className="text-center">
                  <div className="h-20 w-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner shadow-red-100/50">
                    <AlertCircle className="h-10 w-10 animate-pulse" />
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-2 italic">Emergency Leave</h3>
                  <p className="text-slate-400 text-sm font-medium px-8 leading-relaxed">
                    This request will be broadcast to all operations managers and stand-by teachers.
                  </p>
                </div>

                <div className="space-y-6">
                   <div className="p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 flex justify-between items-center">
                      <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Target Current Duty</p>
                        <p className="text-base font-black text-indigo-900 tracking-tight italic">P3: Grade 12 English HL</p>
                      </div>
                      <Shield className="h-8 w-8 text-indigo-100" />
                   </div>
                   
                   <div className="space-y-3">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Primary Emergency Reason</label>
                     <textarea 
                       className="w-full p-7 bg-slate-50 border border-slate-100 rounded-[2.5rem] resize-none focus:ring-8 focus:ring-red-500/5 focus:border-red-500 outline-none transition-all font-bold text-base text-slate-800 placeholder:text-slate-300 shadow-inner"
                       placeholder="Describe why you need to leave..."
                       rows={3}
                     />
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <button 
                    onClick={() => setActiveTab('timeline')}
                    className="py-6 bg-slate-100 text-slate-600 rounded-[2rem] font-black uppercase tracking-widest text-[11px] active:scale-95 transition-all hover:bg-slate-200"
                  >
                    Discard
                  </button>
                  <button 
                    onClick={() => { setActiveTab('timeline'); (window as any).toast('Emergency Broadcast Sent', 'error'); }}
                    className="py-6 bg-red-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-[0_20px_40px_-12px_rgba(220,38,38,0.4)] active:scale-95 transition-all hover:bg-red-700"
                  >
                    Submit Request
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
