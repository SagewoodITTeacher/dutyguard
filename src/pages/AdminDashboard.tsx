import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Warehouse, 
  AlertCircle, 
  Calendar, 
  CalendarX,
  ChevronRight, 
  ArrowRight,
  Download,
  Sparkles,
  Zap,
  History,
  Shield,
  CheckCircle2,
  X,
  Play,
  Loader2,
  Clock,
  Layout,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { SchedulerService } from '../services/scheduler';
import { ProgressPopup } from '../components/ProgressPopup';

// Period config for Zulu operational time
const PERIOD_CONFIG: Record<string, { start: string, end: string }> = {
  'P1': { start: '07:30', end: '08:30' },
  'P2': { start: '08:30', end: '09:30' },
  'P3': { start: '09:30', end: '10:30' },
  'B1': { start: '10:30', end: '11:00' },
  'P4': { start: '11:00', end: '12:00' },
  'P5': { start: '12:00', end: '13:00' },
  'P6': { start: '13:00', end: '14:00' },
  'B2': { start: '14:00', end: '14:30' },
  'A1': { start: '14:30', end: '15:30' },
  'A2': { start: '15:30', end: '16:30' },
  'A3': { start: '16:30', end: '17:30' },
};

const GRADE_THEMES: Record<string, { bg: string, text: string, shadow: string }> = {
  '12': { bg: 'bg-pink-600', text: 'text-white', shadow: 'shadow-pink-500/20' },
  '11': { bg: 'bg-orange-500', text: 'text-white', shadow: 'shadow-orange-500/20' },
  '10': { bg: 'bg-sky-500', text: 'text-white', shadow: 'shadow-sky-500/20' },
  '9': { bg: 'bg-lime-500', text: 'text-white', shadow: 'shadow-lime-500/20' },
  '8': { bg: 'bg-yellow-400', text: 'text-slate-900', shadow: 'shadow-yellow-500/20' },
};

export function AdminDashboard() {
  const [duties, setDuties] = useState<any[]>([]);
  const [stats, setStats] = useState({
    staffCount: 0,
    venueCount: 0,
    activeSessions: 0,
    pendingSwaps: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState('P2'); // Default to P2 as per high-fidelity version
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMessages, setProgressMessages] = useState<string[]>([]);
  const [isOptimisationComplete, setIsOptimisationComplete] = useState(false);
  const [showOpsModal, setShowOpsModal] = useState(false);
  const [showSchedulerModal, setShowSchedulerModal] = useState(false);
  const [showConflictsModal, setShowConflictsModal] = useState(false);
  const [activeDutyForSwap, setActiveDutyForSwap] = useState<any>(null);
  const [swappingAssignmentIndex, setSwappingAssignmentIndex] = useState<number | null>(null);
  const [allStaffList, setAllStaffList] = useState<any[]>([]);
  const [selectedReplacementId, setSelectedReplacementId] = useState<string | null>(null);
  const [recentAudit, setRecentAudit] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState('00:00:00');
  const [leaveRequests, setLeaveRequests] = useState([
    { id: '1', teacher: 'Franz Nortjé', date: '2026-05-20', fullDay: true, startTime: '--:--', endTime: '--:--', reason: 'Medical Appointment', status: 'Pending' },
    { id: '2', teacher: 'Sarah Jenkins', date: '2026-05-21', fullDay: false, startTime: '08:00', endTime: '11:30', reason: 'Doctor Consult', status: 'Accepted' },
    { id: '3', teacher: 'Brown E.', date: '2026-05-22', fullDay: true, startTime: '--:--', endTime: '--:--', reason: 'Personal Leave', status: 'Pending' },
    { id: '4', teacher: 'Lubbe M.', date: '2026-05-18', fullDay: true, startTime: '--:--', endTime: '--:--', reason: 'Training', status: 'Denied' },
    { id: '5', teacher: 'Amop Teacher', date: '2026-05-25', fullDay: false, startTime: '12:00', endTime: '14:30', reason: 'Workshop', status: 'Pending' }
  ]);

  const [scheduleOptions, setScheduleOptions] = useState({
     startDate: new Date().toISOString().split('T')[0],
     endDate: new Date().toISOString().split('T')[0],
     respectHomeroom: true,
     techPriority: true
  });

  const mockConflicts = [
    { date: '20 May', staffCode: 'AMOP', description: 'is on leave (full day)' },
    { date: '22 May', staffCode: 'LOGF', description: 'is teaching Gr 8/9 (P5)' },
    { date: '24 May', staffCode: 'AYAM', description: 'teaching Economics Gr 12 while invigilating same subject' }
  ];

  useEffect(() => {
    fetchAdminData(true);
  }, []);

  useEffect(() => {
    fetchAdminData(false);
  }, [selectedDate, selectedPeriod]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const config = PERIOD_CONFIG[selectedPeriod];
      if (config) {
        const [endH, endM] = config.end.split(':').map(Number);
        const target = new Date();
        target.setHours(endH, endM, 0, 0);
        
        const diff = target.getTime() - now.getTime();
        if (diff > 0) {
          const h = Math.floor(diff / 3600000);
          const m = Math.floor((diff % 3600000) / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        } else {
          setTimeLeft('00:00:00');
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [selectedPeriod]);

  const fetchAdminData = async (initial = false) => {
    try {
      if (initial) setIsLoading(true);
      else setIsUpdating(true);

      const isDemo = localStorage.getItem('dutyguard_demo_session');
      if (isDemo) {
        let teachers = [];
        try {
          teachers = JSON.parse(localStorage.getItem('dutyguard_demo_teachers') || '[]');
        } catch (e) { console.error("Parse teachers failed", e); }
        
        let venues = [];
        try {
          venues = JSON.parse(localStorage.getItem('dutyguard_demo_venues') || '[]');
        } catch (e) { console.error("Parse venues failed", e); }
        
        // Fallback for demo if data is missing
        if (teachers.length === 0) {
          teachers = [
            { id: '1', code: 'JOHD', full_name: 'John Doe', teacher_type: 'Marathon' },
            { id: '2', code: 'FRAN', full_name: 'Fran Smith', teacher_type: 'Scattered' },
            { id: '3', code: 'AMOP', full_name: 'Amos Opel', teacher_type: 'Marathon' },
            { id: '4', code: 'LOGF', full_name: 'Logan Ford', teacher_type: 'Scattered' },
            { id: '5', code: 'AYAM', full_name: 'Aya Mills', teacher_type: 'Marathon' },
            { id: '6', code: 'SARH', full_name: 'Sarah Hill', teacher_type: 'Scattered' },
            { id: '7', code: 'MICK', full_name: 'Mick Key', teacher_type: 'Marathon' },
            { id: '8', code: 'BENJ', full_name: 'Ben Jonson', teacher_type: 'Scattered' },
            { id: '9', code: 'CASE', full_name: 'Casey Case', teacher_type: 'Marathon' },
            { id: '10', code: 'DANN', full_name: 'Danny Name', teacher_type: 'Scattered' },
            { id: '11', code: 'ELIZ', full_name: 'Elizabeth Z', teacher_type: 'Marathon' },
            { id: '12', code: 'FRED', full_name: 'Fred Red', teacher_type: 'Scattered' },
            { id: '13', code: 'GEOR', full_name: 'George Green', teacher_type: 'Marathon' },
            { id: '14', code: 'HOLL', full_name: 'Holly Wood', teacher_type: 'Scattered' },
            { id: '15', code: 'IVAN', full_name: 'Ivan Terrible', teacher_type: 'Marathon' },
            { id: '16', code: 'JACK', full_name: 'Jack Black', teacher_type: 'Scattered' },
            { id: '17', code: 'KELL', full_name: 'Kelly Blue', teacher_type: 'Marathon' },
            { id: '18', code: 'LIAM', full_name: 'Liam Neeson', teacher_type: 'Scattered' },
            { id: '19', code: 'MONA', full_name: 'Mona Lisa', teacher_type: 'Marathon' },
            { id: '20', code: 'NICK', full_name: 'Nick Fury', teacher_type: 'Scattered' },
            { id: '21', code: 'OPRA', full_name: 'Oprah W', teacher_type: 'Marathon' },
            { id: '22', code: 'PAUL', full_name: 'Paul Rudd', teacher_type: 'Scattered' },
            { id: '23', code: 'QUIN', full_name: 'Quinton T', teacher_type: 'Marathon' },
            { id: '24', code: 'ROSE', full_name: 'Rose Tyler', teacher_type: 'Scattered' },
            { id: '25', code: 'SAMU', full_name: 'Samuel L', teacher_type: 'Marathon' },
            { id: '26', code: 'TINA', full_name: 'Tina Fey', teacher_type: 'Scattered' },
            { id: '27', code: 'URSU', full_name: 'Ursula K', teacher_type: 'Marathon' },
            { id: '28', code: 'VICT', full_name: 'Victor Doom', teacher_type: 'Scattered' },
            { id: '29', code: 'WILL', full_name: 'Will Smith', teacher_type: 'Marathon' },
            { id: '30', code: 'XAVI', full_name: 'Xavier X', teacher_type: 'Scattered' },
          ];
          localStorage.setItem('dutyguard_demo_teachers', JSON.stringify(teachers));
        }
        
        if (venues.length === 0) {
          venues = [
            { id: 'v1', name: 'Great Hall', type: 'Hall', capacity: 300 },
            { id: 'v2', name: 'CAT_LAB 1', type: 'Lab', capacity: 26 },
            { id: 'v3', name: 'IT_LAB 1', type: 'Lab', capacity: 26 },
            { id: 'v4', name: 'LS_LAB 1', type: 'Lab', capacity: 30 },
            { id: 'v5', name: 'Classroom 101', type: 'Class', capacity: 25 },
            { id: 'v6', name: 'Classroom 102', type: 'Class', capacity: 25 },
            { id: 'v7', name: 'Classroom 103', type: 'Class', capacity: 25 },
            { id: 'v8', name: 'Classroom 104', type: 'Class', capacity: 25 },
            { id: 'v9', name: 'Classroom 105', type: 'Class', capacity: 25 },
            { id: 'v10', name: 'Classroom 106', type: 'Class', capacity: 25 },
            { id: 'v11', name: 'Classroom 107', type: 'Class', capacity: 25 },
            { id: 'v12', name: 'Classroom 108', type: 'Class', capacity: 25 },
          ];
          localStorage.setItem('dutyguard_demo_venues', JSON.stringify(venues));
        }

        let storedDuties = [];
        try {
          storedDuties = JSON.parse(localStorage.getItem('dutyguard_demo_generated_duties') || '[]');
        } catch (e) { storedDuties = []; }
        
        let logs = [];
        try {
          logs = JSON.parse(localStorage.getItem('dutyguard_demo_audit_logs') || '[]');
        } catch (e) { logs = []; }

        // Generate rich mock data for exactly 5 grades
        if (storedDuties.length === 0 || initial) {
          const mockSubjects = [
            { name: 'Mathematics', canBePrac: false },
            { name: 'English FAL', canBePrac: false },
            { name: 'Physical Sciences', canBePrac: true },
            { name: 'History', canBePrac: false },
            { name: 'Accounting', canBePrac: false },
            { name: 'CAT', canBePrac: true },
            { name: 'Life Sciences', canBePrac: true },
            { name: 'Afrikaans EAT', canBePrac: false },
            { name: 'Physical Education', canBePrac: true }
          ];
          const grades = ['12', '11', '10', '9', '8'];
          
          let shuffledTeachers = [...teachers].sort(() => 0.5 - Math.random());
          let teacherPtr = 0;

          storedDuties = grades.flatMap(grade => {
            const subjectObj = mockSubjects[Math.floor(Math.random() * mockSubjects.length)];
            const isPrac = subjectObj.canBePrac && (subjectObj.name === 'CAT' || subjectObj.name === 'Life Sciences' || Math.random() > 0.5);
            const paperType = isPrac ? 'Prac' : Math.random() > 0.5 ? 'P1' : 'P2';
            const subject = subjectObj.name;
            
            let totalLearners = grade === '12' ? 120 + Math.floor(Math.random() * 60) : 60 + Math.floor(Math.random() * 60);

            if (grade === '12' && !isPrac) {
              const teacherCount = Math.ceil(totalLearners / 30);
              const hallVenue = venues.find((v: any) => v.type === 'Hall') || venues[0];
              
              const assignedTeachers = [];
              for (let i = 0; i < teacherCount; i++) {
                const t = shuffledTeachers[teacherPtr % shuffledTeachers.length];
                teacherPtr++;
                assignedTeachers.push({
                  id: t.id,
                  code: t.code,
                  name: t.full_name,
                  teacher_type: t.teacher_type,
                  role: i === teacherCount - 1 ? 'standby' : 'invigilator'
                });
              }

              return [{
                id: `demo-${grade}-${selectedDate}-${selectedPeriod}`,
                date: selectedDate,
                period: selectedPeriod,
                grade,
                subject,
                paper_type: paperType,
                learners_count: totalLearners,
                session: PERIOD_CONFIG[selectedPeriod].start,
                duration_minutes: 120,
                venues: hallVenue,
                assignments: assignedTeachers
              }];
            } else {
              const capacity = isPrac ? 26 : 25;
              const venueCount = Math.min(Math.ceil(totalLearners / capacity), 5); 

              const venueSegments = Array.from({ length: venueCount }).map((_, i) => {
                const venueType = isPrac ? 'Lab' : 'Class';
                const venue = venues.find((v: any) => v.type === venueType && v.capacity >= capacity && !storedDuties.some((sd:any) => sd.venues?.id === v.id)) || venues[i + 4] || venues[0];
                const t = shuffledTeachers[teacherPtr % shuffledTeachers.length];
                teacherPtr++;
                
                if (!t) return null;

                const assignments = [{
                  id: t.id,
                  code: t.code,
                  name: t.full_name,
                  teacher_type: t.teacher_type,
                  role: 'invigilator'
                }];

                return {
                  id: `demo-${grade}-${i}-${selectedDate}-${selectedPeriod}`,
                  date: selectedDate,
                  period: selectedPeriod,
                  grade,
                  subject,
                  paper_type: paperType,
                  learners_count: Math.min(capacity, totalLearners - (i * capacity)),
                  session: PERIOD_CONFIG[selectedPeriod].start,
                  duration_minutes: 90,
                  venues: venue,
                  assignments: assignments,
                  tech_support: isPrac && i === 0 ? [
                    shuffledTeachers[teacherPtr % shuffledTeachers.length],
                    shuffledTeachers[(teacherPtr + 1) % shuffledTeachers.length]
                  ].map(tt => {
                    teacherPtr++;
                    return { id: tt.id, code: tt.code, name: tt.full_name, role: 'tech', teacher_type: tt.teacher_type };
                  }) : []
                };
              });

              const sbTeacher = shuffledTeachers[teacherPtr % shuffledTeachers.length];
              teacherPtr++;
              if (sbTeacher && venueSegments.length > 0) {
                const firstSeg = venueSegments.find(s => s !== null);
                if (firstSeg) {
                  firstSeg.assignments.push({ id: sbTeacher.id, code: sbTeacher.code, name: sbTeacher.full_name, teacher_type: sbTeacher.teacher_type, role: 'standby' });
                }
              }

              return venueSegments.filter(Boolean);
            }
          });
          localStorage.setItem('dutyguard_demo_generated_duties', JSON.stringify(storedDuties.filter(Boolean)));
        }

        setAllStaffList(teachers);
        setDuties(storedDuties);
        setRecentAudit(logs.slice(0, 5));
        setStats({
          staffCount: teachers.length,
          venueCount: venues.length,
          activeSessions: 5,
          pendingSwaps: 7
        });
      }
    } catch (err) {
      console.error('Error in fetchAdminData:', err);
    } finally {
      if (initial) setIsLoading(false);
      else setIsUpdating(false);
    }
  };

  const handleRunGenerator = async () => {
    setIsGenerating(true);
    setIsOptimisationComplete(false);
    setProgressMessages(['Initializing Optimization Engine...']);

    try {
      const isDateRange = scheduleOptions.startDate !== scheduleOptions.endDate;
      
      const response = await SchedulerService.runOptimisation({
        startDate: scheduleOptions.startDate,
        endDate: scheduleOptions.endDate,
        sessionType: isDateRange ? 'DateRange' : 'FullDay',
        autoApplyRebalancing: true,
        balanceThreshold: 70,
        onProgress: (message) => {
          console.log('[Scheduler Progress]:', message);
          setProgressMessages(prev => [...prev, message]);
        }
      });

      console.log('Optimisation Response:', response);
      setProgressMessages(prev => [...prev, 'Deployment Matrix Optimized Successfully.']);
      setIsOptimisationComplete(true);
      (window as any).toast?.('Optimization Engine Matrix Complete', 'success');
      
      fetchAdminData();
    } catch (err: any) {
      console.error('Optimisation failed:', err);
      setProgressMessages(prev => [...prev, `ERROR: ${err.message || 'Unknown error occurred'}`]);
      (window as any).toast?.(`Optimization Failed: ${err.message}`, 'error');
    }
  };

  const setPredefinedRange = (type: 'Single' | 'Week' | 'Period') => {
    const today = new Date();
    const start = new Date(selectedDate);
    
    if (type === 'Single') {
      setScheduleOptions({
        ...scheduleOptions,
        startDate: selectedDate,
        endDate: selectedDate
      });
    } else if (type === 'Week') {
      // Find Monday of the week of 'start'
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(start.setDate(diff));
      const friday = new Date(monday);
      friday.setDate(monday.getDate() + 4);
      
      setScheduleOptions({
        ...scheduleOptions,
        startDate: monday.toISOString().split('T')[0],
        endDate: friday.toISOString().split('T')[0]
      });
    } else if (type === 'Period') {
      // Full Exam Period (Example: today to 3 weeks later)
      const endDate = new Date(start);
      endDate.setDate(start.getDate() + 21);
      setScheduleOptions({
        ...scheduleOptions,
        startDate: selectedDate,
        endDate: endDate.toISOString().split('T')[0]
      });
    }
  };

  const calculateEndTime = (startTime: string, durationMinutes: number) => {
    if (!startTime) return '--:--';
    const [hours, minutes] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes + durationMinutes);
    return date.toTimeString().slice(0, 5);
  };

// Tactical Banner Helpers
  const getPeriodTimeRange = (period: string) => {
    const config = PERIOD_CONFIG[period];
    return config ? `${config.start} - ${config.end}` : '--:-- - --:--';
  };

  const getOperationalStatus = (teacherId: string) => {
    const existingDuty = duties.find(d => 
      d.date === selectedDate && 
      d.period === selectedPeriod && 
      d.assignments?.some((a: any) => a?.id === teacherId)
    );
    if (!existingDuty) return null;
    return `Assigned: Gr ${existingDuty.grade} ${existingDuty.subject} @ ${existingDuty.venues?.name || 'Hall'}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="h-16 w-16 border-4 border-indigo-600 border-t-transparent rounded-full mb-6"
        />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-4">Initializing Command Center...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight italic uppercase">SYSTEM CONTROL</h2>
          <p className="text-slate-500 font-medium text-sm mt-1 uppercase tracking-widest text-[10px]">Operations / Deployment Matrix / Ver 5.0.0</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link to="/admin/teachers" className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" /> Personnel
          </Link>
          <Link to="/admin/venues" className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
            <Warehouse className="h-4 w-4 text-emerald-600" /> Venues Matrix
          </Link>
          <Link to="/admin/full-schedule" className="px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
            <Calendar className="h-4 w-4 text-indigo-600" /> Full Schedule Manual Editing
          </Link>
          <div className="w-px h-8 bg-slate-200 mx-2 hidden sm:block" />
          <button onClick={() => setShowSchedulerModal(true)} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> Optimization Engine
          </button>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group">
         <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-6">
               <div className="p-4 bg-red-50 rounded-2xl">
                  <AlertCircle className="h-8 w-8 text-red-600" />
               </div>
               <div>
                  <h3 className="text-2xl font-black text-slate-900 italic uppercase">Conflicts Detected</h3>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-1">Operational Integrity Review Required</p>
               </div>
            </div>
            <div className="text-right">
               <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Incidents</p>
               <p className="text-4xl font-black text-red-600 italic">07</p>
            </div>
         </div>
         
         <div className="bg-slate-50/50 rounded-[2rem] border border-slate-100/50 p-8 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <div className="space-y-4">
               {[
                 "20 May - (AMOP) is on leave. (full day)",
                 "22 May - (LOGF) is teaching 8 or 9 and is used. (P5)",
                 "24 May - (AYAM) teach [Economics] grade 12 and invigilating her own subject.",
                 "26 May - Marathon teacher (LOGF) is not assigned sequentially.",
                 "26 May - Marathon teacher (LOGF) is not assigned at same venue.",
                 "29 May - (EZRN) doing Tech duty and other duty on the same day.",
                 "15 Jun - Scattered teacher(FRAN) assigned sequentially. (p2,p3)"
               ].map((conflict, i) => (
                 <div key={i} className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <p className="text-xs font-bold text-slate-700 font-mono tracking-tight">{conflict}</p>
                 </div>
               ))}
            </div>
         </div>
         
         <div className="mt-8 flex items-center justify-between">
            <p className="text-base font-black text-slate-900 uppercase italic">
               Status: <span className="text-red-600">Immediate Correction Advised</span>
            </p>
            <p className="text-base font-black text-slate-900 uppercase">
               NUMBER OF CONFLICTS: <span className="text-red-600">7</span>
            </p>
         </div>
      </div>

      <div className="w-full space-y-10">
        <div className="bg-white rounded-[4rem] border border-slate-200 shadow-2xl shadow-slate-200/40 overflow-hidden">
            <div className="p-10 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div>
                  <h3 className="text-3xl font-black text-slate-950 tracking-tight italic uppercase">Deployment Matrix</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="px-3 py-1.5 bg-indigo-600 rounded-lg text-[10px] font-black text-white uppercase tracking-[0.2em] shadow-lg shadow-indigo-500/20">OPERATIONAL WINDOW: {getPeriodTimeRange(selectedPeriod)}</div>
                    <div className="px-3 py-1.5 bg-slate-900 rounded-lg text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                       <Clock className="h-4 w-4 text-indigo-400 animate-pulse" /> TACTICAL DELTA: {timeLeft}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex flex-col gap-1.5 min-w-[160px]">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Operation Date</label>
                    <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="h-12 px-5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none shadow-sm focus:border-indigo-500 transition-all" />
                  </div>
                  <div className="flex flex-col gap-1.5 min-w-[140px]">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-2">Tactical Period</label>
                    <div className="relative group">
                       <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} className="w-full h-12 px-5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none shadow-sm appearance-none cursor-pointer group-hover:border-indigo-500 transition-all">
                         {Object.keys(PERIOD_CONFIG).map(p => <option key={p} value={p}>{p}</option>)}
                       </select>
                       <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                          <ChevronRight className="h-4 w-4 text-slate-400 rotate-90" />
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-10 space-y-10 bg-slate-50/20">
              <div className="px-8 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-4">
                 <Shield className="h-5 w-5 text-indigo-600" />
                 <p className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Dynamic Sector Shield Active: Ensuring no overlaps in personnel deployment.</p>
              </div>

              {(() => {
                const dutiesForPeriod = duties.filter(d => (!selectedDate || d.date === selectedDate) && (selectedPeriod === 'ALL' || d.period === selectedPeriod));
                
                if (dutiesForPeriod.length === 0) return (
                  <div className="p-20 bg-white rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                    <Warehouse className="h-12 w-12 text-slate-200 mb-6" />
                    <h4 className="text-xl font-black text-slate-900 italic uppercase">No Tactical Assets Detected</h4>
                    <p className="text-sm text-slate-500 mt-2">Initialize the Auto-Schedule engine or adjust active deployment filters.</p>
                  </div>
                );

                // Group by Grade - Ensure exactly 5 cards
                const grades = ['12', '11', '10', '9', '8'];
                const groupedByGrade = dutiesForPeriod.reduce((acc, d) => {
                  if (!acc[d.grade]) acc[d.grade] = [];
                  acc[d.grade].push(d);
                  return acc;
                }, {} as Record<string, any[]>);

                return grades.map(gradeNum => {
                  const gradeDuties = groupedByGrade[gradeNum];
                  if (!gradeDuties) return null;

                  const first = gradeDuties[0];
                  const subject = first.subject;
                  const paperType = first.paper_type;
                  const theme = GRADE_THEMES[gradeNum] || GRADE_THEMES['8'];
                  const isHall = gradeNum === '12' && paperType !== 'Prac' && first.venues?.type === 'Hall';

                  // Prepare the 8 slots
                  const slots = Array(8).fill(null);
                  
                  if (isHall) {
                    // Slot 1: Large Hall Card (Instead of individual venue cards)
                    slots[0] = { type: 'hall', duty: first };
                  } else {
                    // Slots 1-5: Venues
                    gradeDuties.slice(0, 5).forEach((d, i) => {
                      slots[i] = { type: 'venue', duty: d };
                    });
                  }

                  // Slot 6: Stand-By
                  const standby = gradeDuties.flatMap(d => d.assignments || []).find(a => a.role === 'standby');
                  if (standby) slots[5] = { type: 'standby', staff: standby, duty: first };

                  // Slot 7: Tech Duty
                  if (paperType === 'Prac') {
                    const techSupport = gradeDuties.flatMap(d => d.tech_support || []);
                    if (techSupport.length > 0) slots[6] = { type: 'tech', support: techSupport };
                  }

                  return (
                    <div key={gradeNum} className={cn(
                      "rounded-[4rem] border shadow-2xl overflow-hidden group transition-all",
                      theme.bg, "border-white/10 shadow-indigo-500/10"
                    )}>
                      {/* Grade Card Header */}
                      <div className="p-10 flex flex-col md:flex-row items-center gap-10 justify-between border-b border-black/5 bg-black/5">
                        <div className="flex items-center gap-8">
                          <div className={cn(
                            "h-20 w-20 rounded-[2.5rem] flex flex-col items-center justify-center font-black text-2xl border shadow-2xl rotate-[-2deg] transition-transform group-hover:rotate-0",
                            "bg-white text-slate-900 border-white"
                          )}>
                             <span className="text-[10px] uppercase tracking-widest opacity-60 mb-0.5">GR</span>
                             {gradeNum}
                          </div>
                          <div>
                             <h4 className={cn(
                               "text-4xl font-black italic uppercase tracking-tight leading-none",
                               theme.text
                             )}>{subject}</h4>
                             <div className="flex items-center gap-4 mt-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full bg-white/20 border border-white/20 text-white backdrop-blur-sm">
                                  {paperType === 'Prac' ? 'LAB OPERATIONS' : 'STANDARDIZED ASSESSMENT'} • {paperType}
                                </span>
                                <div className={cn("flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest opacity-80", theme.text)}>
                                   <Users className="h-4 w-4" /> {gradeDuties.reduce((acc, d) => acc + (d.learners_count || 0), 0)} Total Learners
                                </div>
                             </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="flex items-center gap-3 px-8 py-4 rounded-[1.5rem] bg-black/10 border border-white/10 shadow-sm backdrop-blur-md">
                              <History className="h-6 w-6 text-white/60" />
                              <div className="text-left text-white">
                                <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-1 opacity-60">Completion Proxy</p>
                                <span className="text-lg font-black uppercase tracking-tight">
                                  {calculateEndTime(first.session, first.duration_minutes)}
                                </span>
                              </div>
                           </div>
                        </div>
                      </div>

                      {/* 8 Slot Sub-cards Container */}
                      <div className="p-8 space-y-4 bg-white/5">
                        {slots.map((slot, sIdx) => {
                          if (!slot) {
                            const labels = [
                              'Tactical Sector Alpha', 'Tactical Sector Beta', 'Tactical Sector Gamma', 
                              'Tactical Sector Delta', 'Tactical Sector Epsilon', 'Reserve Logistics', 
                              'Sub-Unit Target', 'Tech Platoon 9'
                            ];
                            return (
                              <div key={`empty-${sIdx}`} className="h-16 border border-dashed border-white/10 rounded-2xl flex items-center px-8 opacity-20">
                                <span className="text-[9px] font-black uppercase tracking-widest text-white/50">{labels[sIdx]} - Unassigned Segment</span>
                              </div>
                            );
                          }

                          if (slot.type === 'venue') {
                            const d = slot.duty;
                            return (
                              <div key={`s-${sIdx}`} className="bg-white rounded-[2.5rem] p-6 hover:shadow-xl transition-all group/sub border border-transparent hover:border-white/20">
                                <div className="flex flex-col md:flex-row items-center gap-8">
                                  <div className="flex items-center gap-6 w-full md:w-1/3">
                                    <div className="h-14 w-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                                       <Warehouse className="h-6 w-6 text-slate-400" />
                                    </div>
                                    <div>
                                       <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Station Venue</p>
                                       <h5 className="text-xl font-black text-slate-900 uppercase italic leading-none">{d.venues?.name || 'Sector Venue'}</h5>
                                    </div>
                                  </div>
                                  <div className="flex-1 w-full">
                      {d.assignments?.filter((a: any) => a && a.role !== 'standby').map((ast: any, aIdx: number) => (
                        <div key={aIdx} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between group/person shadow-sm">
                          <div className="flex items-center gap-6">
                            <div className={cn(
                              "h-12 w-12 rounded-xl flex items-center justify-center font-black text-[12px] shadow-sm shrink-0",
                              ast?.teacher_type === 'Marathon' ? 'bg-pink-600 text-white' : ast?.teacher_type === 'Scattered' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'
                            )}>
                              {ast?.code}
                            </div>
                            <div className="min-w-[400px]">
                               <p className="text-xl font-black text-slate-900 uppercase italic tracking-tight leading-none mb-1">{ast?.name}</p>
                               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none">Personnel detail: {ast?.teacher_type}</p>
                            </div>
                          </div>
                          <button onClick={() => { setActiveDutyForSwap(d); setSwappingAssignmentIndex(d.assignments ? d.assignments.indexOf(ast) : 0); setShowOpsModal(true); }} className="h-12 w-12 bg-white text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all shadow-sm">
                             <Zap className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          if (slot.type === 'standby') {
                            const { staff, duty } = slot;
                            return (
                              <div key={`s-${sIdx}`} className="bg-emerald-500 rounded-[2.5rem] p-6 shadow-xl border border-white/20">
                                <div className="flex items-center gap-8">
                                  <div className="flex items-center gap-6 w-full md:w-1/3 text-white">
                                    <div className="h-14 w-14 bg-white/20 border border-white/20 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                                       <Shield className="h-6 w-6" />
                                    </div>
                                    <div>
                                       <p className="text-[9px] font-black uppercase text-emerald-100 tracking-widest mb-1">Reserve Asset</p>
                                       <h5 className="text-xl font-black uppercase italic leading-none">RESERVE UNIT</h5>
                                    </div>
                                  </div>
                                  <div className="flex-1 w-full bg-white p-4 rounded-2xl flex items-center justify-between shadow-inner">
                                    <div className="flex items-center gap-6">
                                      <div className={cn(
                                        "h-12 w-12 rounded-xl flex items-center justify-center font-black text-[12px] shadow-sm shrink-0",
                                        staff.teacher_type === 'Marathon' ? 'bg-pink-600 text-white' : staff.teacher_type === 'Scattered' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-white'
                                      )}>
                                        {staff.code}
                                      </div>
                                      <div className="min-w-[400px]">
                                         <p className="text-xl font-black text-slate-900 uppercase italic tracking-tight leading-none mb-1">{staff.name}</p>
                                         <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 leading-none">ON STAND-BY FOR DEPLOYMENT</p>
                                      </div>
                                    </div>
                                    <button onClick={() => { setActiveDutyForSwap(duty); setSwappingAssignmentIndex(duty.assignments ? duty.assignments.indexOf(staff) : 0); setShowOpsModal(true); }} className="h-12 w-12 bg-white text-slate-400 rounded-xl flex items-center justify-center hover:bg-slate-950 hover:text-white transition-all shadow-sm">
                                       <Zap className="h-5 w-5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          if (slot.type === 'hall') {
                            const d = slot.duty;
                            return (
                              <div key={`s-${sIdx}`} className="bg-slate-950 rounded-[3rem] p-10 border border-slate-800 relative overflow-hidden shadow-2xl">
                                 <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-48 -mt-48 blur-3xl" />
                                 <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8 pb-8 border-b border-white/10">
                                    <div className="relative z-10">
                                       <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400 mb-2">Primary Combat Theater</p>
                                       <h5 className="text-5xl font-black text-white italic uppercase tracking-tighter leading-none">THE GREAT HALL</h5>
                                       <div className="mt-4 flex gap-4">
                                          <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10">
                                             <div className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                             <span className="text-[8px] font-black uppercase text-indigo-200 tracking-widest">High Integrity Shell</span>
                                          </div>
                                       </div>
                                    </div>
                                    <div className="px-10 py-6 bg-white/5 border border-white/10 rounded-[2.5rem] text-center shadow-inner relative z-10">
                                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Asset Allocation</p>
                                       <p className="text-4xl font-black text-indigo-400 leading-none">{d.assignments?.length} <span className="text-[10px] uppercase text-slate-600">Unified Units</span></p>
                                    </div>
                                 </div>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                                    {d.assignments?.map((ast: any, aIdx: number) => (
                                      <div key={aIdx} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between group/hallsub hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-5">
                                          <div className={cn(
                                            "h-12 w-12 rounded-xl flex items-center justify-center font-black text-[12px] shrink-0",
                                            ast.teacher_type === 'Marathon' ? 'bg-pink-600 text-white shadow-[0_0_15px_-3px_#db2777]' : ast.teacher_type === 'Scattered' ? 'bg-blue-600 text-white shadow-[0_0_15px_-3px_#2563eb]' : 'bg-slate-700 text-white'
                                          )}>
                                            {ast.code}
                                          </div>
                                          <div className="max-w-[200px]">
                                             <p className="text-lg font-black text-white uppercase italic tracking-tight leading-none mb-1 truncate">{ast.name}</p>
                                             <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400">{ast.role === 'standby' ? 'RESERVE ASSET' : 'ACTIVE UNIT'}</p>
                                          </div>
                                        </div>
                                        <button onClick={() => { setActiveDutyForSwap(d); setSwappingAssignmentIndex(aIdx); setShowOpsModal(true); }} className="h-12 w-12 bg-white/5 text-white rounded-xl flex items-center justify-center hover:bg-white hover:text-slate-950 transition-all shrink-0">
                                           <Zap className="h-5 w-5" />
                                        </button>
                                      </div>
                                    ))}
                                 </div>
                              </div>
                            );
                          }

                          if (slot.type === 'tech') {
                            return (
                              <div key={`s-${sIdx}`} className="bg-blue-950 rounded-[2.5rem] p-8 border border-white/10 shadow-xl overflow-hidden relative">
                                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-2xl" />
                                 <div className="flex items-center gap-6 mb-8 border-b border-white/5 pb-6 relative z-10">
                                    <Zap className="h-8 w-8 text-blue-400" />
                                    <div>
                                       <h6 className="text-xl font-black text-white italic uppercase tracking-tight leading-none">Technical Support Platoon</h6>
                                       <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest mt-1">Specialized Hardware & Software Custodians</p>
                                    </div>
                                 </div>
                                 <div className="flex flex-wrap gap-4 relative z-10">
                                    {slot.support.map((t: any, tIdx: number) => (
                                      <div key={tIdx} className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-5 group hover:bg-white/10 transition-colors">
                                        <div className="h-10 w-10 bg-blue-600 text-white rounded-lg flex items-center justify-center text-[10px] font-black shadow-lg">{t.code}</div>
                                        <div>
                                          <p className="text-[11px] font-black text-white uppercase tracking-tight">{t.name}</p>
                                          <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Active Liaison</p>
                                        </div>
                                      </div>
                                    ))}
                                 </div>
                              </div>
                            );
                          }

                          return null;
                        })}
                      </div>
                    </div>
                  );
                }).filter(Boolean);
              })()}
            </div>
            
            <div className="p-10 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center gap-2">
               <Shield className="h-4 w-4 text-slate-400" />
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Deployment Sessions Monitored by DutyGuard Core</p>
            </div>
          </div>
        </div>





      <AnimatePresence>
        {isGenerating && (
          <ProgressPopup
             isOpen={isGenerating}
             title="Optimization Engine"
             progress={progressMessages}
             isCompleted={isOptimisationComplete}
             onClose={() => {
               setIsGenerating(false);
               setShowSchedulerModal(false);
             }}
             onCancel={() => {
               // In a real app we might want to signal cancellation to the service
               setIsGenerating(false);
               setShowSchedulerModal(false);
             }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showOpsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl">
             <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="relative w-full max-w-xl bg-white rounded-[4rem] overflow-hidden shadow-2xl">
                <div className="p-10 bg-indigo-600 text-white flex justify-between items-center">
                   <div className="flex items-center gap-6">
                      <Zap className="h-8 w-8 text-indigo-300" />
                      <div>
                         <h4 className="text-2xl font-black tracking-tight italic uppercase">Available Replacement Teachers</h4>
                         <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.3em]">Operational Deployment Matrix</p>
                      </div>
                   </div>
                   <button onClick={() => { setShowOpsModal(false); setSelectedReplacementId(null); }} className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all border border-white/10">
                      <X className="h-6 w-6 text-white" />
                   </button>
                </div>

                <div className="p-10">
                   <div className="mb-8 p-6 bg-slate-50 border border-slate-100 rounded-[2rem]">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Segment</p>
                      <p className="text-lg font-black text-slate-900 uppercase italic">Gr {activeDutyForSwap?.grade} • {activeDutyForSwap?.subject} • {activeDutyForSwap?.venues?.name || 'Great Hall'}</p>
                   </div>

                   <div className="max-h-[400px] overflow-y-auto space-y-3 mb-10 pr-2 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                      {allStaffList.map((teacher) => {
                         const opStatus = getOperationalStatus(teacher.id);
                         const isAssignedElsewhere = !!opStatus;
                         const isSelected = selectedReplacementId === teacher.id;
                         
                         // Custom filter for current assignment
                         const currentAssignment = activeDutyForSwap?.assignments?.[swappingAssignmentIndex ?? 0];
                         const isCurrentlyAssignedHere = currentAssignment?.id === teacher.id;

                         return (
                            <button 
                              key={teacher.id} 
                              disabled={isAssignedElsewhere && !isCurrentlyAssignedHere}
                              onClick={() => setSelectedReplacementId(teacher.id)}
                              className={cn(
                                "w-full p-6 rounded-[2rem] border transition-all flex items-center justify-between text-left group relative overflow-hidden",
                                isSelected ? "bg-indigo-600 border-indigo-700 text-white shadow-xl shadow-indigo-500/30" : 
                                isAssignedElsewhere && !isCurrentlyAssignedHere ? "bg-slate-50 border-slate-200 opacity-50 grayscale cursor-not-allowed" :
                                "bg-white border-slate-100 hover:border-indigo-100"
                              )}
                            >
                               {!isAssignedElsewhere && !isSelected && (
                                 <div className="absolute top-0 right-0 px-4 py-1 bg-blue-600 text-[8px] font-black text-white uppercase tracking-widest rounded-bl-xl rotate-0">Free Period Catalyst</div>
                               )}
                               {isCurrentlyAssignedHere && !isSelected && (
                                 <div className="absolute top-0 right-0 px-4 py-1 bg-emerald-600 text-[8px] font-black text-white uppercase tracking-widest rounded-bl-xl">Current Asset</div>
                               )}

                               <div className="flex items-center gap-5 flex-1">
                                  <div className={cn(
                                     "h-14 w-14 rounded-2xl flex items-center justify-center font-black text-[12px] shadow-sm shrink-0",
                                     isSelected ? "bg-white text-indigo-600" : "bg-slate-900 text-white"
                                  )}>{teacher.code}</div>
                                  <div className="flex-1">
                                     <p className="text-lg font-black uppercase tracking-tight italic leading-none mb-2">{teacher.full_name}</p>
                                     <div className="flex flex-col gap-1">
                                        <p className={cn("text-[10px] font-black uppercase tracking-widest", isSelected ? "text-indigo-100" : "text-slate-400")}>Specialization: {teacher.teacher_type}</p>
                                        {isAssignedElsewhere && !isCurrentlyAssignedHere && (
                                          <div className={cn(
                                            "flex items-center gap-2 px-2 py-0.5 rounded-lg w-fit",
                                            isSelected ? "bg-white/10 text-white" : "bg-amber-50 text-amber-600"
                                          )}>
                                            <Shield className="h-3 w-3" />
                                            <p className="text-[9px] font-black uppercase tracking-widest">
                                              {opStatus}
                                            </p>
                                          </div>
                                        )}
                                     </div>
                                  </div>
                               </div>
                               {isSelected ? <CheckCircle2 className="h-6 w-6 text-white" /> : isAssignedElsewhere && !isCurrentlyAssignedHere ? <Shield className="h-5 w-5 text-slate-300" /> : <div className="h-6 w-6 rounded-full border-2 border-slate-100 group-hover:border-indigo-200 transition-all" />}
                            </button>
                         );
                      })}
                   </div>

                   <div className="flex gap-4">
                      <button onClick={() => { setShowOpsModal(false); setSelectedReplacementId(null); }} className="flex-1 py-6 bg-slate-50 text-slate-500 rounded-[2rem] font-black uppercase text-[11px] tracking-widest border border-slate-100 hover:bg-slate-100 transition-all">Cancel</button>
                      <button 
                        disabled={!selectedReplacementId}
                        onClick={() => {
                          const teacher = allStaffList.find(t => t?.id === selectedReplacementId);
                          if (teacher && activeDutyForSwap) {
                             const updated = duties.map(d => {
                               if (d.id === activeDutyForSwap.id) {
                                  const na = [...(d.assignments || [])];
                                  na[swappingAssignmentIndex ?? 0] = { ...na[swappingAssignmentIndex ?? 0], id: teacher.id, code: teacher.code, name: teacher.full_name, teacher_type: teacher.teacher_type };
                                  return { ...d, assignments: na };
                               }
                               return d;
                             });
                             setDuties(updated);
                             localStorage.setItem('dutyguard_demo_generated_duties', JSON.stringify(updated));
                             (window as any).toast?.(`Unit ${teacher.code} Deployed Successfully`, 'success');
                             setShowOpsModal(false);
                             setSelectedReplacementId(null);
                          }
                        }}
                        className={cn(
                          "flex-[2] py-6 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.2em] transition-all shadow-2xl",
                          selectedReplacementId ? "bg-slate-950 text-white hover:bg-indigo-600 shadow-indigo-900/20" : "bg-slate-100 text-slate-300 cursor-not-allowed"
                        )}
                      >
                         Assign Unit to Segment
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConflictsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl">
             <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="relative w-full max-w-2xl bg-white rounded-[4rem] overflow-hidden shadow-2xl">
                <div className="p-12 bg-red-600 text-white flex justify-between items-center">
                   <div className="flex items-center gap-8">
                      <AlertCircle className="h-10 w-10 text-white" />
                      <div>
                         <h4 className="text-3xl font-black italic uppercase">System Conflicts</h4>
                         <p className="text-[10px] font-black text-red-200 uppercase tracking-widest">Immediate Resolution Required</p>
                      </div>
                   </div>
                   <button onClick={() => setShowConflictsModal(false)} className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all border border-white/10">
                      <X className="h-8 w-8 text-white" />
                   </button>
                </div>
                <div className="p-12 space-y-6">
                   {mockConflicts.map((c, i) => (
                     <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex items-center gap-6 group hover:border-red-200 transition-all">
                        <div className="h-12 w-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-red-500 font-black shadow-sm group-hover:scale-110 transition-transform">!</div>
                        <div>
                           <p className="text-sm font-black uppercase text-slate-900 tracking-tight leading-none mb-1.5">({c.staffCode}) {c.description}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.date} 2024</p>
                        </div>
                     </div>
                   ))}
                   <div className="mt-10 pt-10 border-t border-slate-100 flex items-center justify-between">
                      <p className="text-xl font-black text-slate-900 italic uppercase">
                        Active Conflicts: <span className="text-red-600">{mockConflicts.length}</span>
                      </p>
                      <button onClick={() => setShowConflictsModal(false)} className="px-10 py-5 bg-slate-950 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest hover:bg-red-600 transition-all">Dismiss Reports</button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSchedulerModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="relative w-full max-w-2xl bg-white rounded-[4rem] overflow-hidden shadow-2xl">
              <div className="p-12 bg-indigo-600 text-white flex justify-between items-center">
                 <div className="flex items-center gap-8">
                    <Sparkles className="h-10 w-10 text-white" />
                    <div>
                       <h4 className="text-3xl font-black italic uppercase">Optimization Engine</h4>
                       <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest">Tactical Parameter Configuration</p>
                    </div>
                 </div>
                 <button onClick={() => setShowSchedulerModal(false)} className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center whitespace-nowrap">
                    <X className="h-8 w-8 text-white" />
                 </button>
              </div>
              <div className="p-12 space-y-10 border-b border-slate-100">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Tactical Presets</label>
                    <div className="grid grid-cols-3 gap-3">
                       <button 
                         onClick={() => setPredefinedRange('Single')}
                         className={cn(
                           "py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all",
                           scheduleOptions.startDate === scheduleOptions.endDate ? "bg-indigo-600 text-white border-indigo-700 shadow-lg" : "bg-white text-slate-600 border-slate-100 hover:border-indigo-100"
                         )}
                       >
                         Single Day
                       </button>
                       <button 
                         onClick={() => setPredefinedRange('Week')}
                         className="py-3 bg-white text-slate-600 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-100 transition-all"
                       >
                         This Week
                       </button>
                       <button 
                         onClick={() => setPredefinedRange('Period')}
                         className="py-3 bg-white text-slate-600 border border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-100 transition-all"
                       >
                         Full Period
                       </button>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Start Optimization</label>
                       <input type="date" value={scheduleOptions.startDate} onChange={e => setScheduleOptions({...scheduleOptions, startDate: e.target.value})} className="w-full h-16 px-8 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none font-bold text-xs" />
                    </div>
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">End Optimization</label>
                       <input type="date" value={scheduleOptions.endDate} onChange={e => setScheduleOptions({...scheduleOptions, endDate: e.target.value})} className="w-full h-16 px-8 bg-slate-50 border border-slate-100 rounded-[2rem] outline-none font-bold text-xs" />
                    </div>
                 </div>
              </div>
              <div className="p-12 pt-8 flex gap-4">
                 <button onClick={() => setShowSchedulerModal(false)} className="flex-1 py-6 bg-slate-50 text-slate-400 rounded-[2rem] font-black uppercase text-[11px] tracking-widest border border-slate-100 hover:bg-slate-100 transition-all">Abort Execution</button>
                 <button onClick={handleRunGenerator} disabled={isGenerating} className="flex-[2] py-6 bg-slate-950 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-indigo-950/20">
                    {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
                    Initialize Generation
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Scheduled Leave Requests Table */}
      <div className="bg-white rounded-[4rem] border border-slate-200 shadow-2xl shadow-slate-200/40 overflow-hidden">
        <div className="p-10 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div>
            <h3 className="text-3xl font-black text-slate-950 tracking-tight italic uppercase">Scheduled Leave Requests</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Personnel Absence Log & Approval Matrix</p>
          </div>
          <div className="h-14 w-14 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 shadow-sm">
            <CalendarX className="h-7 w-7" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 italic">
                <th className="px-10 py-6">Teacher</th>
                <th className="px-6 py-6">Date</th>
                <th className="px-6 py-6 text-center">Full Day</th>
                <th className="px-6 py-6 font-mono">Start</th>
                <th className="px-6 py-6 font-mono">End</th>
                <th className="px-6 py-6">Reason</th>
                <th className="px-6 py-6">Status</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(() => {
                return [...leaveRequests].sort((a, b) => {
                  // Pending at top
                  if (a.status === 'Pending' && b.status !== 'Pending') return -1;
                  if (a.status !== 'Pending' && b.status === 'Pending') return 1;
                  
                  // Alphabetical by teacher (simplified surname sort)
                  const nameA = a.teacher.split(' ').reverse().join(' ');
                  const nameB = b.teacher.split(' ').reverse().join(' ');
                  return nameA.localeCompare(nameB);
                }).map((req) => (
                  <tr key={req.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-10 py-6 font-black text-slate-900 uppercase italic tracking-tight">{req.teacher}</td>
                    <td className="px-6 py-6 font-bold text-slate-500 whitespace-nowrap">{new Date(req.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                    <td className="px-6 py-6 text-center">
                      <span className={cn(
                        "inline-flex h-2 w-2 rounded-full",
                        req.fullDay ? "bg-indigo-500 shadow-[0_0_8px_#6366f1]" : "bg-slate-200"
                      )} />
                    </td>
                    <td className="px-6 py-6 font-mono text-xs text-slate-400">{req.startTime}</td>
                    <td className="px-6 py-6 font-mono text-xs text-slate-400">{req.endTime}</td>
                    <td className="px-6 py-6">
                      <p className="text-xs font-bold text-slate-600 line-clamp-1 max-w-[200px]">{req.reason}</p>
                    </td>
                    <td className="px-6 py-6">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border",
                        req.status === 'Pending' ? "bg-amber-50 text-amber-600 border-amber-200" :
                        req.status === 'Accepted' ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                        "bg-red-50 text-red-600 border-red-200"
                      )}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-10 py-6 text-right">
                      {req.status === 'Pending' ? (
                        <div className="flex items-center justify-end gap-2">
                           <button 
                             onClick={() => setLeaveRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'Accepted' } : r))}
                             className="h-10 px-4 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                           >
                             Approve
                           </button>
                           <button 
                             onClick={() => setLeaveRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'Denied' } : r))}
                             className="h-10 px-4 bg-red-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-500/20 active:scale-95"
                           >
                             Deny
                           </button>
                        </div>
                      ) : (
                        <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Archived</div>
                      )}
                    </td>
                  </tr>
                ));
              })()}
            </tbody>
          </table>
        </div>
        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex justify-center">
           <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest italic">System maintains 90-day retention on historical leave data</p>
        </div>
      </div>

      {/* Analytics Form Section */}
      <div className="pt-20 border-t border-slate-100">
        <div className="flex items-center gap-6 mb-12">
           <div className="h-20 w-20 bg-slate-950 rounded-[2.5rem] flex items-center justify-center shadow-2xl">
              <Sparkles className="h-10 w-10 text-indigo-400" />
           </div>
           <div>
              <h2 className="text-4xl font-black text-slate-900 italic uppercase tracking-tight">Analytics Form</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-1">Cross-Sector Data Verification & Historical Audit</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-6">Efficiency Coefficient</p>
              <div className="flex items-end gap-3 mb-2">
                 <p className="text-5xl font-black text-slate-900 italic">94.8%</p>
                 <div className="h-6 px-2 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg flex items-center mb-2">+2.4%</div>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mt-4">
                 <div className="h-full bg-indigo-600 rounded-full" style={{ width: '94.8%' }} />
              </div>
           </div>
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-6">Staff SAT Score</p>
              <div className="flex items-end gap-3 mb-2">
                 <p className="text-5xl font-black text-slate-900 italic">4.9</p>
                 <p className="text-sm font-black text-slate-400 mb-2 uppercase tracking-widest">/ 5.0</p>
              </div>
              <div className="flex gap-1.5 mt-4">
                 {[1,2,3,4,5].map(i => <div key={i} className="h-2 flex-1 bg-amber-400 rounded-full" />)}
              </div>
           </div>
           <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-6">Deployment Velocity</p>
              <div className="flex items-end gap-3 mb-2">
                 <p className="text-5xl font-black text-slate-900 italic">1.2s</p>
                 <p className="text-sm font-black text-slate-400 mb-2 uppercase tracking-widest">Latency</p>
              </div>
              <div className="flex items-center gap-2 mt-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                 <Zap className="h-3 w-3" /> Real-time Sync Active
              </div>
           </div>
        </div>

        {/* Audit Trail Moved Here */}
        <div className="bg-slate-950 rounded-[4rem] p-16 text-white shadow-2xl border border-slate-800">
           <div className="flex items-center justify-between mb-16">
              <div className="flex items-center gap-6">
                 <div className="h-16 w-16 bg-white/10 rounded-3xl flex items-center justify-center">
                    <History className="h-8 w-8 text-indigo-400" />
                 </div>
                 <div>
                    <h3 className="text-3xl font-black italic tracking-tight uppercase">System Audit Trail</h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1">Full Transaction History Matrix</p>
                 </div>
              </div>
              <button className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3">
                 <Download className="h-4 w-4" /> Export Protocol Logs
              </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              {recentAudit.map((log, i) => (
                <div key={log.id} className="relative pl-10 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-white/10">
                   <div className="absolute left-[-4px] top-1.5 h-2 w-2 rounded-full bg-indigo-500 shadow-[0_0_15px_#6366f1]" />
                   <div className="space-y-3">
                      <p className="text-sm font-black text-white leading-tight uppercase italic tracking-tight">{log.action}</p>
                      <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{log.description}</p>
                      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/5">
                         <div className="px-3 py-1 bg-indigo-500/10 rounded-lg text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                            {new Date(log.changed_at).toLocaleTimeString()}
                         </div>
                         <div className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">
                            SYS-LOG-{log.id.slice(0,4)}
                         </div>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
