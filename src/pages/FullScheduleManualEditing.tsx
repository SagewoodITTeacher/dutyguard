import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Users, 
  Clock, 
  Search, 
  Save, 
  Plus,
  Info,
  Calendar,
  Warehouse,
  History,
  Shield,
  Monitor,
  AlertTriangle,
  ChevronRight,
  MoreVertical,
  Briefcase,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

// --- Types ---
type SessionType = 'morning' | 'afternoon';

interface Staff {
  id: string;
  code: string;
  name: string;
  color: string;
}

interface GradeConfig {
  grade: number;
  label: string;
  color: string;
  venues: string[];
  hasTech: boolean;
}

interface SlotInfo {
  grade: number;
  session: SessionType;
  venue: string;
  period: string;
  slotIndex: number;
}

// --- Constants ---
const MORNING_PERIODS = [
  { id: 'P1', time: '07:50' },
  { id: 'P2', time: '08:40' },
  { id: 'P3', time: '09:30' },
  { id: 'B1', time: '10:20' }, // Break
  { id: 'P4', time: '10:40' },
  { id: 'P5', time: '11:30' },
];

const AFTERNOON_PERIODS = [
  { id: 'P6', time: '12:20' },
  { id: 'B2', time: '13:10' }, // Break
  { id: 'P7', time: '13:40' },
  { id: 'A1', time: '14:30' },
  { id: 'A2', time: '15:20' },
  { id: 'A3', time: '16:10' },
];

const getTimesForDay = (dateStr: string, isMorning: boolean) => {
  const date = new Date(dateStr);
  const day = date.getDay(); // 0 = Sun, 1 = Mon, ..., 3 = Wed, 5 = Fri
  
  const periods = isMorning ? MORNING_PERIODS : AFTERNOON_PERIODS;

  if (day === 3) { // Wednesday
    return periods.map(p => ({
      ...p,
      time: p.time.replace('50', '45').replace('40', '35').replace('30', '25').replace('20', '15').replace('00', '55') // Illustrative shift
    }));
  }
  if (day === 5) { // Friday
    return periods.map(p => ({
      ...p,
      time: p.time.replace('50', '55').replace('40', '45') // Illustrative shift
    }));
  }

  return periods;
};

const GRADE_CONFIGS: GradeConfig[] = [
  { 
    grade: 12, 
    label: 'GRADE 12', 
    color: 'pink', 
    venues: ['Main Hall', 'Visual Art Lab', 'LS Lab 1 (TECH)', 'LS Lab 2 (TECH)', 'LS Lab 3 (TECH)', 'IT LAB (TECH)', 'CAT LAB (TECH)'], 
    hasTech: true 
  },
  { 
    grade: 11, 
    label: 'GRADE 11', 
    color: 'orange', 
    venues: ['Ms Kunene', 'Ms Lubbe', 'Ms Ragoabe', 'Mr Fourie', 'Ms Pienaar', 'Visual Art Lab', 'LS Lab 1', 'LS Lab 2', 'LS Lab 3', 'IT LAB', 'CAT LAB'], 
    hasTech: true 
  },
  { 
    grade: 10, 
    label: 'GRADE 10', 
    color: 'sky', 
    venues: ['Ms Ferreira', 'Mrs Lezar', 'Mrs Van De Westhuizen', 'Mr Dlamini', 'Visual Art Lab', 'LS Lab 1', 'LS Lab 2', 'LS Lab 3', 'IT LAB', 'CAT LAB'], 
    hasTech: true 
  },
  { 
    grade: 9, 
    label: 'GRADE 9', 
    color: 'lime', 
    venues: ['Ms Mathabe', 'Ms Mngadi', 'Mr Sehlapelo', 'Ms Diaman', 'Mr Letswalo'], 
    hasTech: false 
  },
  { 
    grade: 8, 
    label: 'GRADE 8', 
    color: 'yellow', 
    venues: ['Mr Makowa', 'Ms Mouton', 'Mrs Govender', 'Mrs Mvukwe'], 
    hasTech: false 
  },
];

interface StaffMember extends Staff {
  category: 'available' | 'free' | 'assigned' | 'leave' | 'standby' | 'tech' | 'break';
  status: string;
  role: 'Scattered' | 'Marathon';
}

const STAFF_POOL: StaffMember[] = [
  { id: '1', code: 'FRAN', name: 'Franz Nortjé', color: 'bg-emerald-600', category: 'available', status: 'Free: P3, P4', role: 'Marathon' },
  { id: '2', code: 'JOHD', name: 'John Doe', color: 'bg-blue-600', category: 'free', status: 'Free: P1, P2, P5', role: 'Scattered' },
  { id: '3', code: 'AMOP', name: 'Amy Mopor', color: 'bg-purple-600', category: 'assigned', status: 'Assigned: P2 (G12)', role: 'Marathon' },
  { id: '4', code: 'LOGF', name: 'Logan Finn', color: 'bg-orange-600', category: 'leave', status: 'On Leave: Sick', role: 'Scattered' },
  { id: '5', code: 'EZRN', name: 'Ezra N.', color: 'bg-yellow-600', category: 'standby', status: 'Stand-By: P4', role: 'Marathon' },
  { id: '6', code: 'SMIT', name: 'Smith J.', color: 'bg-purple-600', category: 'tech', status: 'Tech Duty: Morning', role: 'Scattered' },
  { id: '7', code: 'BROWNE', name: 'Brown E.', color: 'bg-emerald-600', category: 'available', status: 'Free: All Day', role: 'Marathon' },
  { id: '8', code: 'KUNE', name: 'Kunene S.', color: 'bg-emerald-600', category: 'available', status: 'Free: P6, P7', role: 'Scattered' },
  { id: '9', code: 'LUBBM', name: 'Lubbe M.', color: 'bg-blue-600', category: 'free', status: 'Free: P4', role: 'Marathon' },
  { id: '10', code: 'TECH', name: 'Tech Master', color: 'bg-purple-600', category: 'tech', status: 'Tech Duty: Afternoon', role: 'Scattered' },
];

export function FullScheduleManualEditing() {
  const [selectedDate, setSelectedDate] = useState('2026-05-18');
  const [selectedGrade, setSelectedGrade] = useState('12');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [draggedStaff, setDraggedStaff] = useState<Staff | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const [settings, setSettings] = useState({
    subjectG12: true,
    techLabsOnly: true,
    techNoOtherDuty: true,
    techPracOnly: true,
    g89BeforeJune: true,
    scatteredConsecutive: true,
    marathonConsecutive: true,
    maxSessions: 3,
    autoMoveAssigned: true,
    autoMoveTech: true,
    autoMoveStandby: true,
    autoMoveBreak: true,
    oneSlotPerPeriod: true,
    breakDutyConflict: true,
  });

  const addAuditLog = (msg: string) => {
    setAuditLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));
  };

  // Load some initial assignments
  useEffect(() => {
    setAssignments({
      '12-morning-Main Hall-P1-0': 'FRAN',
      '11-morning-Ms Kunene-P1-0': 'KUNE',
      '11-morning-Tech Duty-P1-0': 'TECH',
    });
  }, []);

  const handleDragStart = (staff: Staff) => {
    if (!selectedSlot) {
      alert("Warning - pick a slot before adjusting");
      return;
    }
    setDraggedStaff(staff);
  };

  const handleAssign = (staffCode: string) => {
    if (!selectedSlot) {
      // Improved feedback if no slot is selected
      const feedbackEl = document.createElement('div');
      feedbackEl.className = 'fixed bottom-10 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl z-[1000]';
      feedbackEl.innerText = `PLEASE SELECT A SLOT IN THE GRID FIRST`;
      document.body.appendChild(feedbackEl);
      setTimeout(() => feedbackEl.remove(), 2000);
      return;
    }
    
    const slotId = `${selectedSlot.grade}-${selectedSlot.session}-${selectedSlot.venue}-${selectedSlot.period}-${selectedSlot.slotIndex}`;
    
    // Conflict check - simplified and more robust
    const hasConflict = Object.entries(assignments).some(([id, code]) => {
      if (code !== staffCode) return false;
      const [, session, , period] = id.split('-');
      // Same session and same period, excluding the current slot itself
      return session === selectedSlot.session && period === selectedSlot.period && id !== slotId;
    });

    if (hasConflict) {
      alert(`Conflict: ${staffCode} is already assigned to ${selectedSlot.period} in this session.`);
      return;
    }

    const staff = STAFF_POOL.find(s => s.code === staffCode);
    
    // Check if assigning to Break Duty (B1 or B2)
    const isBreakAssignment = selectedSlot.period === 'B1' || selectedSlot.period === 'B2';
    
    // Break Duty Rule: Cannot be assigned to other slots in same session if on break duty
    if (isBreakAssignment && settings.breakDutyConflict) {
      const hasOtherAssignmentInSession = Object.entries(assignments).some(([id, code]) => {
        if (code !== staffCode) return false;
        const [, session, , period] = id.split('-');
        return session === selectedSlot.session && !period.startsWith('B');
      });
      if (hasOtherAssignmentInSession) {
        alert(`Conflict: ${staffCode} is already assigned to another period in this session. Break Duty personnel cannot have other duties in the same session.`);
        return;
      }
    }

    // Vice versa: If already assigned in session, cannot take break duty
    if (!isBreakAssignment && settings.breakDutyConflict && !selectedSlot.period.startsWith('B')) {
      const hasBreakAssignmentInSession = Object.entries(assignments).some(([id, code]) => {
        if (code !== staffCode) return false;
        const [, session, , period] = id.split('-');
        return session === selectedSlot.session && (period === 'B1' || period === 'B2');
      });
      if (hasBreakAssignmentInSession) {
        alert(`Conflict: ${staffCode} is assigned to Break Duty in this session and cannot take additional duties.`);
        return;
      }
    }

    // Remove the blocking confirm and replace with implicit deployment
    // Users can always undo by removing the assignment
    setAssignments(prev => ({
      ...prev,
      [slotId]: staffCode
    }));
    addAuditLog(`Assigned ${staffCode} to G${selectedSlot.grade} ${selectedSlot.venue} ${selectedSlot.period} ${staff?.role === 'Marathon' ? '[MARATHON]' : ''}`);
    
    // Provision for clear visual feedback (Success Toast)
    const feedbackEl = document.createElement('div');
    feedbackEl.className = 'fixed bottom-10 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-8 py-4 rounded-3xl text-sm font-black uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(16,185,129,0.3)] z-[1000] flex items-center gap-4 border border-emerald-400/50 animate-in fade-in slide-in-from-bottom-5';
    feedbackEl.innerHTML = `
      <div class="h-6 w-6 bg-white/20 rounded-lg flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="h-4 w-4"><path d="M20 6L9 17l-5-5"/></svg>
      </div>
      <span>${staffCode} ASSIGNED SUCCESSFULLY</span>
    `;
    document.body.appendChild(feedbackEl);
    setTimeout(() => {
      feedbackEl.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-5');
      setTimeout(() => feedbackEl.remove(), 500);
    }, 2000);
  };

  const handleDrop = (grade: number, session: SessionType, venue: string, period: string, slotIndex: number) => {
    if (!draggedStaff) return;
    
    const slotId = `${grade}-${session}-${venue}-${period}-${slotIndex}`;
    
    // 1 venue/slot within same period rule
    if (settings.oneSlotPerPeriod) {
      const hasConflict = Object.entries(assignments).some(([id, code]) => {
        if (code !== draggedStaff.code) return false;
        const [, s, , p] = id.split('-');
        return s === session && p === period && id !== slotId;
      });

      if (hasConflict) {
        alert(`Conflict: ${draggedStaff.code} is already assigned to ${period} in this session.`);
        setDraggedStaff(null);
        return;
      }
    }

    // Break Duty Conflict check for drag-drop
    const isBreakAssignment = period === 'B1' || period === 'B2';
    if (settings.breakDutyConflict) {
       const hasConflictingAssignment = Object.entries(assignments).some(([id, code]) => {
         if (code !== draggedStaff.code) return false;
         const [, s, , p] = id.split('-');
         if (s !== session) return false;
         if (isBreakAssignment) return p !== period; // Already has other duty
         return p === 'B1' || p === 'B2'; // Already has break duty
       });

       if (hasConflictingAssignment) {
         alert(`Conflict: ${draggedStaff.code} has a Break Duty conflict in this session.`);
         setDraggedStaff(null);
         return;
       }
    }

    setAssignments(prev => ({
      ...prev,
      [slotId]: draggedStaff.code
    }));
    addAuditLog(`Dragged ${draggedStaff.code} to G${grade} ${venue} ${period}`);
    setDraggedStaff(null);
  };

  const removeAssignment = (slotId: string) => {
    const code = assignments[slotId];
    setAssignments(prev => {
      const next = { ...prev };
      delete next[slotId];
      return next;
    });
    addAuditLog(`Removed assignment ${code} from ${slotId}`);
  };

  const filteredStaff = STAFF_POOL.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         s.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    // If a slot is selected, we might want to prioritize showing people free for that period
    // For this mock, we'll just keep the search filter but in a real app we'd filter by selectedSlot.period
    return matchesSearch;
  });

  const getAvailableStaffForSlot = () => {
    if (!selectedSlot) return [];
    // Mock availability based on period
    return STAFF_POOL.filter(s => 
      !s.status.includes(selectedSlot.period) && 
      s.category !== 'leave' &&
      !Object.values(assignments).includes(s.code) // Not assigned anywhere yet (strict for demo)
    );
  };

  const staffToDisplay = (() => {
    const list = [...STAFF_POOL].map(s => {
      let currentCat = s.category;
      
      // Dynamic category calculation based on assignments
      const userAssignments = Object.entries(assignments).filter(([_, code]) => code === s.code);
      if (userAssignments.length > 0) {
        const hasTech = userAssignments.some(([id]) => id.includes('Tech Duty'));
        const hasStandby = userAssignments.some(([id]) => id.includes('Stand-By'));
        const hasBreak = userAssignments.some(([id]) => id.includes('-B1-') || id.includes('-B2-'));

        if (hasBreak && settings.autoMoveBreak) currentCat = 'break';
        else if (hasTech && settings.autoMoveTech) currentCat = 'tech';
        else if (hasStandby && settings.autoMoveStandby) currentCat = 'standby';
        else if (settings.autoMoveAssigned) currentCat = 'assigned';
      }

      return { ...s, category: currentCat as StaffMember['category'] };
    });

    const filtered = list.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (selectedSlot) {
      return filtered.sort((a, b) => {
        const aFree = a.status.includes('Free: ' + selectedSlot.period) || a.category === 'available' ? -1 : 1;
        const bFree = b.status.includes('Free: ' + selectedSlot.period) || b.category === 'available' ? -1 : 1;
        return aFree - bFree;
      });
    }
    return filtered;
  })();

  const handleAutoAssignTech = (grade: number, session: SessionType, periods: { id: string }[]) => {
    const techStaff = STAFF_POOL.filter(s => s.code.includes('TECH') || s.name.includes('Tech'));
    if (techStaff.length === 0) return;

    const newAssignments = { ...assignments };
    periods.forEach((p) => {
      // Tech Duty venue typically has 3 slots
      techStaff.slice(0, 3).forEach((staff, idx) => {
        const slotId = `${grade}-${session}-Tech Duty-${p.id}-${idx}`;
        newAssignments[slotId] = staff.code;
      });
    });

    setAssignments(newAssignments);
    addAuditLog(`Auto-assigned Tech Duty for G${grade} ${session} session`);
    alert(`Tech Duty teams deployed for the entire ${session} session duration.`);
  };

  const getSlotAssignedCode = (grade: number, session: SessionType, venue: string, period: string, slotIndex: number) => {
    return assignments[`${grade}-${session}-${venue}-${period}-${slotIndex}`];
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {/* --- Top Navigation --- */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between z-30 shadow-xl shrink-0">
        <div className="flex items-center gap-x-6">
          <Link to="/admin" className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-all text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-3">
              DUTYGUARD <span className="text-slate-500 font-medium">|</span> <span className="text-emerald-400">Scheduler</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-x-8 bg-slate-950/50 border border-slate-800 rounded-full px-8 py-2">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Jump to Grade</span>
            <select 
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                const element = document.getElementById(`grade-${e.target.value}`);
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              {[12, 11, 10, 9, 8].map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </div>
        </div>

        <button className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all shadow-lg shadow-emerald-900/20 group">
          <Save className="h-4 w-4 group-hover:scale-110 transition-transform" />
          <span>Save Schedule</span>
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* --- Main Scrollable Area --- */}
        <div className="flex-1 overflow-auto p-10 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <div className="max-w-[1400px] mx-auto space-y-24 pb-20">
            {GRADE_CONFIGS.map((config) => (
              <div key={config.grade} id={`grade-${config.grade}`} className="scroll-mt-32">
                {/* Grade Title */}
                <div className="flex items-center gap-x-4 mb-8">
                  <div className={cn(
                    "px-10 py-3 rounded-[2rem] text-2xl font-black italic tracking-tighter border-2 shadow-2xl skew-x-[-12deg]",
                    config.color === 'pink' ? "bg-pink-950/30 border-pink-500/40 text-pink-500" :
                    config.color === 'orange' ? "bg-orange-950/30 border-orange-500/40 text-orange-500" :
                    config.color === 'sky' ? "bg-sky-950/30 border-sky-500/40 text-sky-500" :
                    config.color === 'lime' ? "bg-lime-950/30 border-lime-500/40 text-lime-500" :
                    "bg-yellow-950/30 border-yellow-500/40 text-yellow-500"
                  )}>
                    {config.label}
                  </div>
                  <div className="h-[2px] flex-1 bg-gradient-to-r from-slate-800 to-transparent" />
                </div>

                {/* Sessions */}
                <div className="space-y-16">
                  <SessionSection 
                    config={config} 
                    sessionType="morning" 
                    periods={getTimesForDay(selectedDate, true)}
                    onDrop={handleDrop}
                    getSlotAssignedCode={getSlotAssignedCode}
                    setSelectedSlot={setSelectedSlot}
                    selectedSlot={selectedSlot}
                    onAutoAssignTech={handleAutoAssignTech}
                  />
                  <SessionSection 
                    config={config} 
                    sessionType="afternoon" 
                    periods={getTimesForDay(selectedDate, false)}
                    onDrop={handleDrop}
                    getSlotAssignedCode={getSlotAssignedCode}
                    setSelectedSlot={setSelectedSlot}
                    selectedSlot={selectedSlot}
                    onAutoAssignTech={handleAutoAssignTech}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- Right Sidebar --- */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col z-20 shadow-2xl">
          {/* Sidebar Header with Date Picker & Settings */}
          <div className="p-6 bg-slate-950 border-b border-slate-800">
             <div className="flex items-center justify-between mb-6">
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <button 
                  onClick={() => setShowSettings(true)}
                  className="h-10 w-10 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                   <Settings className="h-5 w-5" />
                </button>
             </div>
             
             <div className="relative group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
               <input 
                 type="text" 
                 placeholder="SEARCH STAFF..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-[10px] font-black placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-all uppercase"
               />
             </div>
          </div>

          {/* Top: Slot Details Panel */}
          <div className="p-6 border-b border-slate-800 bg-slate-950/30 min-h-[160px]">
             <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] mb-4 flex items-center gap-2">
               <Info className="h-3 w-3 text-emerald-400" /> Deployment Info
             </h4>
             {selectedSlot ? (
               <div className="space-y-4">
                 <div className="flex items-center gap-4">
                   <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                      <Warehouse className="h-5 w-5 text-emerald-400" />
                   </div>
                   <div>
                     <p className="text-xs font-black text-slate-200 uppercase tracking-tight">{selectedSlot.venue}</p>
                     <p className="text-[10px] text-slate-500 font-bold uppercase">{selectedSlot.period} • Slot {selectedSlot.slotIndex + 1}</p>
                   </div>
                 </div>
                 {getSlotAssignedCode(selectedSlot.grade, selectedSlot.session, selectedSlot.venue, selectedSlot.period, selectedSlot.slotIndex) ? (
                   <div className="flex items-center justify-between bg-slate-800 border border-slate-700 p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                         <div className="h-6 w-6 bg-emerald-600 rounded-lg flex items-center justify-center text-[10px] font-black italic">
                           {getSlotAssignedCode(selectedSlot.grade, selectedSlot.session, selectedSlot.venue, selectedSlot.period, selectedSlot.slotIndex)}
                         </div>
                         <span className="text-xs font-bold text-slate-300">Tactical Unit Deployed</span>
                      </div>
                      <button 
                        onClick={() => removeAssignment(`${selectedSlot.grade}-${selectedSlot.session}-${selectedSlot.venue}-${selectedSlot.period}-${selectedSlot.slotIndex}`)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                         <Plus className="h-4 w-4 rotate-45" />
                      </button>
                   </div>
                 ) : (
                   <p className="text-[10px] italic text-slate-500 uppercase tracking-widest text-center py-2 border border-dashed border-slate-800 rounded-xl">Stand-by Unit Awaited</p>
                 )}
               </div>
             ) : (
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center mt-6">Select a slot to view tactical data</p>
             )}
          </div>

          {/* Bottom: Staff Pool Categorized */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-900 border-b border-slate-800">
               <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] flex items-center gap-3">
                 <Users className="h-4 w-4 text-emerald-400" /> Personnel Assets
               </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
              {(['available', 'free', 'assigned', 'leave', 'standby', 'tech', 'break'] as const).map(cat => {
                const staffInCat = staffToDisplay.filter(s => s.category === cat);
                if (staffInCat.length === 0) return null;
 
                const catLabels = {
                  available: { label: 'Available Teachers', color: 'text-emerald-400' },
                  free: { label: 'Free Periods', color: 'text-blue-400' },
                  assigned: { label: 'Assigned Teachers', color: 'text-purple-400' },
                  leave: { label: 'On Leave', color: 'text-orange-400' },
                  standby: { label: 'Stand-By Duty', color: 'text-yellow-400' },
                  tech: { label: 'Tech Duty Assigned', color: 'text-purple-400' },
                  break: { label: 'Break-Duty', color: 'text-teal-400' }
                };

                return (
                  <div key={cat} className="space-y-3">
                    <h5 className={cn("text-[9px] font-black uppercase tracking-[0.2em] opacity-80", catLabels[cat].color)}>
                      {catLabels[cat].label}
                    </h5>
                    <div className="space-y-2">
                      {staffInCat.map((staff) => (
                        <div 
                          key={staff.id} 
                          onClick={() => handleAssign(staff.code)}
                          className={cn(
                            "group flex items-center gap-3 p-3 bg-slate-800 border border-slate-700 rounded-2xl hover:border-emerald-500/30 transition-all shadow-sm",
                            staff.category === 'leave' ? "opacity-50 grayscale cursor-not-allowed" : "cursor-pointer hover:bg-slate-800/80",
                            selectedSlot && assignments[`${selectedSlot.grade}-${selectedSlot.session}-${selectedSlot.venue}-${selectedSlot.period}-${selectedSlot.slotIndex}`] === staff.code && "ring-2 ring-emerald-500 border-emerald-500"
                          )}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black italic shadow-2xl relative overflow-hidden shrink-0",
                            staff.color
                          )}>
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative z-10">{staff.code}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className="text-xs font-black text-slate-200 uppercase italic tracking-tight truncate">{staff.name}</p>
                             <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5 truncate">{staff.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                    <Settings className="h-6 w-6 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">System Constraints</h2>
                    <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.2em] mt-1">Manual Rule Override Engine</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="h-10 w-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                >
                  <Plus className="h-5 w-5 rotate-45" />
                </button>
              </div>

              <div className="p-8 max-h-[60vh] overflow-y-auto space-y-6 scrollbar-thin scrollbar-thumb-slate-800">
                <div className="space-y-4">
                  {[
                    { id: 'subjectG12', label: 'Tchs teaching same subj as G12 cannot invigilate G12 (exc. Tech Duty)' },
                    { id: 'techLabsOnly', label: 'Tech Duty only allowed in Labs (LS, CAT, IT, Art)' },
                    { id: 'techNoOtherDuty', label: 'Tchs on Tech Duty for the day cannot do any other duty' },
                    { id: 'techPracOnly', label: 'Tech Duty slots only appear for [Prac] papers' },
                    { id: 'g89BeforeJune', label: 'Tchs teaching G8/9 before June 2026 cannot invigilate those periods' },
                    { id: 'scatteredConsecutive', label: 'Scattered teachers cannot do two consecutive periods' },
                    { id: 'marathonConsecutive', label: 'Marathon teachers prefer consecutive periods (ask confirmation)' },
                    { id: 'autoMoveAssigned', label: 'When a teacher who is available or free has been assigned, move them to the Assigned category' },
                    { id: 'autoMoveTech', label: 'When a teacher is assigned to Tech Duty, move them to the Tech Duty category' },
                    { id: 'autoMoveStandby', label: 'When a teacher is assigned to Stand-By, move them to the Stand-By category' },
                    { id: 'autoMoveBreak', label: 'When a teacher is assigned to Break Duty, move them to the Break-Duty category' },
                    { id: 'oneSlotPerPeriod', label: 'A teacher can only be assigned to 1 venue/slot within the same period on the same day' },
                    { id: 'breakDutyConflict', label: 'Teachers on Break Duty cannot invigilate during Break 1 or Break 2' },
                  ].map((rule) => (
                    <label key={rule.id} className="flex items-center gap-4 p-4 bg-slate-950/30 rounded-2xl border border-slate-800/50 hover:bg-slate-950/50 transition-colors cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={settings[rule.id as keyof typeof settings] as boolean}
                        onChange={(e) => setSettings(prev => ({ ...prev, [rule.id]: e.target.checked }))}
                        className="h-5 w-5 rounded-lg border-slate-700 bg-slate-800 text-emerald-500 focus:ring-offset-slate-900 focus:ring-emerald-500"
                      />
                      <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors uppercase tracking-tight leading-relaxed">{rule.label}</span>
                    </label>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-6">
                   <div className="flex items-center justify-between p-4 bg-slate-950/30 rounded-2xl border border-slate-800/50">
                      <div>
                        <p className="text-xs font-bold text-slate-300 uppercase tracking-tight">Max Sessions Per Session</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Recommended Limit: 3</p>
                      </div>
                      <input 
                        type="number" 
                        value={settings.maxSessions}
                        onChange={(e) => setSettings(prev => ({ ...prev, maxSessions: parseInt(e.target.value) }))}
                        className="w-20 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-sm font-bold text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      />
                   </div>
                </div>

                {auditLog.length > 0 && (
                  <div className="pt-6 border-t border-slate-800">
                    <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.3em] mb-4 flex items-center gap-2">
                       <History className="h-4 w-4 text-emerald-400" /> Audit Trail
                    </h3>
                    <div className="space-y-2">
                      {auditLog.map((log, i) => (
                        <p key={i} className="text-[10px] font-mono text-slate-500 truncate bg-slate-950/20 p-2 rounded-lg border border-slate-800/30 font-bold italic">{log}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 bg-slate-950/50 border-t border-slate-800 flex justify-end">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-emerald-900/20"
                >
                  Confirm Configuration
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-components ---

interface SessionSectionProps {
  config: GradeConfig;
  sessionType: SessionType;
  periods: { id: string, time: string }[];
  onDrop: (grade: number, session: SessionType, venue: string, period: string, slotIndex: number) => void;
  getSlotAssignedCode: (grade: number, session: SessionType, venue: string, period: string, slotIndex: number) => string | undefined;
  setSelectedSlot: (info: SlotInfo) => void;
  selectedSlot: SlotInfo | null;
  onAutoAssignTech: (grade: number, session: SessionType, periods: { id: string }[]) => void;
}

function SessionSection({ config, sessionType, periods, onDrop, getSlotAssignedCode, setSelectedSlot, selectedSlot, onAutoAssignTech }: SessionSectionProps) {
  const isMorning = sessionType === 'morning';
  const [isPrac, setIsPrac] = useState(false);
  
  // Determine venue rows
  const rows = [...config.venues, 'Stand-By'];
  if (config.hasTech) rows.push('Tech Duty');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-x-6 pl-4">
        <div className={cn(
          "uppercase tracking-[0.3em] font-black text-xs min-w-[140px]",
          isMorning ? "text-emerald-400" : "text-orange-400"
        )}>
          {isMorning ? 'Morning Session' : 'Afternoon Session'}
        </div>
        <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
           <span className="flex items-center gap-2">
             <Briefcase className="h-3 w-3" /> Business Economics {isPrac && <span className="text-emerald-400">[Prac]</span>} • P1
           </span>
           <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
           <span className="flex items-center gap-2">
             <Clock className="h-3 w-3" /> 180 min
           </span>
           <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
           <span className="flex items-center gap-2">
             <Users className="h-3 w-3" /> 124 Learners
           </span>
           <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
           <button 
             onClick={() => setIsPrac(!isPrac)}
             className={cn(
               "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
               isPrac ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-500 border border-slate-700 hover:text-slate-300"
             )}
           >
             Toggle Prac
           </button>
           {isPrac && (
             <button 
               onClick={() => onAutoAssignTech(config.grade, sessionType, periods)}
               className="px-3 py-1 bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all animate-pulse"
             >
               Auto-Assign Tech
             </button>
           )}
        </div>
      </div>

      <div className="border border-slate-800 rounded-[2.5rem] bg-slate-900 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-950/50">
                <th className="sticky left-0 bg-slate-900 p-6 text-left min-w-[240px] border-r border-slate-800 z-10">
                   <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Tactical Venue</span>
                </th>
                {periods.map(p => (
                  <th key={p.id} className="p-4 border-r border-slate-800 min-w-[140px]">
                    <div className="flex flex-col items-center">
                       <span className="text-xs font-black text-emerald-500 uppercase">{p.id}</span>
                       <span className="text-[9px] font-bold text-slate-500 mt-1">{p.time}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((venue) => (
                <tr key={venue} className="border-t border-slate-800 group hover:bg-slate-950/30 transition-colors">
                  <td className="sticky left-0 bg-slate-900 p-6 font-black italic text-sm tracking-tight border-r border-slate-800 text-slate-300 z-10 group-hover:bg-slate-950 transition-colors">
                    <div className="flex items-center justify-between">
                       <span>{venue}</span>
                       {venue === 'Main Hall' && <span className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter not-italic ml-2">(Max 7)</span>}
                       {venue === 'Tech Duty' && <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter not-italic ml-2">(Max 3)</span>}
                    </div>
                  </td>
                  {periods.map(p => {
                    const isBreak = p.id.startsWith('B');
                    
                    let slotCount = 1;
                    if (venue === 'Tech Duty') {
                      slotCount = 3;
                    } else if (venue === 'Main Hall' && config.grade === 12) {
                      slotCount = 7;
                    } else if (venue === 'Stand-By') {
                      slotCount = 1;
                    } else {
                      slotCount = 1;
                    }
                    
                    if (isBreak) {
                      if (config.grade === 12) {
                        slotCount = 7;
                      } else if (venue === 'Tech Duty') {
                        slotCount = 3;
                      } else {
                        slotCount = 1;
                      }
                    }

                    return (
                      <td key={p.id} className={cn("p-2 border-r border-slate-800", isBreak && "bg-slate-950/20")}>
                        <div className="space-y-1">
                          {Array.from({ length: slotCount }).map((_, idx) => {
                            const code = getSlotAssignedCode(config.grade, sessionType, venue, p.id, idx);
                            const isSelected = selectedSlot?.grade === config.grade && 
                                             selectedSlot?.session === sessionType && 
                                             selectedSlot?.venue === venue && 
                                             selectedSlot?.period === p.id && 
                                             selectedSlot?.slotIndex === idx;

                            return (
                              <Slot 
                                key={idx} 
                                code={code} 
                                isSelected={isSelected}
                                onClick={() => setSelectedSlot({ grade: config.grade, session: sessionType, venue, period: p.id, slotIndex: idx })}
                                onDrop={() => onDrop(config.grade, sessionType, venue, p.id, idx)}
                              />
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Slot({ code, isSelected, onClick, onDrop }: { code?: string; isSelected?: boolean; onClick: () => void; onDrop: () => void; key?: React.Key }) {
  const [isOver, setIsOver] = useState(false);
  const staff = code ? STAFF_POOL.find(s => s.code === code) : null;

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={() => { setIsOver(false); onDrop(); }}
      onClick={onClick}
      className={cn(
        "h-[38px] w-full rounded-lg text-[10px] font-black flex items-center justify-center transition-all cursor-pointer relative overflow-hidden",
        code 
          ? "bg-slate-800 text-white shadow-lg border border-slate-700" 
          : "border-2 border-dashed border-slate-700 hover:border-slate-500 bg-slate-800/10 hover:bg-slate-800/50",
        isSelected && "ring-2 ring-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)] bg-emerald-500/10",
        isOver && !code && "bg-emerald-500/20 border-emerald-500 ring-2 ring-emerald-500/50"
      )}
    >
      <div className="flex items-center gap-1.5 px-2">
        {staff && (
          <span className="text-[8px] opacity-70">
            {staff.role === 'Scattered' ? '▲' : '■'}
          </span>
        )}
        <span>{code}</span>
      </div>
      {!code && <Plus className="h-3 w-3 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity" />}
    </div>
  );
}
