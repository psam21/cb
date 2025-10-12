'use client';

import { useRouter } from 'next/navigation';
import { SignInFlow } from '@/components/auth/SignInFlow';

/**
 * Sign-in page
 * SOA-compliant: Page handles navigation, delegates auth to components/hooks
 * All authentication logic in SignInFlow component and useNostrSignIn hook
 */
export default function SigninPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/');
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen hero-section">
      <div className="max-w-lg w-full mx-4">
        <SignInFlow 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
