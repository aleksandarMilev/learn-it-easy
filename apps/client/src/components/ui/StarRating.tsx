import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses: Record<NonNullable<StarRatingProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
};

const TOTAL_STARS = 5;

export function StarRating({ value, onChange, size = 'md' }: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const isInteractive = !!onChange;
  const displayRating = isInteractive && hoveredRating > 0 ? hoveredRating : value;

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: TOTAL_STARS }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= displayRating;

        if (!isInteractive) {
          return (
            <span key={starValue} aria-hidden="true">
              <Star
                className={`${sizeClasses[size]} ${
                  isFilled ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-gray-300'
                }`}
              />
            </span>
          );
        }

        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onChange(starValue)}
            onMouseEnter={() => setHoveredRating(starValue)}
            onMouseLeave={() => setHoveredRating(0)}
            className="cursor-pointer transition-colors duration-100"
            aria-label={`${starValue} star${starValue !== 1 ? 's' : ''}`}
          >
            <Star
              className={`${sizeClasses[size]} ${
                isFilled ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-gray-300'
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
