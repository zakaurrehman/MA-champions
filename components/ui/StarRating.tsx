import { StarIcon } from './Icons';

interface Props {
  /** 0–5. Callers must pass a real value; never default this to 5. */
  rating: number;
  count?: number;
  size?: 'sm' | 'md';
}

export default function StarRating({ rating, count, size = 'sm' }: Props) {
  const dim = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const rounded = Math.round(rating * 10) / 10;

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="flex gap-0.5"
        role="img"
        aria-label={`Rated ${rounded} out of 5`}
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <StarIcon
            key={i}
            className={`${dim} ${i <= Math.round(rating) ? 'text-link' : 'text-subtle'}`}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-2xs text-muted">
          {rounded} ({count})
        </span>
      )}
    </div>
  );
}
