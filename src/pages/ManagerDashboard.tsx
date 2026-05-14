import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line, Area, Cell
} from 'recharts';
import { 
  LayoutDashboard, TrendingUp, Calendar, Filter, 
  Download, Zap, CheckCircle2, Shield, Clock,
  ArrowRight, Users, Bell, Search, Menu
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';

const WORKLOAD_DATA = [
  { name: 'F. Nortjé', invigilation: 42, standby: 8, tech: 12, break: 5 },
  { name: 'S. Kunene', invigilation: 38, standby: 15, tech: 0, break: 8 },
  { name: 'J. Fourie', invigilation: 45, standby: 10, tech: 4, break: 10 },
  { name: 'L. Lubbe', invigilation: 35, standby: 6, tech: 0, break: 5 },
  { name: 'A. Dlamini', invigilation: 40, standby: 8, tech: 0, break: 4 },
  { name: 'K. Pillay', invigilation: 30, standby: 12, tech: 8, break: 6 },
  { name: 'M. Smit', invigilation: 36, standby: 9, tech: 0, break: 7 },
  { name: 'B. Zungu', invigilation: 39, standby: 7, tech: 2, break: 4 },
];

const MARKING_DATA = [
  { id: 1, subject: 'Grade 12 English HL', status: 'Moderating', start: 0, end: 5, marker: 'F. Nortjé' },
  { id: 2, subject: 'Grade 12 Mathematics P1', status: 'Marking', start: 2, end: 8, marker: 'S. Kunene' },
  { id: 3, subject: 'Grade 11 IT Theory', status: 'Marking', start: 5, end: 12, marker: 'J. Fourie' },
  { id: 4, subject: 'Grade 11 Afrikaans FAL', status: 'Not Written', start: 10, end: 11, marker: 'L. Lubbe', type: 'future' },
  { id: 5, subject: 'Grade 10 Physical Science', status: 'Marking', start: 7, end: 14, marker: 'A. Dlamini' },
  { id: 6, subject: 'Grade 10 History', status: 'Completed', start: 0, end: 4, marker: 'K. Pillay', type: 'done' },
  { id: 7, subject: 'Grade 9 Mathematics', status: 'Not Written', start: 14, end: 15, marker: 'M. Smit', type: 'future' },
];

export function ManagerDashboard() {
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [viewMode, setViewMode] = useState<'visual' | 'table'>('visual');

  return (
    <div className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000 bg-slate-50/30 p-4 rounded-[4rem]">
      
      {/* Strategic Command Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-6 px-4">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
             <div className="h-16 w-16 bg-[#1e1b4b] rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-200 group hover:scale-110 transition-transform">
                <LayoutDashboard className="h-8 w-8 text-white group-hover:rotate-12 transition-transform" />
             </div>
             <div className="space-y-0.5">
               <h2 className="text-4xl font-black text-slate-900 tracking-tight italic">Operations Hub</h2>
               <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] pl-1">
                 Lead Intelligence • <span className="text-indigo-600">Final Exams 2024</span>
               </p>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-3 rounded-[2.5rem] shadow-sm border border-slate-100">
           <div className="hidden sm:flex flex-col items-end mr-6 pl-4 border-r border-slate-100 pr-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Live Notifications</p>
              <div className="flex items-center gap-2">
                 <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                 </span>
                 <p className="text-xs font-black text-red-600 italic">02 Alerts Requiring Focus</p>
              </div>
           </div>
           <button className="flex items-center gap-3 px-8 py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl shadow-indigo-900/10 hover:bg-indigo-600 transition-all hover:scale-105 active:scale-95 group">
              <Zap className="h-5 w-5 group-hover:fill-current" />
              Pulse Engine
           </button>
        </div>
      </div>

      {/* Grade Triage Filter */}
      <div className="px-4">
        <div className="flex flex-wrap items-center gap-4 bg-white/60 backdrop-blur-md p-4 rounded-[3rem] border border-slate-200/50 shadow-sm w-fit">
          <div className="flex items-center gap-2 px-4 border-r border-slate-200 mr-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter</span>
          </div>
          {['All', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((grade) => (
            <button
              key={grade}
              onClick={() => setSelectedGrade(grade)}
              className={cn(
                "px-8 py-4 rounded-full text-[11px] font-black uppercase tracking-widest transition-all relative overflow-hidden",
                selectedGrade === grade 
                  ? "bg-[#1e1b4b] text-white shadow-2xl shadow-indigo-900/20 scale-105" 
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
        <div className="col-span-12 grid grid-cols-1 md:grid-cols-4 gap-8">
           {[
             { label: 'Managed Venues', val: '14 / 14', sub: 'Hall A, B, C & Classes', icon: Shield, color: 'bg-indigo-50 text-indigo-600' },
             { label: 'Staff Efficiency', val: '94.2%', sub: 'No Conflicts Found', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
             { label: 'Marking Velocity', val: '+0.8d', sub: 'Ahead of Cycle', icon: Clock, color: 'bg-amber-50 text-amber-600' },
             { label: 'Support Pulse', val: '1.4m', sub: 'Average Response', icon: Zap, color: 'bg-purple-50 text-purple-600' },
           ].map((kpi, i) => (
             <motion.div 
               whileHover={{ y: -8 }}
               key={i} 
               className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col justify-between group hover:border-indigo-100 transition-all cursor-default"
             >
                <div className="flex justify-between items-start mb-6">
                   <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3", kpi.color)}>
                      <kpi.icon className="h-6 w-6" />
                   </div>
                   <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Live</span>
                   </div>
                </div>
                <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-1.5">{kpi.label}</p>
                   <p className="text-4xl font-black text-slate-900 tracking-tighter italic leading-none">{kpi.val}</p>
                   <p className="text-[10px] font-bold text-slate-400 mt-3 flex items-center gap-1.5 opacity-60">
                      <ArrowRight className="h-3 w-3" /> {kpi.sub}
                   </p>
                </div>
             </motion.div>
           ))}
        </div>

        {/* Global Workload Distribution Matrix */}
        <div className="col-span-12 bg-white p-12 rounded-[4.5rem] border border-slate-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06)] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
             <TrendingUp className="h-96 w-96 text-indigo-900" />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 relative z-10">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                 <Users className="h-6 w-6 text-indigo-600" />
                 <h3 className="text-3xl font-black text-slate-950 italic">Staff Load Matrix</h3>
              </div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] pl-1">Total Duty Allocation Across Senior High</p>
            </div>
            
            <div className="flex flex-wrap gap-8 bg-slate-50/80 backdrop-blur-sm p-6 rounded-[2.5rem] border border-slate-100">
              {[
                { label: 'Invigilation', color: 'bg-[#4f46e5]' },
                { label: 'Stand-by', color: 'bg-[#f59e0b]' },
                { label: 'Break Duties', color: 'bg-[#10b981]' },
                { label: 'Tech Support', color: 'bg-[#9333ea]' },
              ].map(leg => (
                <div key={leg.label} className="flex items-center gap-3">
                  <div className={cn("h-4 w-4 rounded-full shadow-lg border-2 border-white", leg.color)}></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{leg.label}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="h-[550px] w-full relative z-10 pr-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WORKLOAD_DATA} layout="vertical" barSize={38} margin={{ left: 20 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 13, fontStyle: 'italic', fontWeight: 900, fill: '#1e293b' }}
                  width={110}
                />
                <Tooltip 
                   cursor={{ fill: '#f8fafc', radius: 24 }}
                   contentStyle={{ borderRadius: '32px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: '24px' }}
                />
                <Bar dataKey="invigilation" stackId="a" fill="#4f46e5" radius={[0, 0, 0, 0]} />
                <Bar dataKey="standby" stackId="a" fill="#f59e0b" />
                <Bar dataKey="break" stackId="a" fill="#10b981" />
                <Bar dataKey="tech" stackId="a" fill="#9333ea" radius={[0, 16, 16, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lifecycle Marking Gantt Tracker */}
        <div className="col-span-12 bg-white p-12 rounded-[4.5rem] border border-slate-100 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.06)]">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16 px-2">
              <div className="space-y-1">
                 <div className="flex items-center gap-3">
                    <BookOpen className="h-6 w-6 text-indigo-600" />
                    <h3 className="text-3xl font-black text-slate-950 italic">Marking Lifecycle Gantt</h3>
                 </div>
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] pl-1">Stage Progression: Write • Mark • Moderate • Upload</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-4 px-6 py-4 bg-slate-50 rounded-[2rem] border border-slate-100">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 italic">20 May – 24 June 2024</span>
                 </div>
              </div>
           </div>

           <div className="space-y-10">
              {/* Gantt Header Timeline */}
              <div className="grid grid-cols-12 gap-6 px-10 pb-6 border-b border-slate-100 relative">
                 <div className="col-span-4 text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Subject Identification</div>
                 <div className="col-span-8 flex justify-between px-2 relative z-10">
                    {['20 May', '30 May', '10 June', '20 June', '24 June'].map(d => (
                      <span key={d} className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{d}</span>
                    ))}
                 </div>
                 {/* Today Line Indicator */}
                 <div className="absolute left-[54%] top-0 h-[600px] w-1 bg-emerald-500/20 z-0 pointer-events-none group">
                    <div className="absolute top-0 -translate-x-1/2 flex flex-col items-center gap-2">
                       <span className="text-[9px] font-black bg-emerald-500 text-white px-3 py-1 rounded-full uppercase tracking-widest">Today</span>
                       <div className="w-1 h-full bg-emerald-500"></div>
                    </div>
                 </div>
              </div>

              {/* Gantt Rows */}
              <div className="space-y-6 relative z-10">
                 {MARKING_DATA.map((item, i) => (
                   <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    key={item.id} 
                    className="grid grid-cols-12 gap-6 items-center group"
                   >
                      <div className="col-span-4 flex items-center gap-4 pl-4 transition-transform group-hover:translate-x-2">
                         <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-[10px] font-black text-slate-300">
                            {idxToLetter(i)}
                         </div>
                         <div>
                            <p className="text-sm font-black text-slate-900 leading-none mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight italic">{item.subject}</p>
                            <div className="flex items-center gap-2">
                               <p className="text-[10px] font-bold text-slate-400 capitalize">{item.marker}</p>
                               <span className="h-1 w-1 rounded-full bg-slate-200"></span>
                               <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter">PHASE {i+1}</span>
                            </div>
                         </div>
                      </div>
                      <div className="col-span-8 relative h-14 bg-slate-50/30 rounded-[1.8rem] border border-slate-100 overflow-hidden group-hover:bg-slate-50 transition-colors">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${((item.end - item.start) / 20) * 100}%` }}
                           transition={{ duration: 1.5, type: 'spring' }}
                           className={cn(
                             "absolute top-0 bottom-0 flex items-center px-6 transition-all shadow-inner",
                             item.type === 'done' 
                               ? "bg-emerald-500/90 shadow-emerald-600/20" 
                               : item.type === 'future' 
                               ? "bg-slate-100 border-2 border-slate-200 border-dashed opacity-40" 
                               : "bg-indigo-600 shadow-indigo-700/20"
                           )}
                           style={{ 
                             left: `${(item.start / 20) * 100}%`,
                           }}
                         >
                            <div className="flex items-center gap-3 w-full">
                               <span className={cn(
                                "text-[9px] font-black uppercase tracking-[0.2em] truncate",
                                item.type === 'future' ? "text-slate-400" : "text-white"
                               )}>
                                 {item.status}
                               </span>
                               {!item.type && <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden ml-2"><div className="h-full bg-white opacity-50 transition-all duration-1000" style={{ width: '65%' }}></div></div>}
                            </div>
                         </motion.div>
                      </div>
                   </motion.div>
                 ))}
              </div>
              
              {/* Not Written Section Key */}
              <div className="flex justify-end gap-10 mt-12 px-6 pt-10 border-t border-slate-50">
                 <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Moderating Stage</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-indigo-600"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Active Marking</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-slate-100 border border-slate-200 border-dashed"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Pre-Writing Phase</span>
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
