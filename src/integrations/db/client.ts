import { SupabaseDbAdapter } from './providers/supabaseAdapter';
import type { DbAdapter } from './adapter';

// Supabase is the primary and only DB provider currently
export const db: DbAdapter = new SupabaseDbAdapter();
export type { DbAdapter } from './adapter';
