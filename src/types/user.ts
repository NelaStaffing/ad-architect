export type UserRole = 'user' | 'manager' | 'admin';

export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}
