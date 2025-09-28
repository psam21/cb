import type { ReactNode } from 'react';

interface ContentDetailLayoutProps {
  media: ReactNode;
  main: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function ContentDetailLayout({
  media,
  main,
  sidebar,
  footer,
  className = '',
}: ContentDetailLayoutProps) {
  return (
    <div className={`grid gap-10 lg:grid-cols-12 ${className}`}>
      <div className="lg:col-span-7 xl:col-span-8">
        {media}
      </div>
      <div className="lg:col-span-5 xl:col-span-4 space-y-6">
        {main}
        {sidebar}
      </div>
      {footer && (
        <div className="lg:col-span-12">{footer}</div>
      )}
    </div>
  );
}
