import { useState } from 'react';
import { 
  Users, UserPlus, Filter, Search, 
  MoreHorizontal, Mail, Shield, Award 
} from 'lucide-react';
import { cn } from '../lib/utils';

const STAFF_MOCK = [
  { id: '1', name: 'Franz Nortjé', code: 'FRAN', role: 'Marathon', homeroom: '11-B', load: '68%' },
  { id: '2', name: 'Ms Kunene', code: 'KUNE', role: 'Scattered', homeroom: '12-A', load: '72%' },
  { id: '3', name: 'Mr Fourie', code: 'FOUR', role: 'Marathon', homeroom: '10-C', load: '64%' },
  { id: '4', name: 'Ms Lubbe', code: 'LUBB', role: 'Scattered', homeroom: '8-D', load: '70%' },
];

export function AdminTeachers() {
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-950 tracking-tight">Staff Management</h2>
          <p className="text-slate-500 font-medium">Configure roles, preferences, and duty loads.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">
          <UserPlus className="h-5 w-5" />
          Add New Teacher
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by name, code or homeroom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm font-medium"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all">
            <Filter className="h-4 w-4" />
            Filter
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
              <th className="px-8 py-5">Staff Code</th>
              <th className="px-6 py-5">Full Name</th>
              <th className="px-6 py-5">Role Type</th>
              <th className="px-6 py-5">Homeroom</th>
              <th className="px-6 py-5">Duty Load</th>
              <th className="px-6 py-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {STAFF_MOCK.map((staff) => (
              <tr key={staff.id} className="group hover:bg-indigo-50/30 transition-colors">
                <td className="px-8 py-5">
                  <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg text-xs tracking-wider">
                    {staff.code}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">{staff.name}</span>
                    <span className="text-[10px] text-slate-400 font-medium">staff@school.edu</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                    staff.role === 'Marathon' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                  )}>
                    {staff.role}
                  </span>
                </td>
                <td className="px-6 py-5 font-bold text-slate-600">{staff.homeroom}</td>
                <td className="px-6 py-5">
                  <div className="w-full max-w-[80px] bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500" 
                      style={{ width: staff.load }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 block">{staff.load} Assigned</span>
                </td>
                <td className="px-6 py-5 text-right">
                  <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
