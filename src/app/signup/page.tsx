/**
 * Sign Up Page
 * 
 * Multi-step Nostr sign-up flow
 * - Generate new Nostr keys
 * - Set up profile
 * - Backup keys
 * - Complete sign-up
 * 
 * @module app/signup
 */

import type { Metadata } from 'next';
import { SignUpFlow } from '@/components/auth/SignUpFlow';

export const metadata: Metadata = {
  title: 'Sign Up | Culture Bridge',
  description: 'Create your Nostr identity and join the Culture Bridge community to explore and share indigenous heritage.',
};

export default function SignUpPage() {
  return <SignUpFlow />;
}
