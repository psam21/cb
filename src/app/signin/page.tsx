'use client';

import { useRouter } from 'next/navigation';
import { SignInFlow } from '@/components/auth/SignInFlow';

/**
 * Sign-in page
 * SOA-compliant: Page → Component only
 * All logic delegated to SignInFlow component and useNostrSignIn hook
 */
export default function SigninPage() {
  const router = useRouter();

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen hero-section">
      <div className="max-w-lg w-full mx-4">
        <SignInFlow 
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
