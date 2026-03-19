import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: number;
}

export function StarRating({ rating, count, size = 14 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={star <= Math.round(rating) ? 'text-bieli-gold fill-bieli-gold' : 'text-bieli-border'}
        />
      ))}
      {count !== undefined && (
        <span className="text-xs text-bieli-muted ml-0.5">({count.toLocaleString()})</span>
      )}
    </div>
  );
}
