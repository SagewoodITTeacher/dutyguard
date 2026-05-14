import { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Filter, Search, 
  MoreHorizontal, Mail, Shield, Award,
  Loader2, ArrowRight, ChevronRight,
  TrendingUp, Clock
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';

export function AdminTeachers() {
  const [search, setSearch] = useState('');
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          { id: '1', full_name: 'Franz Nortjé', staff_code: 'FRAN', email: 'nortje.f@school.edu', department: 'Management' },
          { id: '2', full_name: 'Johann de Wet', staff_code: 'JOHD', email: 'johand.d@school.edu', department: 'Operations' },
          { id: '3', full_name: 'Ayam Staff', staff_code: 'AYAM', email: 'ayam@school.edu', department: 'Science' },
          { id: '4', full_name: 'Amop Teacher', staff_code: 'AMOP', email: 'amop@school.edu', department: 'IT' }
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
              <th className="px-10 py-6">Identity</th>
              <th className="px-6 py-6">Department</th>
              <th className="px-6 py-6 text-center">Load Factor</th>
              <th className="px-10 py-6 text-right">Ops</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredStaff.map((person) => (
              <tr key={person.id} className="group hover:bg-indigo-50/30 transition-colors">
                <td className="px-10 py-7">
                   <div className="flex items-center gap-6">
                      <div className="h-14 w-14 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-indigo-100 font-black text-xs shadow-sm transition-transform group-hover:scale-110 group-hover:border-indigo-200">
                         <span className="text-indigo-600 italic">{person.staff_code}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 text-lg tracking-tight italic uppercase">{person.full_name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{person.email}</span>
                      </div>
                   </div>
                </td>
                <td className="px-6 py-7">
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200/50 italic">
                    <Shield className="h-3 w-3 text-indigo-400" />
                    {person.department || 'General'}
                  </span>
                </td>
                <td className="px-6 py-7">
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-32 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" 
                        style={{ width: '65%' }}
                      ></div>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 tracking-widest">65% CAPACITY</span>
                  </div>
                </td>
                <td className="px-10 py-7 text-right">
                  <button className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 hover:text-indigo-600 hover:border-indigo-100 transition-all hover:shadow-xl hover:shadow-indigo-500/10">
                    <MoreHorizontal className="h-5 w-5" />
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
    </div>
  );
}

