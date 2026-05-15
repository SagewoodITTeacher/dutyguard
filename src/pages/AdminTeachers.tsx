import { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Filter, Search, 
  MoreHorizontal, Mail, Shield, Award,
  Loader2, ArrowRight, ChevronRight,
  TrendingUp, Clock, BookOpen, CalendarX, 
  LayoutGrid, X, Check, Trash2, Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export function AdminTeachers() {
  const [search, setSearch] = useState('');
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [activeModal, setActiveModal] = useState<'role' | 'subjects' | 'leave' | 'timetable' | null>(null);

  // Modal States
  const [roleValue, setRoleValue] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [leaveData, setLeaveData] = useState({
    date: '',
    isFullDay: true,
    startTime: '07:30',
    endTime: '14:30',
    reason: ''
  });
  const [timetable, setTimetable] = useState<Record<string, string>>({});
  const [activeCycle, setActiveCycle] = useState('Cycle 1');

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    const isDemo = !!localStorage.getItem('dutyguard_demo_session');

    try {
      setLoading(true);
      
      if (isDemo) {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
        setStaff([
          { id: '1', full_name: 'Franz Nortjé', staff_code: 'FRAN', email: 'nortje.f@school.edu', department: 'Management', role: 'ADMIN' },
          { id: '2', full_name: 'Johann de Wet', staff_code: 'JOHD', email: 'johand.d@school.edu', department: 'Operations', role: 'OPS' },
          { id: '3', full_name: 'Ayam Staff', staff_code: 'AYAM', email: 'ayam@school.edu', department: 'Science', role: 'Scattered' },
          { id: '4', full_name: 'Amop Teacher', staff_code: 'AMOP', email: 'amop@school.edu', department: 'IT', role: 'Marathon' },
          { id: '5', full_name: 'Sarah Jenkins', staff_code: 'SJEN', email: 'jenkins.s@school.edu', department: 'English', role: 'Scattered' },
          { id: '6', full_name: 'Michael Chen', staff_code: 'MCHE', email: 'chen.m@school.edu', department: 'Mathematics', role: 'Marathon' },
          { id: '7', full_name: 'Elena Rodriguez', staff_code: 'EROD', email: 'rod.e@school.edu', department: 'Languages', role: 'Scattered' },
          { id: '8', full_name: 'David Smith', staff_code: 'DSMI', email: 'smith.d@school.edu', department: 'Physical Education', role: 'OPS' },
          { id: '9', full_name: 'Linda Mbeki', staff_code: 'LMBE', email: 'mbeki.l@school.edu', department: 'Social Sciences', role: 'Scattered' },
          { id: '10', full_name: 'Robert Wilson', staff_code: 'RWIL', email: 'wilson.r@school.edu', department: 'Creative Arts', role: 'Marathon' },
          { id: '11', full_name: 'Grace Hopper', staff_code: 'GHOP', email: 'hopper.g@school.edu', department: 'Computer Science', role: 'ADMIN' },
          { id: '12', full_name: 'Alan Turing', staff_code: 'ATUR', email: 'turing.a@school.edu', department: 'Mathematics', role: 'Scattered' }
        ]);
        return;
      }

      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('full_name');
      
      if (error) throw error;
      setStaff(data || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredStaff = staff.filter(s => 
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.staff_code?.toLowerCase().includes(search.toLowerCase()) ||
    s.department?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
     return (
       <div className="flex flex-col items-center justify-center min-h-[40vh]">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <Loader2 className="h-10 w-10 text-indigo-500" />
          </motion.div>
       </div>
     );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-950 tracking-tight italic uppercase">Personnel Matrix</h2>
          <p className="text-slate-500 font-medium">Manage deployment profiles, department weights, and load limits.</p>
        </div>
        <button className="flex items-center gap-4 px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-500/20 transition-all active:scale-95 group">
          <UserPlus className="h-5 w-5 group-hover:rotate-12 transition-transform" />
          Onboard Specialist
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'Avg Duty Load', val: '64.2%', icon: TrendingUp },
           { label: 'Total Personnel', val: staff.length.toString(), icon: Users },
           { label: 'Dept Variance', val: '0.12', icon: Shield },
           { label: 'Audit Compliance', val: '100%', icon: Award },
         ].map((k, i) => (
           <div key={i} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{k.label}</p>
                 <p className="text-2xl font-black text-slate-900 italic tracking-tight">{k.val}</p>
              </div>
              <div className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                 <k.icon className="h-6 w-6" />
              </div>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-6 top-5 h-5 w-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search tactical personnel by name, code or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-[2.2rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 outline-none transition-all shadow-sm font-bold placeholder:text-slate-300"
          />
        </div>
        <button className="flex-1 flex items-center justify-center gap-3 px-6 py-5 bg-white border border-slate-200 rounded-[2.2rem] text-slate-600 font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 transition-all shadow-sm">
          <Filter className="h-4 w-4" />
          Matrix Filters
        </button>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 border-b border-slate-100 italic">
              <th className="px-10 py-6">Staff_Code</th>
              <th className="px-10 py-6">Identity (Full Name)</th>
              <th className="px-6 py-6">Department / Role</th>
              <th className="px-6 py-6">Shortcuts</th>
              <th className="px-10 py-6 text-right">Update/Save</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredStaff.map((person) => (
              <tr key={person.id} className="group hover:bg-indigo-50/30 transition-colors">
                <td className="px-10 py-7">
                   <div className="h-14 w-14 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm transition-transform group-hover:scale-110 group-hover:border-indigo-200 italic">
                      {person.staff_code}
                   </div>
                </td>
                <td className="px-10 py-7">
                   <div className="flex flex-col">
                     <span className="font-black text-slate-900 text-lg tracking-tight italic uppercase">{person.full_name}</span>
                     <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{person.email}</span>
                   </div>
                </td>
                <td className="px-6 py-7">
                  <div className="flex flex-col gap-1">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200/50 italic w-fit">
                      <Shield className="h-3 w-3 text-indigo-400" />
                      {person.department || 'General'}
                    </span>
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest ml-4 italic">
                      Role: {person.role || 'Scattered'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-7">
                   <div className="flex items-center gap-3">
                      <button 
                        onClick={() => { setSelectedStaff(person); setActiveModal('subjects'); setSubjects(['Mathematics', 'Science']); }}
                        className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-100 transition-all hover:bg-emerald-50"
                        title="Subjects"
                      >
                         <BookOpen className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => { setSelectedStaff(person); setActiveModal('leave'); }}
                        className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-orange-600 hover:border-orange-100 transition-all hover:bg-orange-50"
                        title="Leave"
                      >
                         <CalendarX className="h-4 w-4" />
                      </button>
                      <button 
                         onClick={() => { setSelectedStaff(person); setActiveModal('timetable'); }}
                         className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all hover:bg-indigo-50"
                         title="Timetable"
                      >
                         <LayoutGrid className="h-4 w-4" />
                      </button>
                   </div>
                </td>
                <td className="px-10 py-7 text-right">
                  <button 
                    onClick={() => { setSelectedStaff(person); setRoleValue(person.role || 'Scattered'); setActiveModal('role'); }}
                    className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-900/10 active:scale-95"
                  >
                    Update/Save
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredStaff.length === 0 && (
          <div className="py-20 text-center">
             <Users className="h-12 w-12 text-slate-200 mx-auto mb-4" />
             <p className="text-slate-400 font-bold italic">No matching personnel in current matrix</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeModal === 'role' && selectedStaff && (
          <Modal 
            isOpen={true} 
            onClose={() => setActiveModal(null)} 
            title={selectedStaff.full_name} 
            subtitle={selectedStaff.staff_code}
            footer={
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-4 bg-red-50 text-red-600 rounded-2xl font-black uppercase text-[11px] tracking-widest border border-red-100 hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
                <button 
                  onClick={() => {
                    setStaff(prev => prev.map(s => s.id === selectedStaff.id ? { ...s, role: roleValue } : s));
                    setActiveModal(null);
                  }}
                  className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" /> Save Changes
                </button>
              </div>
            }
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Deployment Role</label>
                <select 
                  value={roleValue}
                  onChange={(e) => setRoleValue(e.target.value)}
                  className="w-full h-16 px-8 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none font-bold appearance-none cursor-pointer focus:border-indigo-300 transition-all"
                >
                  <option value="Scattered">Scattered</option>
                  <option value="Marathon">Marathon</option>
                  <option value="OPS">OPS</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>
          </Modal>
        )}

        {activeModal === 'subjects' && selectedStaff && (
          <Modal 
            isOpen={true} 
            onClose={() => setActiveModal(null)} 
            title="Assigned Subjects" 
            subtitle={`${selectedStaff.full_name} (${selectedStaff.staff_code})`}
          >
            <div className="space-y-8">
              <div className="flex gap-4">
                <input 
                  type="text" 
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Enter new subject name..."
                  className="flex-1 h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold"
                />
                <button 
                  onClick={() => { if (newSubject) { setSubjects([...subjects, newSubject]); setNewSubject(''); } }}
                  className="h-14 px-6 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" /> Add
                </button>
              </div>

              <div className="space-y-3">
                {subjects.map((sub, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                    <span className="font-bold text-slate-700 uppercase tracking-tight">{sub}</span>
                    <button 
                      onClick={() => setSubjects(subjects.filter((_, i) => i !== idx))}
                      className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Modal>
        )}

        {activeModal === 'leave' && selectedStaff && (
          <Modal 
            isOpen={true} 
            onClose={() => setActiveModal(null)} 
            title="Leave Request" 
            subtitle={`${selectedStaff.full_name} (${selectedStaff.staff_code})`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label>
                  <input 
                    type="date" 
                    value={leaveData.date}
                    onChange={(e) => setLeaveData({...leaveData, date: e.target.value})}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl font-bold" 
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={leaveData.isFullDay}
                    onChange={(e) => setLeaveData({...leaveData, isFullDay: e.target.checked})}
                    className="h-5 w-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500" 
                  />
                  <span className="text-sm font-bold text-slate-600 transition-colors group-hover:text-slate-900">Full Day Absence</span>
                </label>
                {!leaveData.isFullDay && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">Start</label>
                      <input type="time" value={leaveData.startTime} className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-center" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">End</label>
                      <input type="time" value={leaveData.endTime} className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-center" />
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason / Context</label>
                  <textarea 
                    placeholder="Enter reason for leave..."
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold h-24 outline-none focus:border-indigo-300 transition-all resize-none"
                  ></textarea>
                </div>
                <button className="w-full h-14 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-indigo-900/10">
                  Apply for Leave
                </button>
              </div>

              <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 h-fit">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Request Status</h5>
                <div className="space-y-4">
                  {[
                    { label: 'Pending', color: 'bg-amber-100 text-amber-600 border-amber-200' },
                    { label: 'Accepted', color: 'bg-emerald-100 text-emerald-600 border-emerald-200 opacity-30 shadow-none grayscale' },
                    { label: 'Denied', color: 'bg-red-100 text-red-600 border-red-200 opacity-30 shadow-none grayscale' }
                  ].map((s) => (
                    <div key={s.label} className={cn("p-4 rounded-2xl border flex items-center justify-between font-black uppercase text-[10px] tracking-widest transition-all", s.color)}>
                      {s.label}
                      {s.label === 'Pending' && <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Modal>
        )}

        {activeModal === 'timetable' && selectedStaff && (
          <Modal 
            isOpen={true} 
            onClose={() => setActiveModal(null)} 
            title="Operation Timetable" 
            subtitle={`${selectedStaff.full_name} (${selectedStaff.staff_code})`}
            footer={
              <div className="flex gap-4">
                <button onClick={() => setActiveModal(null)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase text-[11px] tracking-widest border border-slate-100">Cancel</button>
                <button className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all">Update Master Schedule</button>
              </div>
            }
          >
            <div className="space-y-8">
              <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                {['Cycle 1', 'Cycle 2'].map(c => (
                  <button 
                    key={c}
                    onClick={() => setActiveCycle(c)}
                    className={cn(
                      "flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      activeCycle === c ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto rounded-[2rem] border border-slate-100">
                <table className="w-full text-left border-collapse bg-slate-50/20">
                  <thead>
                    <tr className="bg-white border-b border-slate-100">
                      <th className="p-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Period</th>
                      {['MON', 'TUE', 'WED', 'THU', 'FRI'].map(d => (
                        <th key={d} className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'].map(p => (
                      <tr key={p} className="border-b border-slate-50 last:border-0 group hover:bg-white transition-colors">
                        <td className="p-4 font-black text-slate-400 text-sm whitespace-nowrap">{p}</td>
                        {[1,2,3,4,5].map(d => (
                          <td key={d} className="p-2 border-l border-slate-50">
                            <input 
                              type="text" 
                              className="w-full h-10 bg-transparent border-0 outline-none text-center font-bold text-slate-900 group-hover:bg-slate-50 rounded-lg focus:ring-2 focus:ring-indigo-100 transition-all"
                              placeholder="-"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function Modal({ isOpen, onClose, title, subtitle, children, footer }: { isOpen: boolean, onClose: () => void, title: string, subtitle?: string, children: React.ReactNode, footer?: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl">
       <motion.div 
         initial={{ scale: 0.9, opacity: 0, y: 50 }} 
         animate={{ scale: 1, opacity: 1, y: 0 }} 
         exit={{ scale: 0.9, opacity: 0, y: 50 }} 
         className="relative w-full max-w-2xl bg-white rounded-[4rem] overflow-hidden shadow-2xl"
       >
          <div className="p-10 bg-indigo-600 text-white flex justify-between items-center">
             <div className="flex items-center gap-6">
                <Shield className="h-8 w-8 text-indigo-300" />
                <div>
                   <h4 className="text-2xl font-black tracking-tight italic uppercase">{title}</h4>
                   {subtitle && <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.3em]">{subtitle}</p>}
                </div>
             </div>
             <button onClick={onClose} className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all border border-white/10">
                <X className="h-6 w-6 text-white" />
             </button>
          </div>

          <div className="p-10">
             {children}
             {footer && <div className="mt-10 pt-10 border-t border-slate-100">{footer}</div>}
          </div>
       </motion.div>
    </div>
  );
}

