import type { Metadata } from 'next';
import GetInvolvedContent from '@/components/pages/GetInvolvedContent';

export const metadata: Metadata = {
  title: 'Get Involved – Culture Bridge',
  description:
    'Ways to support, contribute to, and amplify cultural preservation efforts via Culture Bridge.',
};

export default function GetInvolvedPage() {
  return <GetInvolvedContent />;
}
