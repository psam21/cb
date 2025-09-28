'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { ContentAction, ContentBreadcrumb } from '@/types/content-detail';

interface ContentDetailHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: ContentBreadcrumb[];
  backHref?: string;
  backLabel?: string;
  actions?: ContentAction[];
  className?: string;
}

export function ContentDetailHeader({
  title,
  subtitle,
  breadcrumbs,
  backHref,
  backLabel = 'Back',
  actions = [],
  className = '',
}: ContentDetailHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (backHref) {
      router.push(backHref);
    } else {
      router.back();
    }
  };

  const handleAction = (action: ContentAction) => {
    if (action.onClick) {
      action.onClick();
      return;
    }

    if (action.href) {
      if (action.external) {
        window.open(action.href, '_blank', 'noopener,noreferrer');
      } else {
        router.push(action.href);
      }
      return;
    }

    if (action.id === 'share') {
      if (typeof navigator !== 'undefined' && navigator.share) {
        navigator.share({
          title,
          url: window.location.href,
        }).catch(() => {
          // ignore share cancellation
        });
      } else {
        void navigator.clipboard?.writeText(window.location.href);
        alert('Link copied to clipboard');
      }
    }
  };

  return (
    <header className={`space-y-4 ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="text-xs text-gray-500">
              <ol className="flex items-center gap-2">
                {breadcrumbs.map((crumb, index) => (
                  <li key={`${crumb.href}-${crumb.label}`} className="flex items-center gap-2">
                    <Link
                      href={crumb.href}
                      className="text-xs font-medium text-primary-600 hover:text-primary-800"
                    >
                      {crumb.label}
                    </Link>
                    {index < breadcrumbs.length - 1 && <span className="text-gray-300">/</span>}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <h1 className="text-3xl font-serif font-bold text-primary-900 lg:text-4xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-primary-200 bg-white px-4 py-2 text-sm font-medium text-primary-700 shadow-sm transition hover:border-primary-300 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-accent-400"
            aria-label={backLabel}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{backLabel}</span>
          </button>

          {actions.length > 0 && (
            <div className="flex flex-wrap justify-end gap-2">
              {actions.map(action => {
                const variantClasses = {
                  primary: 'btn-primary-sm',
                  secondary: 'btn-outline-sm',
                  ghost: 'btn-ghost-sm',
                } as const;

                const className = variantClasses[action.type ?? 'secondary'] ?? 'btn-outline-sm';

                return (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => handleAction(action)}
                    className={className}
                    aria-label={action.ariaLabel ?? action.label}
                    disabled={action.disabled}
                  >
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
