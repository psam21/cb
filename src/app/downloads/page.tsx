import type { Metadata } from 'next';
import DownloadsContent from '../../components/pages/DownloadsContent';

export const metadata: Metadata = {
  title: 'Downloads & Resources – Culture Bridge',
  description:
    'Educational and cultural preservation resources including guides, toolkits, and media collections.',
};

export default function DownloadsPage() {
  return <DownloadsContent />;
}
