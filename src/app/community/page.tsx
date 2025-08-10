import type { Metadata } from 'next';
import CommunityContent from '../../components/pages/CommunityContent';

export const metadata: Metadata = {
  title: 'Community – Culture Bridge',
  description:
    'Engage with a global network of contributors preserving cultural heritage on Culture Bridge.',
};

export default function CommunityPage() {
  return <CommunityContent />;
}
