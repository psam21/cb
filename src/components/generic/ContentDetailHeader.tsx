'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { ContentAction, ContentBreadcrumb } from '@/types/content-detail';
import { ReactNode } from 'react';

interface ContentDetailHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: ContentBreadcrumb[];
  backHref?: string;
  backLabel?: string;
  actions?: ContentAction[];
  customButtons?: ReactNode;
  className?: string;
}

export function ContentDetailHeader({
  title,
  subtitle,
  breadcrumbs,
  backHref,
  backLabel = 'Back',
  actions = [],
  customButtons,
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
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

        <div className="flex flex-shrink-0 flex-wrap justify-start gap-2 sm:justify-end">
          <button
            type="button"
            onClick={handleBack}
            className="btn-outline-sm inline-flex items-center gap-2"
            aria-label={backLabel}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{backLabel}</span>
          </button>

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
          
          {customButtons}
        </div>
      </div>
    </header>
  );
}
