import type { Metadata } from 'next';
import LanguageContent from '@/components/pages/LanguageContent';

export const metadata: Metadata = {
  title: 'Language Preservation – Culture Bridge',
  description:
    'Initiatives and tools focused on documenting and revitalizing endangered and minority languages on Culture Bridge.',
};

export default function LanguagePage() {
  return <LanguageContent />;
}
