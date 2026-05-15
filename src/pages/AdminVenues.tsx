import { useState, useEffect } from 'react';
import { 
  Warehouse, Plus, MoreHorizontal, 
  Users, MapPin, ShieldCheck, Box,
  Loader2, Search, Filter, Shield, 
  Zap, ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';

export function AdminVenues() {
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchVenues();
  }, []);

  async function fetchVenues() {
    const isDemo = !!localStorage.getItem('dutyguard_demo_session');

    try {
      setLoading(true);
      
      if (isDemo) {
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate delay
        setVenues([
          { id: 'v1', name: 'Great Hall', type: 'Hall', capacity: 350 },
          { id: 'v2', name: 'IT Lab 1', type: 'Lab', capacity: 40 },
          { id: 'v3', name: 'Science Lab 4', type: 'Lab', capacity: 35 },
          { id: 'v4', name: 'Sports Pavilion', type: 'Hall', capacity: 150 },
          { id: 'v5', name: 'Room 12', type: 'Classroom', capacity: 30 },
          { id: 'v6', name: 'Room 15', type: 'Classroom', capacity: 30 },
          { id: 'v7', name: 'Art Studio', type: 'Specialist', capacity: 25 },
          { id: 'v8', name: 'Library Annex', type: 'Specialist', capacity: 60 },
          { id: 'v9', name: 'Music Block Hall', type: 'Hall', capacity: 80 },
          { id: 'v10', name: 'Tech Lab 2', type: 'Lab', capacity: 35 },
          { id: 'v11', name: 'Bio Lab 1', type: 'Lab', capacity: 30 },
          { id: 'v12', name: 'Exam Hall B', type: 'Hall', capacity: 200 }
        ]);
        return;
      }

      const { data, error } = await supabase
        .from('venues')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setVenues(data || []);
    } catch (err) {
      console.error('Error fetching venues:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredVenues = venues.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.type?.toLowerCase().includes(search.toLowerCase())
  );

  const labCount = venues.filter(v => v.type?.toLowerCase().includes('lab')).length;

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
          <h2 className="text-4xl font-black text-slate-950 tracking-tight italic uppercase">Venue Registry</h2>
          <p className="text-slate-500 font-medium">Manage deployment zones, capacity constraints, and technical access.</p>
        </div>
        <button className="flex items-center gap-4 px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-500/20 transition-all active:scale-95 group">
          <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
          Register New Zone
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-blue-100 transition-all">
          <div className="h-14 w-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <Warehouse className="h-7 w-7" />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 leading-none italic">{venues.length}</p>
            <p className="text-[10px] font-black uppercase text-slate-400 mt-2 tracking-widest">Active Zones</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-purple-100 transition-all">
          <div className="h-14 w-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <Box className="h-7 w-7" />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 leading-none italic">{String(labCount).padStart(2, '0')}</p>
            <p className="text-[10px] font-black uppercase text-slate-400 mt-2 tracking-widest">Specialist Labs</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:border-emerald-100 transition-all">
          <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 leading-none italic">100%</p>
            <p className="text-[10px] font-black uppercase text-slate-400 mt-2 tracking-widest">Safety Clearance</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-6 top-5 h-5 w-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search venue database by name or classification..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-16 pr-6 py-5 bg-white border border-slate-200 rounded-[2.2rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-200 outline-none transition-all shadow-sm font-bold placeholder:text-slate-300"
          />
        </div>
        <button className="flex-1 flex items-center justify-center gap-3 px-6 py-5 bg-white border border-slate-200 rounded-[2.2rem] text-slate-600 font-black uppercase text-[11px] tracking-widest hover:bg-slate-50 transition-all shadow-sm">
          <Filter className="h-4 w-4" />
          Registry Filters
        </button>
      </div>

      <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 border-b border-slate-100 italic">
              <th className="px-10 py-6">Venue Designation</th>
              <th className="px-6 py-6">Classification</th>
              <th className="px-6 py-6">Load Rating</th>
              <th className="px-6 py-6">Security Access</th>
              <th className="px-10 py-6 text-right">Ops</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredVenues.map((v) => (
              <tr key={v.id} className="group hover:bg-slate-50 transition-colors">
                <td className="px-10 py-7">
                  <div className="flex items-center gap-5">
                    <div className="h-12 w-12 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-slate-300 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all group-hover:rotate-12 shadow-sm">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                        <span className="font-black text-slate-900 text-lg tracking-tight italic uppercase">{v.name}</span>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">UID: {v.id.slice(0, 8)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-7">
                  <span className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest italic border",
                    v.type === 'Hall' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                  )}>
                    {v.type}
                  </span>
                </td>
                <td className="px-6 py-7">
                   <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span className="text-sm font-black text-slate-600">{v.capacity} UNIT CAP</span>
                   </div>
                </td>
                <td className="px-6 py-7">
                  <span className="text-emerald-500 bg-emerald-50 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest italic border border-emerald-100">
                    UNLOCKED ✅
                  </span>
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

        {filteredVenues.length === 0 && (
          <div className="py-20 text-center">
             <Warehouse className="h-12 w-12 text-slate-200 mx-auto mb-4" />
             <p className="text-slate-400 font-bold italic">No matching zones in current registry</p>
          </div>
        )}
      </div>
    </div>
  );
}

