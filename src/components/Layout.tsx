import { Outlet, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogOut, Bell, Shield, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

export function Layout({ session }: { session: any }) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const userEmail = session?.user?.email;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-lg shadow-sm shadow-indigo-200">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-950">DutyGuard</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/teacher" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Daily Timeline</Link>
            <Link to="/admin" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Scheduler</Link>
            <Link to="/manager" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Analytics</Link>
          </nav>

          <div className="flex items-center gap-2">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            
            <div className="hidden sm:flex items-center gap-3 ml-2 pl-4 border-l border-slate-200">
              <div className="flex flex-col items-end">
                <span className="text-sm font-semibold text-slate-900">{userEmail?.split('@')[0]}</span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Teacher</span>
              </div>
              <button 
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50/50 rounded-full transition-all"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile menu button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm transition-opacity md:hidden",
        isMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )} onClick={() => setIsMenuOpen(false)}>
        <div 
          className={cn(
            "fixed inset-y-0 right-0 w-64 bg-white shadow-2xl transition-transform duration-300 ease-in-out",
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full p-6">
            <div className="flex items-center justify-between mb-8">
              <span className="text-lg font-bold text-slate-950">Menu</span>
              <button onClick={() => setIsMenuOpen(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            
            <nav className="flex flex-col gap-4 flex-1">
              <Link to="/teacher" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl font-medium transition-all">
                Daily Timeline
              </Link>
              <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-3 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl font-medium transition-all">
                Scheduler
              </Link>
            </nav>

            <button 
              onClick={handleLogout}
              className="mt-auto flex items-center justify-center gap-2 w-full py-3 px-4 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 rounded-xl font-medium transition-all"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
