import type { Metadata } from 'next';
import DonateContent from '@/components/pages/DonateContent';

export const metadata: Metadata = {
  title: 'Donate – Culture Bridge',
  description:
    'Support Culture Bridge and help preserve cultural heritage worldwide through Lightning Network donations.',
};

export default function DonatePage() {
  return <DonateContent />;
}
