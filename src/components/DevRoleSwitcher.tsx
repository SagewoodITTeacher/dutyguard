import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Shield, LayoutDashboard, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function DevRoleSwitcher() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  
  const currentRole = location.pathname.split('/')[1] || 'teacher';

  const roles = [
    { id: 'teacher', label: 'Teacher', icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'manager', label: 'Manager', icon: LayoutDashboard, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'admin', label: 'Admin', icon: Shield, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ];

  const handleSwitch = (roleId: string) => {
    localStorage.setItem('dutyguard_forced_role', roleId);
    setIsOpen(false);
    navigate(`/${roleId}`);
    window.location.reload(); // Refresh to ensure RoleBasedRedirect or context updates properly if needed
  };

  return (
    <div className="fixed bottom-6 right-6 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-4 min-w-[200px]"
          >
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 px-2">Dev Role Switcher</div>
            <div className="flex flex-col gap-1">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleSwitch(role.id)}
                  className={cn(
                    "flex items-center gap-3 w-full p-3 rounded-2xl transition-all",
                    currentRole === role.id 
                      ? "bg-slate-900 text-white shadow-lg" 
                      : "hover:bg-slate-50 text-slate-600"
                  )}
                >
                  <role.icon className={cn("h-4 w-4", currentRole === role.id ? "text-white" : role.color)} />
                  <span className="text-sm font-bold tracking-tight">{role.label}</span>
                </button>
              ))}
            </div>
            <button 
              onClick={() => { localStorage.removeItem('dutyguard_forced_role'); window.location.reload(); }}
              className="mt-3 w-full py-2 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors"
            >
              Reset to Default
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-95 group",
          isOpen ? "bg-red-500 text-white" : "bg-slate-900 text-white"
        )}
      >
        <Settings className={cn("h-6 w-6 transition-transform", isOpen ? "rotate-90" : "group-hover:rotate-12")} />
      </button>
    </div>
  );
}
