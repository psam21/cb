/**
 * Zustand store for authentication state management
 * Centralized state for Nostr signer and user authentication
 */
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
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
    persist(
      (set, get) => ({
      // Initial state
      isAvailable: false,
      isLoading: false,
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
      
      logout: () => {
        // Clear authentication state
        set({
          user: null,
          isAuthenticated: false,
          signer: null,
          error: null,
        });
        
        // Clear ONLY Culture Bridge's browser storage (not other sites)
        if (typeof window !== 'undefined') {
          // Clear localStorage - only our keys
          // (localStorage is already origin-isolated, but we'll be explicit)
          const keysToRemove = Object.keys(localStorage).filter(key => 
            key.startsWith('auth-store') || 
            key.startsWith('product-store') || 
            key.startsWith('my-shop-store') ||
            key.startsWith('shop-store') ||
            key === 'lastPublishedEvent' ||
            key.startsWith('nostr') ||
            key.startsWith('culture-bridge')
          );
          keysToRemove.forEach(key => localStorage.removeItem(key));
          
          // Clear sessionStorage - only our keys
          const sessionKeysToRemove = Object.keys(sessionStorage).filter(key => 
            key.startsWith('auth-store') || 
            key.startsWith('product-store') || 
            key.startsWith('my-shop-store') ||
            key.startsWith('shop-store') ||
            key.startsWith('nostr') ||
            key.startsWith('culture-bridge')
          );
          sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
          
          // Clear cookies - only for this domain (cookies are already domain-isolated)
          // This only affects culturebridge.vercel.app cookies
          document.cookie.split(';').forEach((cookie) => {
            const name = cookie.split('=')[0].trim();
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname}`;
          });
          
          // Clear IndexedDB - only Culture Bridge databases
          if (window.indexedDB) {
            indexedDB.databases().then((databases) => {
              databases.forEach((db) => {
                // Only delete databases that belong to Culture Bridge
                if (db.name && (
                  db.name.includes('culture-bridge') || 
                  db.name.includes('nostr') ||
                  db.name.includes('auth')
                )) {
                  indexedDB.deleteDatabase(db.name);
                }
              });
            }).catch((error) => {
              console.warn('Failed to clear IndexedDB:', error);
            });
          }
          
          // Clear Cache API - only Culture Bridge caches
          // (Caches are already origin-isolated, so this only affects our domain)
          if ('caches' in window) {
            caches.keys().then((names) => {
              // Cache names are scoped to this origin by the browser
              // so we're only seeing culturebridge.vercel.app caches
              names.forEach((name) => {
                caches.delete(name);
              });
            }).catch((error) => {
              console.warn('Failed to clear caches:', error);
            });
          }
        }
      },
      
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
          // Persist user data and authentication state
          // Don't persist sensitive data like signer or keys
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          isAvailable: state.isAvailable,
        })
      }
    ),
    {
      name: 'auth-store-devtools'
    }
  )
);
