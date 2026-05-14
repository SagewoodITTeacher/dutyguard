import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line, Area, Cell
} from 'recharts';
import { LayoutDashboard, TrendingUp, Calendar, Filter, Download, Zap, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState } from 'react';

const WORKLOAD_DATA = [
  { name: 'Franz Nortjé', invigilation: 42, standby: 8, tech: 12, break: 5 },
  { name: 'Ms Kunene', invigilation: 38, standby: 7, tech: 0, break: 4 },
  { name: 'Mr Fourie', invigilation: 45, standby: 9, tech: 0, break: 6 },
  { name: 'Ms Lubbe', invigilation: 35, standby: 6, tech: 0, break: 5 },
  { name: 'Mr Dlamini', invigilation: 40, standby: 8, tech: 0, break: 4 },
];

export function ManagerDashboard() {
  const [selectedGrade, setSelectedGrade] = useState('All');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-1000">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-950 tracking-tight flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <LayoutDashboard className="h-6 w-6 text-white" />
            </div>
            Operations Control
          </h2>
          <p className="text-slate-500 font-medium italic underline decoration-indigo-200 decoration-2 underline-offset-4 decoration-dashed">
            Monday, June 12 • Final Exams 2024 • Lead Intelligence
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-wider rounded-full animate-pulse border border-red-200">
            2 ACTIVE SOS
          </div>
          <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100">
            Generate Insight Report
          </button>
        </div>
      </div>

      {/* Grade Filters */}
      <div className="flex flex-wrap gap-2 p-2 bg-white border border-slate-200 rounded-2xl w-fit shadow-sm">
        {['All Grades', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((grade) => (
          <button
            key={grade}
            onClick={() => setSelectedGrade(grade)}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all",
              (selectedGrade === grade || (grade === 'All Grades' && selectedGrade === 'All'))
                ? "bg-indigo-600 text-white shadow-lg" 
                : "text-slate-400 hover:text-indigo-600 hover:bg-slate-50"
            )}
          >
            {grade}
          </button>
        ))}
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Left Stats Cards */}
        <div className="col-span-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40">
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Exam Venues</p>
             <p className="text-4xl font-black text-slate-950 italic">14 / 14</p>
             <div className="flex items-center gap-1.5 mt-2">
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-tight">Fully Staffed & Functional</p>
             </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40">
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Active Staff</p>
             <p className="text-4xl font-black text-slate-950 italic">42</p>
             <div className="flex items-center gap-1.5 mt-2">
                <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">6 Stand-by Teachers Ready</p>
             </div>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40">
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Pending Help</p>
             <p className="text-4xl font-black text-indigo-600 italic">05</p>
             <div className="flex items-center gap-1.5 mt-2 text-amber-600">
                <Zap className="h-3 w-3 fill-current" />
                <p className="text-[10px] font-bold uppercase tracking-tight">Avg response time: 2m 14s</p>
             </div>
          </div>
        </div>

        {/* Workload Stacked Chart */}
        <div className="col-span-12 lg:col-span-7 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-extrabold text-slate-950 leading-none">Duty Load Balance</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-2">All Staff Distribution</p>
            </div>
          </div>
          
          <div className="h-[420px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WORKLOAD_DATA} layout="vertical" barSize={32}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={120}
                  tick={{ fontSize: 11, fontWeight: 900, fill: '#1e293b', textAnchor: 'start', dx: -100 }}
                />
                <Tooltip cursor={{ fill: '#f1f5f9', radius: 12 }} />
                <Bar dataKey="invigilation" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="standby" stackId="a" fill="#f59e0b" />
                <Bar dataKey="break" stackId="a" fill="#10b981" />
                <Bar dataKey="tech" stackId="a" fill="#9333ea" radius={[0, 16, 16, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex gap-6 mt-6 border-t border-slate-50 pt-6">
            {['invigilation', 'standby', 'break', 'tech'].map(key => (
              <div key={key} className="flex items-center gap-2">
                <div className={cn("h-3 w-3 rounded-full", 
                  key === 'invigilation' ? 'bg-blue-500' : 
                  key === 'standby' ? 'bg-amber-500' : 
                  key === 'break' ? 'bg-emerald-500' : 'bg-purple-600'
                )}></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{key}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log View */}
        <div className="col-span-12 lg:col-span-5 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 flex flex-col h-full">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-extrabold text-slate-950">System Audit Log</h3>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest cursor-pointer hover:underline underline-offset-4">Live Feed</span>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto pr-2">
             {[
               { type: 'SOS', user: 'Franz Nortjé', desc: 'Noise Complaint - G11 Maths', time: '2m', color: 'bg-red-50 text-red-600' },
               { type: 'SWAP', user: 'Admin System', desc: 'Kunene ↔ Dlamini Assigned', time: '12m', color: 'bg-blue-50 text-blue-600' },
               { type: 'DONE', user: 'Stand-by Staff', desc: 'Bathroom Handover G12', time: '15m', color: 'bg-emerald-50 text-emerald-600' },
               { type: 'RULE', user: 'Auto Engine', desc: 'Wednesday Constraint Applied', time: '1h', color: 'bg-slate-100 text-slate-600' },
             ].map((log, i) => (
               <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-lg hover:border-indigo-100 transition-all group">
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest", log.color)}>
                      {log.type}
                    </span>
                    <span className="text-[9px] font-bold text-slate-300 group-hover:text-slate-500">{log.time} ago</span>
                  </div>
                  <p className="text-xs font-black text-slate-900 mb-1">{log.user}</p>
                  <p className="text-[10px] font-medium text-slate-500 leading-tight">{log.desc}</p>
               </div>
             ))}
          </div>

          <button className="w-full mt-6 py-4 bg-slate-900 hover:bg-indigo-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all">
            Open Full Duty Audit
          </button>
        </div>

        {/* Marking Gantt View */}
        <div className="col-span-12 bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-extrabold text-slate-950 leading-none">Exams Lifecycle - Marking Gantt</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-2">Submission & Moderation Progress</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-blue-500 rounded-sm"></div>
                <span className="text-[10px] font-black uppercase text-slate-400">Writing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-emerald-500 rounded-sm"></div>
                <span className="text-[10px] font-black uppercase text-slate-400">Marking</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-amber-500 rounded-sm"></div>
                <span className="text-[10px] font-black uppercase text-slate-400">Moderation</span>
              </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={[
                { subject: 'English HL', writing: [0, 5], marking: [5, 12], moderation: [12, 14] },
                { subject: 'Afrikaans', writing: [2, 6], marking: [6, 11], moderation: [11, 13] },
                { subject: 'Maths', writing: [4, 9], marking: [9, 15], moderation: [15, 17] },
                { subject: 'IT', writing: [1, 7], marking: [7, 13], moderation: [13, 15] },
              ]} barSize={20} barGap={0}>
                <XAxis type="number" hide domain={[0, 20]} />
                <YAxis dataKey="subject" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 900 }} />
                <Tooltip />
                <Bar dataKey="writing" fill="#3b82f6" radius={[4, 4, 4, 4]} />
                <Bar dataKey="marking" fill="#10b981" radius={[4, 4, 4, 4]} />
                <Bar dataKey="moderation" fill="#f59e0b" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-4 gap-4 mt-6 border-t border-slate-50 pt-6">
            {['May 12', 'May 16', 'May 20', 'May 24'].map(date => (
              <span key={date} className="text-[10px] font-bold text-slate-300 text-center uppercase tracking-widest">{date}</span>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
