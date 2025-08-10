import type { Metadata } from 'next';
import ElderVoicesContent from '../../components/pages/ElderVoicesContent';

export const metadata: Metadata = {
  title: 'Elder Voices – Culture Bridge',
  description:
    'Oral histories and wisdom shared directly by elders to preserve knowledge for future generations.',
};

export default function ElderVoicesPage() {
  return <ElderVoicesContent />;
}
