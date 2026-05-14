/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/teachers" element={<AdminTeachers />} />
          <Route path="/admin/venues" element={<AdminVenues />} />
          <Route path="/manager" element={<ManagerDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}

function RoleBasedRedirect({ session }: { session: any }) {
  // In a real app, this should fetch from the DB profile.
  // For this prototype, we'll use a mocked logic based on user email if needed,
  // or default to teacher as it's the primary mobile experience requested.
  const email = session.user?.email;
  if (email?.includes('admin')) return <Navigate to="/admin" />;
  if (email?.includes('manager')) return <Navigate to="/manager" />;
  return <Navigate to="/teacher" />;
}

