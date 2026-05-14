import { useState } from 'react';
import { 
  Warehouse, Plus, MoreHorizontal, 
  Users, MapPin, ShieldCheck, Box
} from 'lucide-react';
import { cn } from '../lib/utils';

const VENUES_MOCK = [
  { id: '1', name: 'Main School Hall', type: 'Hall', capacity: 300, access: true },
  { id: '2', name: 'IT LAB', type: 'Lab', capacity: 26, access: true },
  { id: '3', name: 'Room 402', type: 'Classroom', capacity: 35, access: false },
  { id: '4', name: 'Lab 1', type: 'Lab', capacity: 30, access: true },
];

export function AdminVenues() {
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-950 tracking-tight">Venue Registry</h2>
          <p className="text-slate-500 font-medium">Manage exam locations and special lab requirements.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all">
          <Plus className="h-5 w-5" />
          Add New Venue
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><Warehouse className="h-6 w-6" /></div>
          <div>
            <p className="text-2xl font-black text-slate-900 leading-none">14</p>
            <p className="text-[10px] font-black uppercase text-slate-400 mt-1">Total Venues</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><Box className="h-6 w-6" /></div>
          <div>
            <p className="text-2xl font-black text-slate-900 leading-none">03</p>
            <p className="text-[10px] font-black uppercase text-slate-400 mt-1">Tech Labs</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 text-[11px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
              <th className="px-8 py-5">Venue Name</th>
              <th className="px-6 py-5">Type</th>
              <th className="px-6 py-5">Capacity</th>
              <th className="px-6 py-5">Hall Access</th>
              <th className="px-6 py-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {VENUES_MOCK.map((v) => (
              <tr key={v.id} className="group hover:bg-slate-50 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-slate-900">{v.name}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                    v.type === 'Hall' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                  )}>
                    {v.type}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600">
                    <Users className="h-4 w-4 text-slate-400" />
                    {v.capacity}
                  </div>
                </td>
                <td className="px-6 py-5">
                  {v.access ? (
                    <span className="text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg text-[10px] font-black uppercase italic">Unlocked ✅</span>
                  ) : (
                    <span className="text-slate-300 bg-slate-50 px-2 py-1 rounded-lg text-[10px] font-black uppercase">Standard</span>
                  )}
                </td>
                <td className="px-6 py-5 text-right">
                  <button className="p-2 text-slate-300 hover:text-slate-600 rounded-xl">
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
