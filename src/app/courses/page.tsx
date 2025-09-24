import type { Metadata } from 'next';
import CoursesContent from '@/components/pages/CoursesContent';

export const metadata: Metadata = {
  title: 'Cultural Courses – Culture Bridge',
  description:
    'Learn about different cultures through structured courses, workshops, and educational programs.',
};

export default function CoursesPage() {
  return <CoursesContent />;
}
