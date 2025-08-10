import React from 'react';
import { Star } from 'lucide-react';
import clsx from 'clsx';

export interface StarRatingProps {
  value: number; // e.g. 4.7
  max?: number; // default 5
  size?: 'xs' | 'sm' | 'md';
  showValue?: boolean; // append numeric value text
  label?: string; // accessible label context (e.g., "Story rating")
  className?: string;
  id?: string;
  /** Rounds display to nearest 0.5 visually (still announces exact to one decimal). Default true */
  stepHalf?: boolean;
}

/**
 * Accessible star rating (QW2) with optional numeric display.
 * Adds fractional (half) star visuals via clipped overlay (no extra SVG assets).
 * Future (MR6): consider adding tooltip / extended sr description.
 */
export const StarRating: React.FC<StarRatingProps> = ({
  value,
  max = 5,
  size = 'sm',
  showValue = false,
  label = 'Rating',
  className,
  id,
  stepHalf = true,
}) => {
  const displayValue = stepHalf ? Math.round(value * 2) / 2 : value;
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
  }[size];

  return (
    <div
      className={clsx('inline-flex items-center gap-1', className)}
      aria-label={`${label}: ${value.toFixed(1)} out of ${max}`}
      id={id}
    >
      {Array.from({ length: max }).map((_, i) => {
        const starBase = i;
        const rawFill = displayValue - starBase;
        const fillRatio = Math.max(0, Math.min(1, rawFill)); // 0..1
        return (
          <span key={i} className={clsx('relative inline-block', sizeClasses)} aria-hidden="true">
            {/* Base (empty) */}
            <Star className={clsx('absolute inset-0 text-gray-300', sizeClasses)} />
            {/* Filled overlay */}
            {fillRatio > 0 && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fillRatio * 100}%` }}
              >
                <Star className={clsx('text-accent-400 fill-current', sizeClasses)} />
              </span>
            )}
          </span>
        );
      })}
      {showValue && (
        <span className="ml-1 text-xs text-gray-600" aria-hidden="true">
          {value.toFixed(1)}
        </span>
      )}
      <span className="sr-only">
        {value.toFixed(1)} of {max}
      </span>
    </div>
  );
};

export default StarRating;
