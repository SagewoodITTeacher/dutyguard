import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Settings, UserPlus, AlertTriangle } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfWeek, addDays } from 'date-fns';

export function SystemEngine() {
  const [criticalSlots, setCriticalSlots] = useState<any[]>([]);
  const [alternatives, setAlternatives] = useState<Record<number, any[]>>({});

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('system-engine-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'exam_duties' },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/scheduler/critical-report?startDate=2026-05-20&endDate=2026-06-19');
      if (!response.ok) throw new Error('API failed');
      const data = await response.json();
      
      setCriticalSlots(data);
      
      const alts: Record<number, any[]> = {};
      data.forEach((slot: any) => {
        alts[slot.id] = slot.alternatives || [];
      });
      setAlternatives(alts);
    } catch (err) {
      console.error("SystemEngine fetch error:", err);
    }
  };

  const getWeekRanges = () => {
    return [
      { id: 1, name: 'Week 1', start: '2026-05-18', end: '2026-05-24' },
      { id: 2, name: 'Week 2', start: '2026-05-25', end: '2026-05-31' },
      { id: 3, name: 'Week 3', start: '2026-06-01', end: '2026-06-07' },
      { id: 4, name: 'Week 4', start: '2026-06-08', end: '2026-06-14' },
      { id: 5, name: 'Week 5', start: '2026-06-15', end: '2026-06-19' },
    ];
  };

  const weeks = getWeekRanges();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden mb-8 shadow-2xl relative">
       {/* Background structural elements */}
       <div className="absolute inset-0 border-t border-slate-700/50 pointer-events-none" />
       
       <div className="p-8 pb-6 border-b border-slate-800">
         <div className="flex items-center gap-6">
           <div className="p-4 bg-blue-500/20 rounded-2xl border border-blue-500/30">
              <Settings className="h-8 w-8 text-blue-400 animate-[spin_4s_linear_infinite]" />
           </div>
           <div>
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tight">System Engine</h3>
              <div className="flex items-center gap-2 mt-1">
                 <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                 <p className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Active Optimization Pass</p>
              </div>
           </div>
         </div>
       </div>

       <div className="divide-y divide-slate-800">
         {weeks.map(week => {
            const weekSlots = criticalSlots.filter(s => s.duty_date >= week.start && s.duty_date <= week.end);
            
            return (
              <div key={week.id} className="p-8">
                 <div className="flex items-center justify-between mb-6">
                    <div>
                       <h4 className="text-lg font-bold text-white uppercase tracking-tight">{week.name}</h4>
                       <p className="text-xs text-slate-400 font-medium">({format(parseISO(week.start), 'dd MMM')} - {format(parseISO(week.end), 'dd MMM')})</p>
                    </div>
                    <div className="px-3 py-1 bg-slate-800 rounded text-xs font-bold text-slate-300">
                       {weekSlots.length} CRITICAL SLOTS
                    </div>
                 </div>

                 {weekSlots.length === 0 ? (
                    <div className="text-center py-8 border border-dashed border-slate-700 rounded-xl bg-slate-800/20">
                       <p className="text-sm font-medium text-slate-500">No critical slots for this week.</p>
                    </div>
                 ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                       {weekSlots.map(slot => (
                          <div key={slot.id} className="bg-slate-800 border-l-2 border-l-yellow-500 border border-slate-700 rounded-xl p-4 flex flex-col gap-4">
                             <div className="flex justify-between items-start">
                                <div>
                                   <div className="flex items-center gap-2 mb-1">
                                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                      <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-wider">{slot.slot_type}</span>
                                   </div>
                                   <div className="font-mono text-sm text-slate-300 font-medium">
                                      {format(parseISO(slot.duty_date), 'EEE dd MMM')} • {slot.period_code}
                                   </div>
                                </div>
                                <div className="text-right">
                                   <div className="text-xs font-bold text-white uppercase">{slot.venue_id || 'NO VENUE'}</div>
                                   <div className="text-[10px] text-slate-400 font-medium mt-0.5">Gr {slot.exam_papers?.exam_sessions?.[0]?.grade || '?'}</div>
                                </div>
                             </div>

                             <div className="pt-3 border-t border-slate-700 border-dashed">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex justify-between">
                                  <span>Assigned Staff:</span>
                                  <span className="text-white">{slot.staff_code || 'UNASSIGNED'}</span>
                                </p>
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Alternative Candidates</p>
                                <div className="flex overflow-x-auto gap-2 pb-2 snap-x hide-scrollbar">
                                   {alternatives[slot.id]?.length > 0 ? alternatives[slot.id].map((alt, idx) => (
                                      <div key={idx} className="snap-start flex-none px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg whitespace-nowrap group hover:border-blue-500 transition-colors">
                                         <div className="flex items-center gap-1.5 text-sm font-bold text-slate-200">
                                            <UserPlus className="h-3 w-3 text-slate-500 group-hover:text-blue-400 transition-colors" />
                                            {alt.staff_code}
                                         </div>
                                         <div className="text-[9px] text-slate-500 font-medium mt-0.5 font-mono">
                                            Assigned ID: {alt.current_assignment_id}
                                         </div>
                                      </div>
                                   )) : (
                                      <div className="text-[10px] font-mono text-slate-500 py-1">No alternatives found assigned in this period.</div>
                                   )}
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}
              </div>
            );
         })}
       </div>
    </div>
  );
}
