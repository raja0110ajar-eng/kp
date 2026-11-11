import { Star } from 'lucide-react';

export function RatingStars({ value, size = 16 }: { value: number; size?: number }) {
  const rounded = Math.round(value * 2) / 2;

  return (
    <span
      role="img"
      aria-label={`Rating ${value.toFixed(1).replace('.', ',')} dari 5`}
      className="inline-flex items-center gap-0.5 text-accent-ink"
    >
      {[1, 2, 3, 4, 5].map((position) => (
        <Star
          key={position}
          width={size}
          height={size}
          aria-hidden
          className={
            position <= rounded
              ? 'fill-current'
              : position - 0.5 === rounded
                ? 'fill-current opacity-50'
                : 'opacity-30'
          }
        />
      ))}
    </span>
  );
}