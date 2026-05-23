import { Star } from 'lucide-react';

const RatingStars = ({ value = 0, onChange = null, size = 16, className = '', interactive = false }) => {
    const stars = [1, 2, 3, 4, 5];

    return (
        <div className={`inline-flex items-center gap-1 ${className}`}>
            {stars.map((star) => {
                const filled = star <= Math.round(value);
                const sharedClassName = `transition-all duration-200 ${filled ? 'text-amber-300' : 'text-white/18'}`;

                if (interactive && onChange) {
                    return (
                        <button
                            key={star}
                            type="button"
                            onClick={() => onChange(star)}
                            className="rounded-full p-1 transition-transform duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
                        >
                            <Star className={`${sharedClassName} ${filled ? 'fill-amber-300 drop-shadow-[0_0_10px_rgba(252,211,77,0.32)]' : ''}`} style={{ width: size, height: size }} />
                        </button>
                    );
                }

                return (
                    <Star
                        key={star}
                        className={`${sharedClassName} ${filled ? 'fill-amber-300 drop-shadow-[0_0_10px_rgba(252,211,77,0.32)]' : ''}`}
                        style={{ width: size, height: size }}
                    />
                );
            })}
        </div>
    );
};

export default RatingStars;