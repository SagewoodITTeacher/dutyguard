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
import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Toaster } from './components/ui/Toaster';
import { getUserRoleInfo, UserRoleInfo } from './services/authService';

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [roleInfo, setRoleInfo] = useState<UserRoleInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initializeAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      
      if (session) {
        const info = await getUserRoleInfo(session.user.id);
        setRoleInfo(info);
      }
      
      setLoading(false);
    }

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      if (session) {
        const info = await getUserRoleInfo(session.user.id);
        setRoleInfo(info);
      } else {
        setRoleInfo(null);
      }
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
        
        <Route element={<Layout session={session} roleInfo={roleInfo} />}>
          <Route path="/" element={session && roleInfo ? <RoleBasedRedirect roleInfo={roleInfo} /> : <Navigate to="/login" />} />
          
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
  if (!userRole) return null;
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

