/**
 * CartSyncProvider.tsx
 * Client Component - Global Cart Synchronization Provider
 * 
 * Ensures cart is loaded from relays on authentication and synced
 * throughout the entire shopping flow.
 * 
 * RESPONSIBILITIES:
 * - Initialize cart sync globally (not just on cart page)
 * - Maintain cart state accuracy throughout shopping flow
 * - Handle relay sync automatically on authentication
 * 
 * SOA COMPLIANCE:
 * Component Layer → Hook Layer (useCartSync)
 * 
 * @architecture Component Layer - Provider
 * @layer Component (wraps app with cart sync behavior)
 */

'use client';

import { useCartSync } from '@/hooks/useCartSync';

/**
 * Cart sync provider - wraps app to enable global cart synchronization
 * 
 * @architecture Component Layer
 * @responsibilities
 * - Initialize useCartSync globally
 * - Ensure cart loaded on authentication
 * - Maintain cart state throughout navigation
 * 
 * @usage
 * ```tsx
 * // In root layout
 * <CartSyncProvider>
 *   {children}
 * </CartSyncProvider>
 * ```
 */
export const CartSyncProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize cart sync (loads on auth, syncs on changes)
  useCartSync();
  
  // Pass through children (no UI wrapper needed)
  return <>{children}</>;
};
