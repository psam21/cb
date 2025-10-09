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

  const handleSuccess = () => {
    // Navigation handled by hook, but available for override
    router.push('/');
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen hero-section">
      <div className="max-w-md w-full mx-4">
        <SignInFlow 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
