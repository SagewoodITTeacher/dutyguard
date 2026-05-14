import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Mail, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const quickLogin = async (staffCode: string) => {
    setLoading(true);
    setError(null);
    
    // Check if it's a demo user (All quick login buttons are treated as demo for now to facilitate testing)
    const demoUsers = ['FRAN', 'JOHD', 'AYAM', 'AMOP'];
    if (demoUsers.includes(staffCode)) {
      console.log('[DutyGuard] Initiating Demo Protocol for:', staffCode);
      const demoUserId = `demo-${staffCode.toLowerCase()}-uid`;
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      localStorage.setItem('dutyguard_demo_session', demoUserId);
      window.location.reload(); // Force app reboot to pick up simulated session
      return;
    }
    
    // For demo purposes, we assume emails are staffcode@school.edu and password is 'CURRO'
    const { error } = await supabase.auth.signInWithPassword({
      email: `${staffCode.toLowerCase()}@school.edu`,
      password: 'CURRO',
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="w-full max-w-[480px]">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-600 rounded-[2rem] shadow-2xl shadow-indigo-500/20 mb-6 rotate-3">
            <Shield className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter italic leading-none mb-4">DutyGuard</h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Access Operations Matrix</p>
        </div>

        <div className="bg-[#0f172a] p-10 rounded-[3rem] shadow-2xl border border-slate-800 shadow-black/50">
          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest pl-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-6 top-5 h-5 w-5 text-slate-600" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-16 pr-6 py-5 bg-slate-950 border border-slate-800 rounded-[1.8rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all outline-none font-bold text-white placeholder:text-slate-700"
                    placeholder="nortje.f@school.edu"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-3 uppercase tracking-widest pl-2">Security Key</label>
                <div className="relative">
                  <Lock className="absolute left-6 top-5 h-5 w-5 text-slate-600" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-16 pr-6 py-5 bg-slate-950 border border-slate-800 rounded-[1.8rem] focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all outline-none font-bold text-white placeholder:text-slate-700"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-2">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div 
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-indigo-600 border-indigo-500' : 'border-slate-800'}`}
                >
                  {rememberMe && <CheckCircle2 className="h-4 w-4 text-white" />}
                </div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-200 transition-colors">Remember Device</span>
              </label>
              <button type="button" className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-400 transition-colors">Emergency Access</button>
            </div>

            {error && (
              <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-black uppercase tracking-tight text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <>
                  Deploy Interface
                  <Shield className="h-4 w-4 group-hover:rotate-12 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-10 border-t border-slate-800">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-6 text-center italic">Quick Deploy (Demo Protocol)</p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { code: 'FRAN', label: 'FRAN (LOCKED)', demo: true },
                { code: 'JOHD', label: 'JOHD (LOCKED)', demo: true },
                { code: 'AYAM', label: 'AYAM (TEACHER)', demo: true },
                { code: 'AMOP', label: 'AMOP (TEACHER)', demo: true }
              ].map(u => (
                <button 
                  key={u.code}
                  onClick={() => quickLogin(u.code)}
                  className={cn(
                    "relative py-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all overflow-hidden group",
                    u.demo ? "text-amber-500 border-amber-500/20 hover:border-amber-500/50" : "text-slate-400 hover:border-indigo-500/50"
                  )}
                >
                  <span className="relative z-10">{u.label}</span>
                  {u.demo && (
                    <span className="absolute -top-1 -right-4 bg-amber-500 text-[8px] px-5 py-2 rotate-12 font-black shadow-lg shadow-amber-500/20">DEMO</span>
                  )}
                  <div className={cn(
                    "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity",
                    u.demo ? "bg-amber-500" : "bg-indigo-500"
                  )} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
