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
import { ManagerDashboard } from './pages/ManagerDashboard';
import { Login } from './pages/Login';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Toaster } from './components/ui/Toaster';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-2xl h-12 w-12 border-4 border-indigo-600 border-t-transparent shadow-xl shadow-indigo-100"></div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Initializing DutyGuard...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        
        <Route element={<Layout session={session} />}>
          <Route path="/" element={session ? <RoleBasedRedirect session={session} /> : <Navigate to="/login" />} />
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/teachers" element={<AdminTeachers />} />
          <Route path="/admin/venues" element={<AdminVenues />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

function RoleBasedRedirect({ session }: { session: any }) {
  // Simple role simulation based on email or persistence
  const forcedRole = localStorage.getItem('dutyguard_forced_role');
  if (forcedRole) return <Navigate to={`/${forcedRole}`} />;

  const email = session.user?.email;
  if (email?.includes('admin')) return <Navigate to="/admin" />;
  if (email?.includes('manager')) return <Navigate to="/manager" />;
  
  return <Navigate to="/teacher" />;
}

