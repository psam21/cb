import { Calendar, Clock, User, Network } from 'lucide-react';
import type { ContentAuthor } from '@/types/content-detail';

interface ContentMetaInfoProps {
  publishedAt: number;
  updatedAt?: number;
  author: ContentAuthor;
  relays?: string[];
}

const formatDate = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export function ContentMetaInfo({ publishedAt, updatedAt, author, relays = [] }: ContentMetaInfoProps) {
  return (
    <section className="space-y-3 rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-primary-100">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Product Metadata</h3>
      <dl className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-3">
          <dt className="flex items-center gap-2 font-medium text-primary-700">
            <Calendar className="h-4 w-4" /> Published
          </dt>
          <dd>{formatDate(publishedAt)}</dd>
        </div>

        {updatedAt && updatedAt !== publishedAt && (
          <div className="flex items-center gap-3">
            <dt className="flex items-center gap-2 font-medium text-primary-700">
              <Clock className="h-4 w-4" /> Last Updated
            </dt>
            <dd>{formatDate(updatedAt)}</dd>
          </div>
        )}

        <div className="flex items-center gap-3">
          <dt className="flex items-center gap-2 font-medium text-primary-700">
            <User className="h-4 w-4" /> Author
          </dt>
          <dd className="truncate" title={author.npub ?? author.pubkey}>
            {author.displayName ?? author.npub ?? `${author.pubkey.slice(0, 12)}…`}
          </dd>
        </div>

        {relays.length > 0 && (
          <div className="flex items-center gap-3">
            <dt className="flex items-center gap-2 font-medium text-primary-700">
              <Network className="h-4 w-4" /> Relays
            </dt>
            <dd className="truncate" title={relays.join(', ')}>
              {relays.length} relays
            </dd>
          </div>
        )}
      </dl>
    </section>
  );
}
