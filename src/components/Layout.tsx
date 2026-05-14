import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogOut, Bell, Shield, User, Menu, X, LayoutDashboard, Calendar, Users, MapPin, Search, Settings, ChevronRight, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { UserRoleInfo, getAllStaffRoles, updateUserRole } from '../services/authService';

export function Layout({ session, roleInfo }: { session: any; roleInfo: UserRoleInfo | null }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showAccessControl, setShowAccessControl] = useState(false);
  const [staffList, setStaffList] = useState<UserRoleInfo[]>([]);
  const [searchStaff, setSearchStaff] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<UserRoleInfo | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (roleInfo?.locked) {
      getAllStaffRoles().then(setStaffList);
    }
  }, [roleInfo]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const userEmail = session?.user?.email;
  const currentPath = location.pathname;

  const navItems = [
    { path: '/teacher', label: 'Timeline', icon: Calendar, roles: ['teacher', 'manager', 'admin'] },
    { path: '/manager', label: 'Analytics', icon: LayoutDashboard, roles: ['manager', 'admin'] },
    { path: '/admin', label: 'System', icon: Shield, roles: ['admin'] },
  ].filter(item => !roleInfo || item.roles.includes(roleInfo.ui_role));

  const filteredStaff = staffList.filter(s => 
    s.full_name.toLowerCase().includes(searchStaff.toLowerCase()) ||
    s.staff_code.toLowerCase().includes(searchStaff.toLowerCase())
  );

  const handleRoleUpdate = async (newRole: 'teacher' | 'manager' | 'admin') => {
    if (!selectedStaff) return;
    try {
      setUpdating(true);
      await updateUserRole(selectedStaff.staff_code, newRole);
      (window as any).toast?.(`Updated ${selectedStaff.full_name} to ${newRole}`, 'success');
      // Refresh list
      const updatedList = await getAllStaffRoles();
      setStaffList(updatedList);
      setSelectedStaff(updatedList.find(s => s.staff_code === selectedStaff.staff_code) || null);
    } catch (err) {
      console.error(err);
      (window as any).toast?.('Failed to update access', 'error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Premium Navigation Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 sm:px-8">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 group transition-transform active:scale-95">
              <div className="bg-[#0f172a] p-2.5 rounded-2xl shadow-xl shadow-indigo-900/10 transition-transform group-hover:rotate-6">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter text-[#0f172a] italic leading-none">DutyGuard</span>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-500 opacity-60">Operations</span>
              </div>
            </Link>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden lg:flex items-center ml-10 p-1 bg-slate-100/50 rounded-2xl border border-slate-200/40">
              {navItems.map((item) => (
                <Link 
                  key={item.path}
                  to={item.path} 
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                    currentPath === item.path 
                      ? "bg-white text-[#0f172a] shadow-sm ring-1 ring-slate-200/60" 
                      : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                  )}
                >
                  <item.icon className={cn("h-3.5 w-3.5", currentPath === item.path ? "text-indigo-600" : "text-slate-300")} />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {roleInfo?.locked && (
              <button 
                onClick={() => setShowAccessControl(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all mr-4"
              >
                <Settings className="h-3.5 w-3.5" />
                Access Control
              </button>
            )}

            {/* Global Actions */}
            <div className="hidden sm:flex items-center gap-2 mr-4 pr-6 border-r border-slate-200">
               <button className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-red-500 ring-4 ring-white"></span>
               </button>
            </div>
            
            {/* User Profile Hook */}
            <div className="hidden sm:flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-black tracking-tight text-slate-900 italic">{roleInfo?.full_name || userEmail?.split('@')[0]}</span>
                <div className="flex items-center gap-1.5 opacity-40">
                  <span className="h-1 w-1 rounded-full bg-emerald-500"></span>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{roleInfo?.ui_role || 'Active Duty'}</span>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="h-12 w-12 flex items-center justify-center bg-slate-50 border border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 hover:border-red-100 rounded-2xl transition-all shadow-sm active:scale-95"
                title="Secure Sign Out"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Navigation Trigger */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden h-12 w-12 flex items-center justify-center bg-slate-100 rounded-2xl text-slate-600 hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Access Control Modal */}
      <AnimatePresence>
        {showAccessControl && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAccessControl(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="relative w-full max-w-4xl bg-white rounded-[4rem] overflow-hidden shadow-2xl flex h-[80vh]"
            >
              <div className="w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col">
                <div className="p-8 border-b border-slate-200">
                  <h4 className="text-xl font-black italic uppercase tracking-tight mb-6">Staff Registry</h4>
                  <div className="relative">
                    <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="Search personnel..."
                      value={searchStaff}
                      onChange={e => setSearchStaff(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {filteredStaff.map(s => (
                    <button 
                      key={s.staff_code}
                      onClick={() => setSelectedStaff(s)}
                      className={cn(
                        "w-full flex items-center justify-between p-4 rounded-2xl transition-all text-left",
                        selectedStaff?.staff_code === s.staff_code ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" : "hover:bg-slate-100"
                      )}
                    >
                      <div>
                        <p className="text-xs font-black uppercase tracking-tight">{s.full_name}</p>
                        <p className={cn("text-[9px] font-bold uppercase tracking-widest", selectedStaff?.staff_code === s.staff_code ? "text-indigo-200" : "text-slate-400")}>{s.staff_code}</p>
                      </div>
                      <ChevronRight className={cn("h-4 w-4", selectedStaff?.staff_code === s.staff_code ? "text-white" : "text-slate-300")} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex-1 flex flex-col p-12">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <h4 className="text-3xl font-black italic uppercase tracking-tight">Access Control</h4>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-2">Matrix Modification Protocol</p>
                  </div>
                  <button onClick={() => setShowAccessControl(false)} className="h-12 w-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"><X className="h-6 w-6" /></button>
                </div>

                {selectedStaff ? (
                  <div className="space-y-12">
                    <div className="flex items-center gap-8">
                       <div className="h-24 w-24 bg-indigo-50 rounded-[2.5rem] flex items-center justify-center text-indigo-600 text-3xl font-black italic shadow-inner">
                          {selectedStaff.full_name.split(' ').map(n => n[0]).join('')}
                       </div>
                       <div>
                          <p className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">{selectedStaff.full_name}</p>
                          <p className="text-xs font-black text-indigo-500 uppercase tracking-widest">{selectedStaff.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                             <span className="px-3 py-1 bg-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500">Current Role: {selectedStaff.ui_role}</span>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Elevate / Reassign Deployment Level</p>
                       <div className="grid grid-cols-1 gap-4">
                          {[
                            { id: 'teacher', label: 'Tactical Invigilator', icon: Calendar, desc: 'Individual timeline & classroom requests only.' },
                            { id: 'manager', label: 'Operational Manager', icon: LayoutDashboard, desc: 'Full live feed analytics & tactical relief control.' },
                            { id: 'admin', label: 'Strategic Admin', icon: Shield, desc: 'Complete engine access, rules & staffing matrix.' },
                          ].map(role => (
                            <button 
                              key={role.id}
                              disabled={updating}
                              onClick={() => handleRoleUpdate(role.id as any)}
                              className={cn(
                                "flex items-center justify-between p-6 rounded-[2rem] border transition-all text-left group",
                                selectedStaff.ui_role === role.id ? "bg-emerald-50 border-emerald-100" : "bg-white border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5"
                              )}
                            >
                               <div className="flex items-center gap-6">
                                  <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center transition-colors", selectedStaff.ui_role === role.id ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-400 group-hover:bg-indigo-500 group-hover:text-white")}>
                                     <role.icon className="h-7 w-7" />
                                  </div>
                                  <div>
                                     <p className={cn("text-lg font-black italic uppercase tracking-tight", selectedStaff.ui_role === role.id ? "text-emerald-900" : "text-slate-900")}>{role.label}</p>
                                     <p className="text-[10px] font-medium text-slate-500">{role.desc}</p>
                                  </div>
                               </div>
                               {selectedStaff.ui_role === role.id && (
                                 <div className="h-8 w-8 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                                    <Check className="h-5 w-5" />
                                 </div>
                               )}
                            </button>
                          ))}
                       </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                     <Users className="h-20 w-20 mb-6" />
                     <p className="text-xl font-black italic uppercase tracking-tight">Deployment Not Selected</p>
                     <p className="text-xs font-medium">Please select a staff member from the matrix to modify access.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mobile Drawer Navigation */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsMenuOpen(false)}
               className="fixed inset-0 z-50 bg-[#0f172a]/20 backdrop-blur-md lg:hidden"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-[80%] max-w-sm bg-white shadow-2xl z-[60] lg:hidden flex flex-col p-8"
            >
              <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                   <div className="bg-[#0f172a] p-2 rounded-xl">
                      <Shield className="h-5 w-5 text-white" />
                   </div>
                   <span className="text-xl font-black italic tracking-tighter">DutyGuard</span>
                </div>
                <button onClick={() => setIsMenuOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400"><X className="h-5 w-5" /></button>
              </div>
              
              <div className="space-y-4 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-6 pl-2">Navigation Control</p>
                {navItems.map((item) => (
                  <Link 
                    key={item.path}
                    to={item.path} 
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 p-5 rounded-[2rem] transition-all border",
                      currentPath === item.path 
                        ? "bg-[#0f172a] border-[#0f172a] text-white shadow-2xl shadow-indigo-900/20" 
                        : "bg-slate-50 border-slate-100 text-slate-500 hover:bg-white hover:border-indigo-100"
                    )}
                  >
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-sm", currentPath === item.path ? "bg-white/10" : "bg-white")}>
                       <item.icon className={cn("h-5 w-5", currentPath === item.path ? "text-white" : "text-indigo-600")} />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest">{item.label}</span>
                    {currentPath === item.path && <div className="ml-auto h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></div>}
                  </Link>
                ))}

                {roleInfo?.locked && (
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      setShowAccessControl(true);
                    }}
                    className="w-full flex items-center gap-4 p-5 rounded-[2rem] bg-amber-500/10 border border-amber-500/20 text-amber-600 transition-all"
                  >
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-white shadow-sm">
                       <Settings className="h-5 w-5 text-amber-500" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-widest text-left">Access Control</span>
                  </button>
                )}
              </div>

              <div className="mt-auto space-y-4">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-4 py-6 bg-red-50 text-red-600 rounded-[2.5rem] font-black uppercase tracking-widest text-xs border border-red-100/50 hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-95"
                >
                  <LogOut className="h-5 w-5" />
                  Terminate Session
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Primary Page Content Wrapper */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-12">
        <Outlet />
      </main>
    </div>
  );
}
