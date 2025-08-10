import type { Metadata } from 'next';
import ExchangeContent from '@/components/pages/ExchangeContent';

export const metadata: Metadata = {
  title: 'Cultural Exchange – Culture Bridge',
  description:
    'Interactive exchange hub for sharing knowledge, artifacts, and collaborative heritage projects.',
};

export default function ExchangePage() {
  return <ExchangeContent />;
}
