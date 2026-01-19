import { supabase } from './supabase';
import { UserProfile, AuthResponse } from '../types';

export const supabaseUserService = {
  register: async (email: string, pass: string): Promise<AuthResponse> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
      });

      if (error) throw error;
      
      // We return the default structure immediately. 
      // The Postgres Trigger we set up in Step 1 will handle creating the 
      // actual 'profiles' row in the database automatically.
      return { 
        success: true, 
        user: { 
          id: data.user?.id || '', 
          accessKey: '******', // Default until loaded from profile
          role: 'OPERATOR', 
          createdAt: data.user?.created_at || new Date().toISOString(), 
          lastLogin: data.user?.last_sign_in_at || new Date().toISOString()
        } 
      };
    } catch (e: any) {
      let message = 'REGISTRATION FAILED';
      if (e.message?.includes('already registered')) message = 'OPERATOR ID ALREADY EXISTS';
      if (e.message?.includes('password')) message = 'ACCESS KEY TOO WEAK';
      return { success: false, message: message !== 'REGISTRATION FAILED' ? message : e.message };
    }
  },

  login: async (email: string, pass: string): Promise<AuthResponse> => {
    try {
      // 1. Perform Auth Login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned');

      // 2. Fetch "Professional" Profile Data (Role, Access Key) from DB
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      return { 
        success: true, 
        user: { 
            id: authData.user.id,
            // Use DB profile data if available, otherwise fallback to defaults
            accessKey: profile?.access_key || '******', 
            role: profile?.role || 'OPERATOR', 
            createdAt: authData.user.created_at, 
            lastLogin: authData.user.last_sign_in_at || new Date().toISOString()
        } 
      };
    } catch (e: any) {
       console.error("Login Error:", e);
       return { success: false, message: 'INVALID CREDENTIALS' };
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
  },

  getSession: async (): Promise<UserProfile | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;

    // Refresh profile data on session check
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    return {
      id: session.user.id,
      accessKey: profile?.access_key || '******',
      role: profile?.role || 'OPERATOR',
      createdAt: session.user.created_at,
      lastLogin: session.user.last_sign_in_at || new Date().toISOString()
    };
  }
};
