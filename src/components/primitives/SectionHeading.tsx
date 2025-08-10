import React from 'react';
import clsx from 'clsx';

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
  eyebrow?: string;
}

/**
 * Reusable section heading (QW10 groundwork, part of F4 primitives)
 */
export const SectionHeading: React.FC<SectionHeadingProps> = ({
  title,
  subtitle,
  align = 'center',
  className,
  eyebrow,
}) => {
  return (
    <div
      className={clsx(
        'mb-12',
        align === 'center' && 'text-center mx-auto',
        align === 'left' && 'text-left',
        align === 'right' && 'text-right ml-auto',
        className
      )}
    >
      {eyebrow && (
        <div className="text-sm tracking-wide uppercase font-semibold text-accent-600 mb-3">
          {eyebrow}
        </div>
      )}
      <h2 className="text-3xl md:text-4xl font-serif font-bold text-primary-800 mb-4">{title}</h2>
      {subtitle && (
        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
};

export default SectionHeading;
