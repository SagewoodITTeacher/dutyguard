import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clock, MapPin, BookOpen, AlertCircle, 
  Droplets, Megaphone, ArrowRight, ChevronRight, 
  CheckCircle2, Calendar, Ghost, ArrowRightLeft, 
  X, Shield, MoreVertical, LogOut
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';

const PERIODS = [
  { id: 'p1', time: '07:50-08:40', label: 'P1: Homeroom', room: 'Room 202', status: 'finished' },
  { id: 'p2', time: '08:40-10:20', label: 'P2-P3: Session 1', room: 'Room 104', status: 'active', subject: 'Grade 11 Maths' },
  { id: 'b1', time: '10:20-10:45', label: 'B1: Morning Break', status: 'upcoming' },
  { id: 'a1', time: '10:45-11:35', label: 'A1: Period 4', status: 'upcoming' },
  { id: 'a2', time: '11:35-12:25', label: 'A2: Period 5', status: 'upcoming' },
  { id: 'a3', time: '12:25-13:15', label: 'A3: Period 6', status: 'upcoming' },
];

const HELP_OPTIONS = [
  { id: 'bathroom', label: 'Bathroom Break', icon: Droplets, color: 'bg-blue-600' },
  { id: 'paper', label: 'Missing Paper', icon: BookOpen, color: 'bg-indigo-600' },
  { id: 'toilet_paper', label: 'Toilet Paper', icon: Ghost, color: 'bg-stone-600' },
  { id: 'noise', label: 'Noise Complaint', icon: Megaphone, color: 'bg-amber-600' },
  { id: 'sos', label: 'Emergency SOS', icon: AlertCircle, color: 'bg-red-600' },
];

export function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState<'timeline' | 'help' | 'leave'>('timeline');
  const [selectedDuty, setSelectedDuty] = useState<any>(null);
  const [isHelpSent, setIsHelpSent] = useState(false);

  // Mock data for internal logic
  const duties = [
    { 
      id: 'd1', 
      periodId: 'p2', 
      subject: 'Mathematics P1', 
      venue: 'Hall A', 
      role: 'Invigilator',
      status: 'upcoming'
    }
  ];

  const handleCallHelp = async (type: string) => {
    setIsHelpSent(true);
    // In production, insert into help_requests table
    setTimeout(() => setIsHelpSent(false), 3000);
  };

  return (
    <div className="max-w-[400px] mx-auto min-h-screen bg-slate-50 shadow-2xl relative overflow-hidden flex flex-col border-[8px] border-slate-800 rounded-[40px]">
      {/* Notch Simulation */}
      <div className="h-6 bg-slate-800 w-32 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-50"></div>
      
      {/* Mobile Header */}
      <header className="bg-indigo-700 p-6 pt-10 text-white shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div className="space-y-0.5">
            <p className="text-[10px] uppercase font-black tracking-widest opacity-60">Status: Active</p>
            <h3 className="text-xl font-bold tracking-tight">Dr. Sarah Chen</h3>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-xs font-bold">SC</div>
        </div>
        <div className="flex items-center gap-2 bg-indigo-800/50 p-2 rounded-xl border border-white/10">
          <MapPin className="h-3 w-3 opacity-70" />
          <p className="text-[10px] font-bold opacity-90">Invigilating Grade 11 Maths • Room 104</p>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Timeline Header */}
        <div className="flex justify-between items-center px-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Today's Schedule</p>
          <span className="text-[10px] text-indigo-600 font-black uppercase bg-indigo-50 px-2 py-0.5 rounded">Session 2/4</span>
        </div>

        {/* Vertical Timeline */}
        <div className="space-y-3">
          {PERIODS.map((p) => (
            <div 
              key={p.id}
              className={cn(
                "p-4 rounded-2xl border-l-4 transition-all",
                p.status === 'active' 
                  ? "bg-white border-indigo-600 shadow-lg shadow-indigo-100 ring-2 ring-indigo-600/5 scale-[1.02]" 
                  : p.status === 'finished'
                  ? "bg-slate-100 border-slate-300 opacity-60"
                  : "bg-white border-slate-100"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <p className={cn("text-sm font-bold", p.status === 'active' ? "text-indigo-900" : "text-slate-700")}>
                  {p.label}
                </p>
                <div className="flex flex-col items-end">
                  <p className="text-[10px] font-bold text-slate-400">{p.time}</p>
                  {p.status === 'active' && <span className="text-[8px] font-black uppercase text-indigo-600">Active Now</span>}
                </div>
              </div>
              <p className="text-[10px] font-medium text-slate-500">
                {p.room} {p.subject ? `• ${p.subject}` : ''}
              </p>
            </div>
          ))}
        </div>

        {/* Action Grid */}
        <div className="space-y-4 pt-2">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">On-Duty Controls</p>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => handleCallHelp('SOS')}
              className="bg-red-600 text-white p-5 rounded-3xl shadow-xl shadow-red-100 flex flex-col items-center gap-2 active:scale-95 transition-all group"
            >
              <AlertCircle className="h-6 w-6 group-hover:animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-wider">Call SOS</span>
            </button>
            <button 
              onClick={() => handleCallHelp('Paper')}
              className="bg-blue-600 text-white p-5 rounded-3xl shadow-xl shadow-blue-100 flex flex-col items-center gap-2 active:scale-95 transition-all"
            >
              <BookOpen className="h-6 w-6" />
              <span className="text-[10px] font-black uppercase tracking-wider">Papers</span>
            </button>
            <button 
              onClick={() => handleCallHelp('Break')}
              className="bg-white border border-slate-200 text-slate-700 p-5 rounded-3xl flex flex-col items-center gap-2 active:scale-95 transition-all shadow-sm"
            >
              <Clock className="h-6 w-6" />
              <span className="text-[10px] font-black uppercase tracking-wider">Break</span>
            </button>
            <button 
              onClick={() => setActiveTab('leave')}
              className="bg-white border border-slate-200 text-slate-700 p-5 rounded-3xl flex flex-col items-center gap-2 active:scale-95 transition-all shadow-sm"
            >
              <ArrowRightLeft className="h-6 w-6" />
              <span className="text-[10px] font-black uppercase tracking-wider">Swap</span>
            </button>
          </div>
        </div>
      </div>

      {/* Emergency Bottom Bar */}
      <div className="bg-slate-900 p-6 pb-10">
        <button 
          onClick={() => setActiveTab('leave')}
          className="w-full bg-slate-800 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-slate-700 hover:bg-red-900/20 active:scale-95 transition-all"
        >
          Urgent Leave Request
        </button>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {isHelpSent && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: -60, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-20 left-10 right-10 bg-emerald-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[100]"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-xs font-black uppercase tracking-wider">Help Request Sent!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave Modal */}
      <AnimatePresence>
        {activeTab === 'leave' && (
          <div className="fixed inset-0 z-[110] flex items-end justify-center p-0 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               className="bg-white w-full max-w-lg rounded-t-[32px] p-8 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-black text-slate-900">Emergency Leave</h3>
                 <button onClick={() => setActiveTab('timeline')} className="p-2 hover:bg-slate-50 rounded-full"><X className="h-5 w-5 text-slate-400" /></button>
              </div>
              <div className="space-y-4">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Affected Duty</label>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700">Mathematics P1 • Hall A</div>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Urgency Reason</label>
                    <textarea 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl resize-none focus:ring-2 focus:ring-red-500 outline-none transition-all font-medium text-sm"
                      placeholder="E.g. Medical emergency, family urgent matter..."
                      rows={3}
                    />
                 </div>
                 <button 
                   onClick={() => { setActiveTab('timeline'); (window as any).toast('Leave Request Submitted', 'success'); }}
                   className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-100 active:scale-95 transition-all"
                 >
                   Submit Urgent Request
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
