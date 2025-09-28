import Link from 'next/link';
import { ArrowLeftCircle } from 'lucide-react';

interface ContentNotFoundProps {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}

export function ContentNotFound({
  title = 'Content not found',
  description = 'The content you are looking for may have been removed or is unavailable at this time.',
  backHref = '/',
  backLabel = 'Return home',
}: ContentNotFoundProps) {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl bg-white/80 p-12 text-center shadow-lg ring-1 ring-primary-100">
      <ArrowLeftCircle className="mx-auto mb-4 h-12 w-12 text-primary-300" />
      <h2 className="text-3xl font-serif font-bold text-primary-900">{title}</h2>
      <p className="mt-4 text-base text-gray-600">{description}</p>
      <Link
        href={backHref}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
      >
        <ArrowLeftCircle className="h-4 w-4" />
        {backLabel}
      </Link>
    </div>
  );
}
