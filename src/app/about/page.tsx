import type { Metadata } from 'next';
import AboutContent from '../../components/pages/AboutContent';

export const metadata: Metadata = {
  title: 'About – Culture Bridge',
  description:
    'Our mission to decentralize cultural preservation and empower communities worldwide.',
};

export default function AboutPage() {
  return <AboutContent />;
}
