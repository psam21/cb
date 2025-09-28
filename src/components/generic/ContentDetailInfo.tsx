import type { ReactNode } from 'react';
import type { ContentMeta } from '@/types/content-detail';

export interface InfoItem {
  label: string;
  value: string | ReactNode;
  emphasis?: boolean;
}

interface ContentDetailInfoProps {
  title: string;
  price?: string;
  summary?: string;
  description: string;
  metadata?: InfoItem[];
  tags?: string[];
  metaBadges?: ContentMeta[];
}

export function ContentDetailInfo({
  title,
  price,
  summary,
  description,
  metadata = [],
  tags = [],
  metaBadges = [],
}: ContentDetailInfoProps) {
  return (
    <section aria-labelledby="content-detail-info" className="space-y-6">
      <header>
        <h2 id="content-detail-info" className="text-2xl font-serif font-bold text-primary-900">
          {title}
        </h2>
        {price && <p className="mt-2 text-2xl font-semibold text-accent-600">{price}</p>}
        {summary && <p className="mt-2 text-sm text-gray-600">{summary}</p>}
      </header>

      {metadata.length > 0 && (
        <dl className="grid grid-cols-1 gap-4 rounded-2xl bg-white/70 p-4 shadow-sm ring-1 ring-primary-100 md:grid-cols-2">
          {metadata.map(item => (
            <div key={item.label}>
              <dt className="text-xs uppercase tracking-wide text-gray-500">{item.label}</dt>
              <dd
                className={`mt-1 text-base font-medium ${item.emphasis ? 'text-primary-900' : 'text-gray-700'}`}
              >
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <article className="prose prose-primary max-w-none text-base leading-relaxed text-gray-700">
        <p className="whitespace-pre-line">{description}</p>
      </article>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <span
              key={tag}
              className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {metaBadges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {metaBadges.map(meta => (
            <div
              key={`${meta.label}-${meta.value}`}
              className="rounded-full border border-primary-100 px-3 py-1 text-xs font-medium text-primary-700"
              title={meta.tooltip}
            >
              {meta.label}: {meta.value}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
