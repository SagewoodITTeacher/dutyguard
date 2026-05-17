import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Filter, Search, 
  MoreHorizontal, Mail, Shield, Award,
  Loader2, ArrowRight, ChevronRight,
  TrendingUp, Clock, BookOpen, CalendarX, 
  LayoutGrid, X, Check, Trash2, Plus, Coffee
} from 'lucide-react';
import { cn } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'motion/react';

export function AdminTeachers() {
  const [search, setSearch] = useState('');
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [activeModal, setActiveModal] = useState<'role' | 'subjects' | 'leave' | 'timetable' | 'break' | null>(null);

  // Modal States
  const [roleValue, setRoleValue] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [newSubject, setNewSubject] = useState('');
  const [allSubjects, setAllSubjects] = useState<any[]>([]); 
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [loadingLeaves, setLoadingLeaves] = useState(false);
  const [loadingRole, setLoadingRole] = useState(false);
  const [loadingBreak, setLoadingBreak] = useState(false);
  const [breakDuties, setBreakDuties] = useState<{ morning: string[], afternoon: string[] }>({ morning: [], afternoon: [] });
  const [newBreakDate, setNewBreakDate] = useState({ morning: '', afternoon: '' });
  const [selectedBreakItem, setSelectedBreakItem] = useState<{ morning: string | null, afternoon: string | null }>({ morning: null, afternoon: null });
  const [leaveData, setLeaveData] = useState({
    date: '',
    isFullDay: true,
    startTime: '07:30',
    endTime: '14:30',
    reason: ''
  });
  const [staffLeaves, setStaffLeaves] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [activeCycle, setActiveCycle] = useState('');
  const [availableCycles, setAvailableCycles] = useState<string[]>([]);

  useEffect(() => {
    fetchStaff();
    fetchAllSubjects();
  }, []);

  async function fetchAllSubjects() {
    const { data } = await supabase.from('subjects').select('*').order('subject_name');
    setAllSubjects(data || []);
  }

  async function fetchStaff() {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .order('last_name');
      
      if (error) throw error;
      setStaff(data || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  }

  const fetchStaffSubjects = async (staffCode: string) => {
    try {
      setLoadingSubjects(true);
      const { data, error } = await supabase
        .from('teacher_subjects')
        .select(`
          subject_code,
          subjects (
            subject_name
          )
        `)
        .eq('staff_code', staffCode.trim());
      
      if (error) throw error;
      setSubjects(data || []);
    } catch (err) {
      console.error('Error fetching subjects:', err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchStaffLeaves = async (staffCode: string) => {
    try {
      setLoadingLeaves(true);
      const { data, error } = await supabase
        .from('staff_leaves')
        .select('*')
        .eq('staff_code', staffCode.trim())
        .order('leave_date', { ascending: false });
      
      if (error) throw error;
      setStaffLeaves(data || []);
    } catch (err) {
      console.error('Error fetching leaves:', err);
    } finally {
      setLoadingLeaves(false);
    }
  };

  const fetchStaffTimetable = async (staffCode: string) => {
    try {
      setLoadingTimetable(true);
      const { data, error } = await supabase
        .from('teaching_timetable')
        .select('*')
        .eq('staff_code', staffCode.trim())
        .order('day_of_cycle')
        .order('period');
      
      if (error) throw error;
      
      const records = data || [];
      const uniqueCycles = [...new Set(records.map(t => t.cycle))].sort();
      setAvailableCycles(uniqueCycles);
      
      if (uniqueCycles.length > 0 && (!activeCycle || !uniqueCycles.includes(activeCycle))) {
        setActiveCycle(uniqueCycles[0]);
      } else if (uniqueCycles.length === 0) {
        setActiveCycle('');
      }

      setTimetable(records);
    } catch (err) {
      console.error('Error fetching timetable:', err);
    } finally {
      setLoadingTimetable(false);
    }
  };

  const fetchStaffBreakDuties = async (staffCode: string) => {
    if (!staffCode) return;
    try {
      setLoadingBreak(true);
      setBreakDuties({ morning: [], afternoon: [] });
      
      const normalizedCode = staffCode.trim();
      
      // DIAGNOSTIC CORE
      console.group(`Break Duty Investigation: ${normalizedCode}`);
      
      const { data: listAllCodes } = await supabase.from('staff_duties').select('staff_code');
      if (listAllCodes) {
        const unique = [...new Set(listAllCodes.map(r => r.staff_code))];
        console.log('Codes in DB:', unique.map(c => `[${c}]`));
        const match = unique.find(c => (c || '').trim().toUpperCase() === normalizedCode.toUpperCase());
        if (match) console.log(`MATCH FOUND: "[${match}]" (Input was: "[${normalizedCode}]")`);
      }

      console.log('Fetching from "staff_duties"...');
      const { data, error } = await supabase
        .from('staff_duties')
        .select('*')
        .ilike('staff_code', normalizedCode.trim())
        .order('duty_date', { ascending: true });
      
      if (error) throw error;
      console.log(`Record count: ${data?.length || 0}`);
      
      if (data && data.length > 0) {
        console.log('Sample record fields:', Object.keys(data[0]));
        console.log('Sample duty_type:', data[0].duty_type);
        console.log('Sample duty_date:', data[0].duty_date);
      } else {
        // Fallback check to view
        const { data: vd } = await supabase.from('vw_break_duty').select('*').ilike('staff_code', normalizedCode.trim()).limit(1);
        console.log('View check (vw_break_duty):', vd?.length ? 'FOUND' : 'NOT FOUND');
      }

      console.groupEnd();
      
      const records = data || [];
      const morning = records
        .filter(d => {
          const type = (d.duty_type || '').trim().toLowerCase();
          return type === 'morning' || type === 'm' || type.includes('morn');
        })
        .map(d => {
          const dateStr = (d.duty_date || '').toString().trim();
          // Extract YYYY-MM-DD specifically
          const match = dateStr.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
          if (match) return `${match[1]}-${match[2]}-${match[3]}`;
          if (/^\d{4}/.test(dateStr)) return dateStr.substring(0, 10);
          return dateStr;
        });
      
      const afternoon = records
        .filter(d => {
          const type = (d.duty_type || '').trim().toLowerCase();
          return type === 'afternoon' || type === 'after' || type === 'p' || type === 'a';
        })
        .map(d => {
          const dateStr = (d.duty_date || '').toString().trim();
          const match = dateStr.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
          if (match) return `${match[1]}-${match[2]}-${match[3]}`;
          if (/^\d{4}/.test(dateStr)) return dateStr.substring(0, 10);
          return dateStr;
        });

      console.log('Processed Mornings:', morning.length);
      console.log('Processed Afternoons:', afternoon.length);
      console.log('--- DIAGNOSTIC END ---');

      setBreakDuties({ 
        morning: morning.filter(Boolean), 
        afternoon: afternoon.filter(Boolean) 
      });
    } catch (err) {
      console.error('Critical fetch error:', err);
    } finally {
      setLoadingBreak(false);
    }
  };

  const handleUpdateBreakDuties = async () => {
    if (!selectedStaff) return;
    
    try {
      setLoadingBreak(true);
      
      // Step 1 check - ensure we have the latest from DB to compare
      const { data: existingDuties, error: fetchError } = await supabase
        .from('staff_duties')
        .select('*')
        .ilike('staff_code', selectedStaff.staff_code.trim());
      
      if (fetchError) throw fetchError;
      
      const morningFromDB = existingDuties?.filter(d => d.duty_type === 'Morning') || [];
      const afternoonFromDB = existingDuties?.filter(d => d.duty_type === 'Afternoon') || [];

      // Step 2: Delete Logic
      const morningToDelete = morningFromDB
        .filter(d => !breakDuties.morning.includes(d.duty_date))
        .map(d => d.id);
      
      if (morningToDelete.length > 0) {
        const { error: delError } = await supabase.from('staff_duties').delete().in('id', morningToDelete);
        if (delError) throw delError;
      }

      const afternoonToDelete = afternoonFromDB
        .filter(d => !breakDuties.afternoon.includes(d.duty_date))
        .map(d => d.id);
      
      if (afternoonToDelete.length > 0) {
        const { error: delError } = await supabase.from('staff_duties').delete().in('id', afternoonToDelete);
        if (delError) throw delError;
      }

      // Step 3: Insert Logic for Morning
      const morningToInsert = breakDuties.morning
        .filter(date => !morningFromDB.some(d => d.duty_date === date))
        .map(date => ({
          staff_code: selectedStaff.staff_code,
          duty_date: date,
          duty_type: 'Morning'
        }));
      
      if (morningToInsert.length > 0) {
        const { error: insError } = await supabase.from('staff_duties').insert(morningToInsert);
        if (insError) throw insError;
      }

      // Step 4: Insert Logic for Afternoon
      const afternoonToInsert = breakDuties.afternoon
        .filter(date => !afternoonFromDB.some(d => d.duty_date === date))
        .map(date => ({
          staff_code: selectedStaff.staff_code,
          duty_date: date,
          duty_type: 'Afternoon'
        }));
      
      if (afternoonToInsert.length > 0) {
        const { error: insError } = await supabase.from('staff_duties').insert(afternoonToInsert);
        if (insError) throw insError;
      }

      setActiveModal(null);
    } catch (err) {
      console.error('Error synchronizing break duties:', err);
      alert('Strategic synchronization failed. Field data may be lost.');
    } finally {
      setLoadingBreak(false);
    }
  };

  const filteredStaff = staff.filter(s => {
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase();
    const searchLow = search.toLowerCase();
    return fullName.includes(searchLow) ||
           s.staff_code?.toLowerCase().includes(searchLow) ||
           s.role?.toLowerCase().includes(searchLow);
  });

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
           { label: 'Avg Duty Load', val: staff.length > 0 ? (staff.reduce((acc, s) => acc + (s.load_percentage ?? 100), 0) / staff.length).toFixed(1) + '%' : '0.0%', icon: TrendingUp },
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
              <tr key={person.staff_code} className="group hover:bg-indigo-50/30 transition-colors">
                <td className="px-10 py-7">
                   <div className="h-14 w-14 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-indigo-600 font-black text-xs shadow-sm transition-transform group-hover:scale-110 group-hover:border-indigo-200 italic">
                      {person.staff_code}
                   </div>
                </td>
                <td className="px-10 py-7">
                   <div className="flex flex-col">
                     <span className="font-black text-slate-900 text-lg tracking-tight italic uppercase">{person.first_name} {person.last_name}</span>
                     <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{person.staff_code}@school.edu</span>
                   </div>
                </td>
                <td className="px-6 py-7">
                  <div className="flex flex-col gap-1">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200/50 italic w-fit">
                      <Shield className="h-3 w-3 text-indigo-400" />
                      {person.role || 'General'}
                    </span>
                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest ml-4 italic">
                      Load: {person.load_percentage ?? 100}%
                    </span>
                  </div>
                </td>
                <td className="px-6 py-7">
                   <div className="flex items-center gap-3">
                      <button 
                        onClick={() => { setSelectedStaff(person); setActiveModal('subjects'); fetchStaffSubjects(person.staff_code); }}
                        className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-100 transition-all hover:bg-emerald-50"
                        title="Subjects"
                      >
                         <BookOpen className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => { setSelectedStaff(person); setActiveModal('leave'); fetchStaffLeaves(person.staff_code); }}
                        className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-orange-600 hover:border-orange-100 transition-all hover:bg-orange-50"
                        title="Leave"
                      >
                         <CalendarX className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => { setSelectedStaff(person); setActiveModal('break'); fetchStaffBreakDuties(person.staff_code); }}
                        className="h-10 w-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-pink-600 hover:border-pink-100 transition-all hover:bg-pink-50"
                        title="Break Duty"
                      >
                         <Coffee className="h-4 w-4" />
                      </button>
                      <button 
                         onClick={() => { setSelectedStaff(person); setActiveModal('timetable'); fetchStaffTimetable(person.staff_code); }}
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
                    Role
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
            title="Strategic Role Assignment" 
            subtitle={`${selectedStaff.first_name} ${selectedStaff.last_name} (${selectedStaff.staff_code})`}
            footer={
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveModal(null)}
                  className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase text-[11px] tracking-widest border border-slate-100 hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
                <button 
                  disabled={loadingRole || !roleValue}
                  onClick={async () => {
                    setLoadingRole(true);
                    try {
                      const { error } = await supabase
                        .from('staff')
                        .update({ role: roleValue })
                        .eq('staff_code', selectedStaff.staff_code);
                      
                      if (!error) {
                        setStaff(prev => prev.map(s => s.staff_code === selectedStaff.staff_code ? { ...s, role: roleValue } : s));
                        setActiveModal(null);
                      } else {
                        throw error;
                      }
                    } catch (err) {
                      console.error('Error updating role:', err);
                      alert('Strategic role update failed.');
                    } finally {
                      setLoadingRole(false);
                    }
                  }}
                  className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-indigo-600 shadow-xl shadow-indigo-900/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loadingRole ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save Changes
                </button>
              </div>
            }
          >
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2 italic">Operational Designation</label>
                <div className="relative group">
                  <select 
                    value={roleValue}
                    onChange={(e) => setRoleValue(e.target.value)}
                    className="w-full h-20 px-10 bg-slate-50 border border-slate-100 rounded-[2.5rem] outline-none font-black text-lg appearance-none cursor-pointer focus:border-indigo-300 transition-all shadow-inner uppercase italic tracking-tight"
                  >
                    <option value="" disabled>Select role...</option>
                    <option value="Scattered">Scattered</option>
                    <option value="Marathon">Marathon</option>
                    <option value="OPS">OPS</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-hover:text-indigo-400 transition-colors">
                    <Shield className="h-6 w-6" />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center italic">
                Updating this role affects tactical load balancing and deployment metrics.
              </p>
            </div>
          </Modal>
        )}

        {activeModal === 'subjects' && selectedStaff && (
          <Modal 
            isOpen={true} 
            onClose={() => setActiveModal(null)} 
            title="Assigned Subjects" 
            subtitle={`${selectedStaff.first_name} ${selectedStaff.last_name} (${selectedStaff.staff_code})`}
          >
            <div className="space-y-8">
              <div className="flex gap-4">
                <select 
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  disabled={loadingSubjects}
                  className="flex-1 h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold disabled:opacity-50"
                >
                  <option value="">Select subject...</option>
                  {allSubjects
                    .filter(s => !subjects.some(active => active.subject_code === s.subject_code))
                    .map(s => (
                      <option key={s.subject_code} value={s.subject_code}>{s.subject_name}</option>
                    ))}
                </select>
                <button 
                  onClick={async () => { 
                    if (newSubject && !loadingSubjects) { 
                      // Duplicate Check (extra guard)
                      if (subjects.some(s => s.subject_code === newSubject)) {
                        return;
                      }

                      setLoadingSubjects(true);
                      const { error } = await supabase
                        .from('teacher_subjects')
                        .insert({ staff_code: selectedStaff.staff_code, subject_code: newSubject });
                      
                      if (!error) {
                        await fetchStaffSubjects(selectedStaff.staff_code);
                        setNewSubject('');
                      } else {
                        console.error('Error adding subject:', error);
                        alert('Failed to assign subject.');
                      }
                      setLoadingSubjects(false);
                    } 
                  }}
                  disabled={!newSubject || loadingSubjects}
                  className="h-14 px-6 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingSubjects ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Add
                </button>
              </div>

              <div className="space-y-3">
                {loadingSubjects && subjects.length === 0 ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-8 w-8 text-indigo-200 animate-spin" />
                  </div>
                ) : (
                  <>
                    {subjects.map((sub, idx) => {
                      const subjectName = Array.isArray(sub.subjects) 
                        ? sub.subjects[0]?.subject_name 
                        : sub.subjects?.subject_name;
                      
                      return (
                        <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 uppercase tracking-tight italic">
                              {subjectName || 'Unknown Subject'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                              {sub.subject_code}
                            </span>
                          </div>
                          <button 
                            onClick={async () => {
                              if (loadingSubjects) return;
                              setLoadingSubjects(true);
                              const { error } = await supabase
                                .from('teacher_subjects')
                                .delete()
                                .eq('staff_code', selectedStaff.staff_code)
                                .eq('subject_code', sub.subject_code);
                              
                              if (!error) {
                                await fetchStaffSubjects(selectedStaff.staff_code);
                              }
                              setLoadingSubjects(false);
                            }}
                            className="h-10 w-10 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                    {subjects.length === 0 && !loadingSubjects && (
                      <div className="py-12 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200 flex flex-col items-center justify-center gap-4">
                        <BookOpen className="h-8 w-8 text-slate-200" />
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] italic">No subjects assigned</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </Modal>
        )}

        {activeModal === 'leave' && selectedStaff && (
          <Modal 
            isOpen={true} 
            onClose={() => setActiveModal(null)} 
            title="Leave Management" 
            subtitle={`${selectedStaff.first_name} ${selectedStaff.last_name} (${selectedStaff.staff_code})`}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Absence Date</label>
                  <input 
                    type="date" 
                    value={leaveData.date}
                    onChange={(e) => setLeaveData({...leaveData, date: e.target.value})}
                    className="w-full h-14 px-6 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:border-indigo-300 outline-none transition-all" 
                  />
                </div>
                <label className="flex items-center gap-4 cursor-pointer group bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all">
                  <div className={cn(
                    "h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all",
                    leaveData.isFullDay ? "bg-indigo-600 border-indigo-600" : "border-slate-200 bg-white"
                  )}>
                    {leaveData.isFullDay && <Check className="h-4 w-4 text-white" />}
                  </div>
                  <input 
                    type="checkbox" 
                    checked={leaveData.isFullDay}
                    onChange={(e) => setLeaveData({...leaveData, isFullDay: e.target.checked})}
                    className="hidden" 
                  />
                  <span className="text-sm font-black text-slate-700 uppercase tracking-tight italic">Full Day Absence</span>
                </label>

                <AnimatePresence mode="wait">
                  {!leaveData.isFullDay && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-2 gap-4 pb-1">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">Start</label>
                          <input 
                            type="time" 
                            value={leaveData.startTime} 
                            onChange={(e) => setLeaveData({...leaveData, startTime: e.target.value})}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-center outline-none focus:border-indigo-300 transition-all text-sm" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">End</label>
                          <input 
                            type="time" 
                            value={leaveData.endTime} 
                            onChange={(e) => setLeaveData({...leaveData, endTime: e.target.value})}
                            className="w-full h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-center outline-none focus:border-indigo-300 transition-all text-sm" 
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Reason / Context</label>
                  <textarea 
                    placeholder="Provide operational context for this request..."
                    value={leaveData.reason}
                    onChange={(e) => setLeaveData({...leaveData, reason: e.target.value})}
                    className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] font-bold h-32 outline-none focus:border-indigo-300 transition-all resize-none placeholder:text-slate-300"
                  ></textarea>
                </div>
                <button 
                  disabled={loadingLeaves || !leaveData.date || !leaveData.reason}
                  onClick={async () => {
                    setLoadingLeaves(true);
                    try {
                      const { error } = await supabase
                        .from('staff_leaves')
                        .insert({
                          staff_code: selectedStaff.staff_code,
                          leave_date: leaveData.date,
                          full_day: leaveData.isFullDay,
                          begin_time: leaveData.isFullDay ? null : leaveData.startTime,
                          end_time: leaveData.isFullDay ? null : leaveData.endTime,
                          reason: leaveData.reason
                        });
                      
                      if (!error) {
                        await fetchStaffLeaves(selectedStaff.staff_code);
                        setLeaveData({
                          date: '',
                          isFullDay: true,
                          startTime: '07:30',
                          endTime: '14:30',
                          reason: ''
                        });
                      } else {
                        throw error;
                      }
                    } catch (err) {
                      console.error('Error logging leave:', err);
                      alert('Failed to log absence.');
                    } finally {
                      setLoadingLeaves(false);
                    }
                  }}
                  className="w-full h-16 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest hover:bg-indigo-600 transition-all shadow-2xl shadow-indigo-900/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  {loadingLeaves ? <Loader2 className="h-5 w-5 animate-spin" /> : <Shield className="h-5 w-5 group-hover:rotate-12 transition-transform" />}
                  Log Absence
                </button>
              </div>

              <div className="bg-slate-50/50 rounded-[3rem] p-8 border border-slate-100 flex flex-col h-[500px]">
                <div className="flex items-center justify-between mb-8">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Deployment Log</h5>
                  <div className="h-8 px-3 rounded-full bg-indigo-50 border border-indigo-100 flex items-center gap-2">
                    <Clock className="h-3 w-3 text-indigo-400" />
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{staffLeaves.length} Records</span>
                  </div>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto pr-4 scrollbar-hide">
                  {loadingLeaves && staffLeaves.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <Loader2 className="h-8 w-8 text-indigo-200 animate-spin" />
                    </div>
                  ) : (
                    <>
                      {staffLeaves.map((leave, idx) => (
                        <div key={idx} className="group p-5 bg-white rounded-3xl border border-slate-100 shadow-sm hover:border-indigo-100 transition-all">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex flex-col">
                              <span className="font-black text-slate-900 text-sm tracking-tight italic uppercase">
                                {new Date(leave.leave_date + 'T12:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </span>
                              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                Approved
                              </span>
                            </div>
                            <span className="text-[9px] font-black px-4 py-1.5 bg-slate-50 rounded-full text-slate-400 uppercase tracking-widest border border-slate-100 italic">
                              {leave.full_day ? 'Full Day' : `${leave.begin_time} - ${leave.end_time}`}
                            </span>
                          </div>
                          {leave.reason && (
                            <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 font-medium leading-relaxed italic border border-slate-100/50">
                              {leave.reason}
                            </div>
                          )}
                        </div>
                      ))}
                      {staffLeaves.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center gap-4 py-20 bg-white/50 rounded-[2.5rem] border border-dashed border-slate-200">
                           <CalendarX className="h-10 w-10 text-slate-200" />
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No absence records detected</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </Modal>
        )}

        {activeModal === 'break' && selectedStaff && (
          <Modal 
            isOpen={true} 
            onClose={() => setActiveModal(null)} 
            title="Break Duty Assignments" 
            subtitle={`${selectedStaff.first_name} ${selectedStaff.last_name} (${selectedStaff.staff_code})`}
            footer={
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveModal(null)} 
                  className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase text-[11px] tracking-widest border border-slate-100 transition-all hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateBreakDuties}
                  disabled={loadingBreak}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingBreak ? 'Updating...' : 'Update'}
                </button>
              </div>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {loadingBreak ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <Loader2 className="h-10 w-10 text-indigo-500" />
                  </motion.div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Synching Tactical Assignments...</p>
                </div>
              ) : (
                <>
                  {/* Morning Column */}
                  <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Morning</h5>
                  <button 
                    disabled={!selectedBreakItem.morning}
                    onClick={() => {
                      if (selectedBreakItem.morning) {
                        setBreakDuties(prev => ({
                          ...prev,
                          morning: prev.morning.filter(date => date !== selectedBreakItem.morning)
                        }));
                        setSelectedBreakItem(prev => ({ ...prev, morning: null }));
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest border border-red-100 disabled:opacity-30 transition-all"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
                
                <div className="flex gap-3">
                  <input 
                    type="date" 
                    value={newBreakDate.morning}
                    onChange={(e) => setNewBreakDate(prev => ({ ...prev, morning: e.target.value }))}
                    className="flex-1 h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none" 
                  />
                  <button 
                    onClick={() => {
                      if (newBreakDate.morning && !breakDuties.morning.includes(newBreakDate.morning)) {
                        setBreakDuties(prev => ({
                          ...prev,
                          morning: [...prev.morning, newBreakDate.morning].sort()
                        }));
                        setNewBreakDate(prev => ({ ...prev, morning: '' }));
                      }
                    }}
                    className="h-12 w-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                    {breakDuties.morning.map(date => (
                      <button
                        key={date}
                        onClick={() => setSelectedBreakItem(prev => ({ ...prev, morning: date }))}
                        className={cn(
                          "w-full px-4 py-3 rounded-xl text-left font-bold text-xs transition-all",
                          selectedBreakItem.morning === date 
                            ? "bg-white text-indigo-600 shadow-sm border border-indigo-100" 
                            : "text-slate-500 hover:bg-white/50"
                        )}
                      >
                        {new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </button>
                    ))}
                    {breakDuties.morning.length === 0 && (
                      <div className="py-8 text-center">
                        <p className="text-[10px] text-slate-300 italic font-bold">No Morning Duties</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Afternoon Column */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Afternoon</h5>
                  <button 
                    disabled={!selectedBreakItem.afternoon}
                    onClick={() => {
                      if (selectedBreakItem.afternoon) {
                        setBreakDuties(prev => ({
                          ...prev,
                          afternoon: prev.afternoon.filter(date => date !== selectedBreakItem.afternoon)
                        }));
                        setSelectedBreakItem(prev => ({ ...prev, afternoon: null }));
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest border border-red-100 disabled:opacity-30 transition-all"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
                
                <div className="flex gap-3">
                  <input 
                    type="date" 
                    value={newBreakDate.afternoon}
                    onChange={(e) => setNewBreakDate(prev => ({ ...prev, afternoon: e.target.value }))}
                    className="flex-1 h-12 px-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm outline-none" 
                  />
                  <button 
                    onClick={() => {
                      if (newBreakDate.afternoon && !breakDuties.afternoon.includes(newBreakDate.afternoon)) {
                        setBreakDuties(prev => ({
                          ...prev,
                          afternoon: [...prev.afternoon, newBreakDate.afternoon].sort()
                        }));
                        setNewBreakDate(prev => ({ ...prev, afternoon: '' }));
                      }
                    }}
                    className="h-12 w-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                    {breakDuties.afternoon.map(date => (
                      <button
                        key={date}
                        onClick={() => setSelectedBreakItem(prev => ({ ...prev, afternoon: date }))}
                        className={cn(
                          "w-full px-4 py-3 rounded-xl text-left font-bold text-xs transition-all",
                          selectedBreakItem.afternoon === date 
                            ? "bg-white text-indigo-600 shadow-sm border border-indigo-100" 
                            : "text-slate-500 hover:bg-white/50"
                        )}
                      >
                        {new Date(date + 'T12:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </button>
                    ))}
                    {breakDuties.afternoon.length === 0 && (
                      <div className="py-8 text-center">
                        <p className="text-[10px] text-slate-300 italic font-bold">No Afternoon Duties</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
        )}

        {activeModal === 'timetable' && selectedStaff && (
          <Modal 
            isOpen={true} 
            onClose={() => setActiveModal(null)} 
            title="Teaching Timetable" 
            subtitle={`${selectedStaff.first_name} ${selectedStaff.last_name} (${selectedStaff.staff_code})`}
            maxWidth="max-w-4xl"
          >
            <div className="space-y-8">
              <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                {availableCycles.length > 0 ? (
                  availableCycles.map(c => (
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
                  ))
                ) : (
                  <div className="flex-1 py-3 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                    No Cycles Found
                  </div>
                )}
              </div>

              {loadingTimetable ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <Loader2 className="h-10 w-10 text-indigo-200" />
                  </motion.div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest transition-all animate-pulse">Syncing tactical schedule...</p>
                </div>
              ) : timetable.length === 0 ? (
                <div className="py-20 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 flex flex-col items-center justify-center gap-4">
                  <LayoutGrid className="h-10 w-10 text-slate-200" />
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No timetable entries found</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-[2rem] border border-slate-100">
                  <table className="w-full text-left border-collapse bg-slate-50/20">
                    <thead>
                      <tr className="bg-white border-b border-slate-100">
                        <th className="p-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">Period</th>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((d, i) => (
                          <th key={d} className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center whitespace-nowrap">{d}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5, 6, 7].map(p => (
                        <tr key={p} className="border-b border-slate-50 last:border-0 group hover:bg-white transition-colors">
                          <td className="p-4 font-black text-slate-400 text-sm whitespace-nowrap uppercase italic tracking-tighter">P{p}</td>
                          {[0, 1, 2, 3, 4].map(d => {
                            const slot = timetable.find(t => t.day_of_cycle === d && t.period === p && t.cycle === activeCycle);
                            
                            // Determine cell style based on class_code value
                            let cellStyle = "bg-purple-50 text-purple-400 border-purple-100 shadow-sm shadow-purple-100/30"; // Default: Purple
                            
                            if (slot && slot.class_code) {
                              const code = slot.class_code.toString().trim();
                              if (code.startsWith('12')) {
                                cellStyle = "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200 shadow-sm shadow-fuchsia-100/50 hover:bg-fuchsia-100";
                              } else if (code.startsWith('11')) {
                                cellStyle = "bg-orange-50 text-orange-600 border-orange-200 shadow-sm shadow-orange-100/50 hover:bg-orange-100";
                              } else if (code.startsWith('10')) {
                                cellStyle = "bg-teal-50 text-teal-600 border-teal-200 shadow-sm shadow-teal-100/50 hover:bg-teal-100";
                              } else if (code.startsWith('9')) {
                                cellStyle = "bg-lime-50 text-emerald-700 border-lime-200 shadow-sm shadow-lime-100/50 hover:bg-lime-100";
                              } else if (code.startsWith('8')) {
                                cellStyle = "bg-yellow-50 text-yellow-700 border-yellow-300 shadow-sm shadow-yellow-100/50 hover:bg-yellow-100";
                              } else {
                                // Fallback for other codes if any
                                cellStyle = "bg-indigo-50 text-indigo-600 border-indigo-100 shadow-sm shadow-indigo-100/50 hover:bg-indigo-100";
                              }
                            }

                            return (
                              <td key={d} className="p-2 border-l border-slate-50 min-w-[140px]">
                                <motion.div 
                                  initial={slot ? { opacity: 0, scale: 0.95 } : {}}
                                  animate={slot ? { opacity: 1, scale: 1 } : {}}
                                  className={cn(
                                    "text-center font-black text-[11px] py-4 rounded-xl transition-all uppercase tracking-tight italic border",
                                    cellStyle
                                  )}
                                >
                                  {slot ? slot.class_code : 'FREE'}
                                </motion.div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className="text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold">Strategic display of master instructional deployment</p>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

function Modal({ isOpen, onClose, title, subtitle, children, footer, maxWidth = "max-w-2xl" }: { isOpen: boolean, onClose: () => void, title: string, subtitle?: string, children: React.ReactNode, footer?: React.ReactNode, maxWidth?: string }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl">
       <motion.div 
         initial={{ scale: 0.9, opacity: 0, y: 50 }} 
         animate={{ scale: 1, opacity: 1, y: 0 }} 
         exit={{ scale: 0.9, opacity: 0, y: 50 }} 
         className={cn("relative w-full bg-white rounded-[4rem] overflow-hidden shadow-2xl", maxWidth)}
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

