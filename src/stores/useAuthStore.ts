/**
 * Zustand store for authentication state management
 * Centralized state for Nostr signer and user authentication
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { NostrSigner } from '@/types/nostr';
import { UserProfile } from '@/services/business/ProfileBusinessService';

export interface AuthState {
  // Signer state
  isAvailable: boolean;
  isLoading: boolean;
  error: string | null;
  signer: NostrSigner | null;
  
  // User state
  user: {
    pubkey: string;
    npub: string;
    profile: UserProfile;
  } | null;
  isAuthenticated: boolean;
  
  // Actions
  setSignerAvailable: (available: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSigner: (signer: NostrSigner | null) => void;
  setUser: (user: { pubkey: string; npub: string; profile: UserProfile } | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  logout: () => void;
  
  // Utility actions
  reset: () => void;
  getAuthStatus: () => {
    isAvailable: boolean;
    isLoading: boolean;
    isAuthenticated: boolean;
    hasError: boolean;
  };
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      // Initial state
      isAvailable: false,
      isLoading: true,
      error: null,
      signer: null,
      
      user: null,
      isAuthenticated: false,
      
      // Actions
      setSignerAvailable: (available) => set({ isAvailable: available }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      setSigner: (signer) => set({ signer }),
      
      setUser: (user) => set({ 
        user,
        isAuthenticated: !!user
      }),
      
      setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
      
      logout: () => set({
        user: null,
        isAuthenticated: false
      }),
      
      // Utility actions
      reset: () => set({
        isAvailable: false,
        isLoading: true,
        error: null,
        signer: null,
        user: null,
        isAuthenticated: false
      }),
      
      getAuthStatus: () => {
        const state = get();
        return {
          isAvailable: state.isAvailable,
          isLoading: state.isLoading,
          isAuthenticated: state.isAuthenticated,
          hasError: !!state.error
        };
      }
    }),
    {
      name: 'auth-store',
      partialize: (state: AuthState) => ({
        // Don't persist sensitive data like signer or keys
        // Only persist basic availability state
        isAvailable: state.isAvailable,
      })
    }
  )
);
