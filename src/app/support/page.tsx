import type { Metadata } from 'next';
import SupportContent from '@/components/pages/SupportContent';

export const metadata: Metadata = {
  title: 'Support – Culture Bridge',
  description:
    'Get help, find answers, and connect with our community support team.',
};

export default function SupportPage() {
  return <SupportContent />;
}
