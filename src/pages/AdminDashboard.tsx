import { useState } from 'react';
import { 
  Users, Calendar, Settings, FileText, 
  ArrowRightLeft, Sparkles, Filter, MoreVertical,
  Download, Plus, Warehouse, ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

export function AdminDashboard() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-950 tracking-tight">System Control</h2>
          <p className="text-slate-500 font-medium">Manage duties, staff rules, and exam schedules.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-all">
            <Download className="h-4 w-4" />
            Export PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
            <Plus className="h-4 w-4" />
            Add Paper
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Staff', value: '48', sub: 'View Records', icon: Users, color: 'text-indigo-600 bg-indigo-50', link: '/admin/teachers' },
          { label: 'Venues', value: '14', sub: 'Manage Room Access', icon: Warehouse, color: 'text-blue-600 bg-blue-50', link: '/admin/venues' },
          { label: 'Swap Requests', value: '03', sub: '2 urgent pending', icon: ArrowRightLeft, color: 'text-red-600 bg-red-50', link: '#' },
          { label: 'Active Sessions', value: '12', sub: 'Currently writing', icon: Calendar, color: 'text-amber-600 bg-amber-50', link: '#' },
        ].map((stat, i) => (
          <Link 
            key={i} 
            to={stat.link}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-xl hover:-translate-y-1 block"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("p-3 rounded-2xl", stat.color)}>
                <stat.icon className="h-6 w-6" />
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300" />
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-black text-slate-900 leading-none italic">{stat.value}</p>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 text-[10px] font-black uppercase text-indigo-600 tracking-wider">
              {stat.sub}
            </div>
          </Link>
        ))}
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scheduler Tool */}
        <div className="lg:col-span-2 bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-100/50 overflow-hidden">
          <div className="p-8 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-950">Auto-Schedule Engine</h3>
              <p className="text-sm text-slate-500 font-medium">Generate duties based on period rules and homeroom constraints.</p>
            </div>
            <button 
              onClick={handleGenerate}
              className={cn(
                "flex items-center gap-2 py-3 px-6 rounded-2xl font-bold shadow-lg transition-all",
                isGenerating ? "bg-slate-100 text-slate-400" : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
              )}
            >
              {isGenerating ? "Generating..." : <><Sparkles className="h-4 w-4" /> Run Generator</>}
            </button>
          </div>
          
          <div className="p-0">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                  <th className="px-8 py-4">Session</th>
                  <th className="px-6 py-4">Subject</th>
                  <th className="px-6 py-4">Venue</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {[
                  { session: 'Mon, P2', subject: 'Math P1', venue: 'Hall A', status: 'Assigned' },
                  { session: 'Mon, P5', subject: 'English Lit', venue: 'Rm 12', status: 'Assigned' },
                  { session: 'Tue, P1', subject: 'Chem P2', venue: 'Lab 1', status: 'Pending' },
                  { session: 'Tue, P4', subject: 'History', venue: 'Hall B', status: 'Assigned' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-8 py-4 font-bold text-slate-900">{row.session}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">{row.subject}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                        {row.venue}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                        row.status === 'Assigned' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'
                      )}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-300 hover:text-slate-900 font-bold text-xs uppercase transition-colors">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Rules */}
        <div className="bg-slate-900 rounded-[32px] p-8 text-white shadow-2xl space-y-8 border border-slate-800">
          <div>
            <h3 className="text-xl font-bold mb-2 text-white">Rule Presets</h3>
            <p className="text-slate-400 text-sm font-medium">Current active constraints for the engine.</p>
          </div>

          <div className="space-y-4">
            {[
              { label: 'Wednesday Homeroom', desc: 'Teachers invigilate own grades', active: true },
              { label: 'P1-P3 Sequential', desc: 'Limit back-to-back duties', active: true },
              { label: 'Subject Exclusion', desc: "Don't invigilate own subject", active: false },
              { label: 'Shift Fairness', desc: 'Balance morning/afternoon duties', active: true },
            ].map((rule, i) => (
              <div key={i} className="flex items-start justify-between p-4 bg-white/5 border border-white/10 rounded-2xl transition-all hover:bg-white/10">
                <div>
                  <p className="font-bold text-sm mb-0.5 text-white">{rule.label}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{rule.desc}</p>
                </div>
                <div className={cn(
                  "h-4 w-4 rounded-full border-2",
                  rule.active ? "bg-indigo-500 border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]" : "border-slate-700"
                )}></div>
              </div>
            ))}
          </div>

          <button className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all border border-white/10">
            <Settings className="h-4 w-4" />
            Advanced Settings
          </button>
        </div>
      </div>
    </div>
  );
}
