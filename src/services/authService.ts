import { supabase } from '../lib/supabase';

export interface UserRoleInfo {
  staff_code: string;
  email: string;
  full_name: string;
  ui_role: 'teacher' | 'manager' | 'admin';
  locked: boolean;
  user_id?: string; // Kept for compatibility if needed elsewhere
}

export const DEMO_USERS: Record<string, UserRoleInfo> = {
  'FRAN': {
    staff_code: 'FRAN',
    email: 'nortje.f@school.edu',
    full_name: 'Franz Nortjé',
    ui_role: 'admin',
    locked: true,
    user_id: 'demo-fran-uid'
  },
  'JOHD': {
    staff_code: 'JOHD',
    email: 'johand.d@school.edu',
    full_name: 'Johann de Wet',
    ui_role: 'admin',
    locked: true,
    user_id: 'demo-johd-uid'
  },
  'AYAM': {
    staff_code: 'AYAM',
    email: 'ayam@school.edu',
    full_name: 'Ayam Staff',
    ui_role: 'teacher',
    locked: false,
    user_id: 'demo-ayam-uid'
  },
  'AMOP': {
    staff_code: 'AMOP',
    email: 'amop@school.edu',
    full_name: 'Amop Teacher',
    ui_role: 'teacher',
    locked: false,
    user_id: 'demo-amop-uid'
  }
};

// Internal state to track demo role updates within the session, persisted to localStorage
const OVERRIDES_KEY = 'dutyguard_demo_overrides';

let demoRoleOverrides: Record<string, 'teacher' | 'manager' | 'admin'> = (() => {
  if (typeof window === 'undefined') return {};
  try {
    const saved = localStorage.getItem(OVERRIDES_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch (e) {
    console.warn('[DutyGuard] Failed to hydrate demo overrides:', e);
    return {};
  }
})();

const persistOverrides = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(demoRoleOverrides));
  }
};

export async function getUserRoleInfo(userId: string): Promise<UserRoleInfo | null> {
  // Check demo users first
  const demoUser = Object.values(DEMO_USERS).find(u => u.user_id === userId);
  if (demoUser) {
    return {
      ...demoUser,
      ui_role: demoRoleOverrides[demoUser.staff_code] || demoUser.ui_role
    };
  }

  // Get user details from auth to get email
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || (!user.email && !userId)) return null;

  const query = supabase
    .from('vw_user_roles')
    .select('*');

  if (user.email) {
    query.eq('email', user.email);
  } else {
    // Fallback if no email, though unlikely in this system
    return null;
  }

  const { data, error } = await query.single();

  if (error || !data) {
    console.error('Error fetching user role info:', error);
    return null;
  }

  return data as UserRoleInfo;
}

export async function getAllStaffRoles() {
  const isDemo = !!localStorage.getItem('dutyguard_demo_session');
  
  const { data, error } = await supabase
    .from('vw_user_roles')
    .select('*')
    .order('full_name');

  let results: UserRoleInfo[] = [];

  if (error) {
    console.warn('Database access restricted, falling back to registry cache...');
    if (isDemo) {
      results = Object.values(DEMO_USERS);
    }
  } else {
    results = (data || []) as UserRoleInfo[];
    
    // In demo mode, ensure our tactical demo experts are present in the matrix
    if (isDemo) {
      Object.values(DEMO_USERS).forEach(demoUser => {
        if (!results.some(r => r.staff_code === demoUser.staff_code)) {
          results.push(demoUser);
        }
      });
    }
  }

  // Apply overrides
  return results.map(user => ({
    ...user,
    ui_role: demoRoleOverrides[user.staff_code] || user.ui_role
  }));
}

export async function updateUserRole(staffCode: string, newRole: 'teacher' | 'manager' | 'admin') {
  const isDemo = !!localStorage.getItem('dutyguard_demo_session');
  
  console.log(`[DutyGuard] Initiating Role Rectification: ${staffCode} -> ${newRole}`);

  if (isDemo && (DEMO_USERS[staffCode] || demoRoleOverrides[staffCode] || true)) {
    // Simulate successful update for demo users and persist to storage
    console.log(`[DEMO MODE] Persisting tactical role override for ${staffCode}`);
    demoRoleOverrides[staffCode] = newRole;
    persistOverrides();
    await new Promise(resolve => setTimeout(resolve, 600)); // Tactical delay
    return;
  }

  // Real DB update
  const updateData: any = {};
  if (newRole === 'admin') updateData.accessToAdminUI = true;
  if (newRole === 'manager') updateData.accessToManagerUI = true;
  if (newRole === 'teacher') updateData.accessToTeacherUI = true;

  const { error } = await supabase
    .from('useraccountroles')
    .update(updateData)
    .eq('staff_code', staffCode);

  if (error) {
    console.error('[DutyGuard] Database Write Deficit:', error);
    // If it's demo mode and real update fails, we still allow the override for testing
    if (isDemo) {
      console.warn('[DEMO MODE] Database update failed, applying session override anyway.');
      demoRoleOverrides[staffCode] = newRole;
      persistOverrides();
      return;
    }
    throw error;
  }
}
