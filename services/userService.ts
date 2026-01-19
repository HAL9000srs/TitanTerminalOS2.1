import { userService as mockService } from './mockUserService';
import { firebaseUserService } from './firebaseUserService'; // Keep for safety/fallback
import { supabaseUserService } from './supabaseUserService';

// Logic: Use Mock if explicitly requested, otherwise check for Supabase, then Firebase
const useMock = import.meta.env.VITE_USE_MOCK === 'true';
const useSupabase = !!import.meta.env.VITE_SUPABASE_URL;

// Export the chosen service
export const userService = useMock 
  ? mockService 
  : (useSupabase ? supabaseUserService : firebaseUserService);

// Log active mode for debugging
console.log(`[SYSTEM] Auth Provider Initialized: ${
  useMock ? 'MOCK (Local)' : (useSupabase ? 'SUPABASE (Postgres)' : 'FIREBASE (NoSQL)')
}`);
