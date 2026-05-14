import { supabase } from '../lib/supabase';

export interface UserRoleInfo {
  user_id: string;
  email: string;
  full_name: string;
  ui_role: 'teacher' | 'manager' | 'admin';
  locked: boolean;
  staff_code: string;
}

export async function getUserRoleInfo(userId: string): Promise<UserRoleInfo | null> {
  const { data, error } = await supabase
    .from('vw_user_roles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    console.error('Error fetching user role info:', error);
    return null;
  }

  return data as UserRoleInfo;
}

export async function getAllStaffRoles() {
  const { data, error } = await supabase
    .from('vw_user_roles')
    .select('*')
    .order('full_name');

  if (error) {
    console.error('Error fetching all staff roles:', error);
    return [];
  }

  return data as UserRoleInfo[];
}

export async function updateUserRole(staffCode: string, newRole: string) {
  // Assuming useraccountroles table has staff_code and role columns
  // Based on user prompt: "Save the changes back to the useraccountroles table"
  const { error } = await supabase
    .from('useraccountroles')
    .update({ role: newRole })
    .eq('staff_code', staffCode);

  if (error) {
    throw error;
  }
}
