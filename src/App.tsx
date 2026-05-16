/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { TeacherDashboard } from './pages/TeacherDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminTeachers } from './pages/AdminTeachers';
import { AdminVenues } from './pages/AdminVenues';
import { FullScheduleManualEditing } from './pages/FullScheduleManualEditing';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { Login } from './pages/Login';
import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Toaster } from './components/ui/Toaster';
import { getUserRoleInfo, UserRoleInfo } from './services/authService';
import { AlertCircle, ShieldAlert, Shield } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [roleInfo, setRoleInfo] = useState<UserRoleInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    console.log('[DutyGuard] App mounted, initializing auth matrix...');
    
    // Safety timeout to prevent infinite loading - shortened to 5s
    const safetyTimeout = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          console.warn('[DutyGuard] Auth initialization safety net triggered');
          return false;
        }
        return prev;
      });
    }, 5000);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    async function initializeAuth() {
      try {
        console.log('[DutyGuard] Running initializeAuth...');
        // Fast-track demo session check
        const demoUserId = localStorage.getItem('dutyguard_demo_session');
        let currentSession: any = null;

        if (demoUserId) {
          console.log('[DutyGuard] Detected Demo Session:', demoUserId);
          currentSession = {
            user: { id: demoUserId, email: demoUserId + '@school.edu' },
            access_token: 'demo-token',
          };
          setSession(currentSession);
        } else if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
          console.log('[DutyGuard] Fetching Supabase session...');
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            console.error('[DutyGuard] sessionError:', sessionError);
          } else {
            currentSession = data.session;
            setSession(currentSession);
          }
        } else {
          console.warn('[DutyGuard] No Supabase credentials - starting in demo mode');
        }

        if (currentSession) {
          try {
            console.log('[DutyGuard] Mapping role for uid:', currentSession.user.id);
            const info = await getUserRoleInfo(currentSession.user.id);
            console.log('[DutyGuard] Role mapped:', info?.ui_role);
            setRoleInfo(info);
          } catch (err) {
            console.error('[DutyGuard] Role mapping failed:', err);
          }
        }
      } catch (err) {
        console.error('[DutyGuard] Global initialization error:', err);
      } finally {
        console.log('[DutyGuard] Initialization procedure finished');
        setLoading(false);
        clearTimeout(safetyTimeout);
      }
    }

    initializeAuth();

    const authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[DutyGuard] Auth State Change Event:', event);
      
      const isDemo = !!localStorage.getItem('dutyguard_demo_session');
      
      // If we are in demo mode, and Supabase says "no session", stay in demo mode
      if (!session && isDemo) {
        console.log('[DutyGuard] Retaining demo session despite Supabase null event');
        return;
      }

      // If a real session comes in, it overrides demo mode
      if (session && session.access_token !== 'demo-token') {
        console.log('[DutyGuard] Real session detected, clearing demo mode');
        localStorage.removeItem('dutyguard_demo_session');
      }

      setSession(session);
      if (session) {
        try {
          console.log('[DutyGuard] Fetching role info for session update...');
          const info = await getUserRoleInfo(session.user.id);
          setRoleInfo(info);
        } catch (err) {
          console.error('Failed to fetch role info on auth change:', err);
        }
      } else {
        setRoleInfo(null);
      }
    });

    return () => {
      console.log('[DutyGuard] Cleaning up effect...');
      if (authSubscription?.data?.subscription) {
        authSubscription.data.subscription.unsubscribe();
      }
    };
  }, []);

  if (configError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 text-center shadow-2xl">
          <div className="h-20 w-20 bg-amber-500/10 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-8">
            <ShieldAlert className="h-10 w-10" />
          </div>
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tight mb-4">Command Center Offline</h2>
          <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
            The infrastructure matrix is missing its authentication credentials. Please configure <code className="text-indigo-400 font-bold">VITE_SUPABASE_URL</code> and <code className="text-indigo-400 font-bold">VITE_SUPABASE_ANON_KEY</code> in your environment settings.
          </p>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 text-left">
            <div className="flex items-center gap-2 mb-2 text-amber-500/50">
              <AlertCircle className="h-3 w-3" />
              <span>Diagnostic Trace</span>
            </div>
            Status: Connection Halted<br/>
            Reason: Missing Protocol Keys<br/>
            Action: Provide Supabase credentials
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-6">
          <div className="relative h-20 w-20">
            <div className="absolute inset-0 rounded-[2rem] border-4 border-indigo-500/20"></div>
            <div className="absolute inset-0 rounded-[2rem] border-4 border-indigo-500 border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="h-8 w-8 text-indigo-500 animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-2">System Deployment</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Initializing Protocol Matrix...</p>
            <div className="mt-4 space-y-1">
              {logs.map((log, i) => (
                <p key={i} className="text-[9px] font-mono text-slate-600 lowercase opacity-60">
                  {`> ${log}`}
                </p>
              ))}
            </div>
          </div>
          
          {/* Emergency Reset Button */}
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setLoading(false)}
              className="mt-8 px-6 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all"
            >
              Bypass Initialization
            </button>
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-6 py-2 bg-red-950/20 border border-red-900/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-red-500 hover:bg-red-900/40 transition-all"
            >
              Factory Reset Matrix
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle Logged In but No Role mapping
  const isPendingRole = session && !roleInfo;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" replace />} />
        
        <Route element={<Layout session={session} roleInfo={roleInfo} />}>
          <Route path="/" element={
            session ? (
              roleInfo ? <RoleBasedRedirect roleInfo={roleInfo} /> : (
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white rounded-[3rem] border border-slate-100 shadow-xl">
                  <div className="h-20 w-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6">
                    <ShieldAlert className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-black italic uppercase tracking-tight mb-2">Access Denied</h3>
                  <p className="text-slate-500 max-w-md mx-auto mb-8 font-medium">Your account is authenticated but not registered in the duty matrix. Please contact the administrator to assign your deployment role.</p>
                  <button 
                    onClick={() => supabase.auth.signOut()}
                    className="px-8 py-4 bg-slate-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 transition-all shadow-xl shadow-red-500/10"
                  >
                    Logout & Retry
                  </button>
                </div>
              )
            ) : <Navigate to="/login" replace />
          } />
          
          <Route path="/teacher" element={
            <ProtectedRoute allowedRoles={['teacher', 'manager', 'admin']} userRole={roleInfo?.ui_role}>
              <TeacherDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/manager" element={
            <ProtectedRoute allowedRoles={['manager', 'admin']} userRole={roleInfo?.ui_role}>
              <ManagerDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']} userRole={roleInfo?.ui_role}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/teachers" element={
            <ProtectedRoute allowedRoles={['admin']} userRole={roleInfo?.ui_role}>
              <AdminTeachers />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/venues" element={
            <ProtectedRoute allowedRoles={['admin']} userRole={roleInfo?.ui_role}>
              <AdminVenues />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/full-schedule" element={
            <ProtectedRoute allowedRoles={['admin']} userRole={roleInfo?.ui_role}>
              <FullScheduleManualEditing />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

function ProtectedRoute({ 
  children, 
  allowedRoles, 
  userRole 
}: { 
  children: React.ReactNode; 
  allowedRoles: string[]; 
  userRole?: string;
}) {
  if (!userRole) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function RoleBasedRedirect({ roleInfo }: { roleInfo: UserRoleInfo }) {
  if (roleInfo.ui_role === 'admin') return <Navigate to="/admin" />;
  if (roleInfo.ui_role === 'manager') return <Navigate to="/manager" />;
  return <Navigate to="/teacher" />;
}

