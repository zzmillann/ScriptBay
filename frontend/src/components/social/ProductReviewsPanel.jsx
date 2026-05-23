import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, MessageSquareQuote, Sparkles } from 'lucide-react';
import { getSession } from '../../services/authClient';
import { getProductReviews, postProductReview } from '../../services/socialClient';
import RatingStars from './RatingStars';

const formatReviewDate = (iso) => {
    try {
        return new Date(iso).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return iso;
    }
};

const ProductReviewsPanel = ({ productId, productTitle, onSummaryChange }) => {
    const session = getSession();
    const [payload, setPayload] = useState({ summary: { average: 0, total: 0, distribution: [] }, reviews: [], canReview: false, viewerReview: null });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        let ignore = false;

        const load = async () => {
            setLoading(true);
            const data = await getProductReviews(productId);
            if (ignore) return;

            if (data.codigo !== 0) {
                setError(data.mensaje || 'No se pudieron cargar las reseñas.');
                setLoading(false);
                return;
            }

            setPayload(data);
            setRating(data.viewerReview?.estrellas || 5);
            setComment(data.viewerReview?.comentario || '');
            setError('');
            setLoading(false);
            onSummaryChange?.(data.summary);
        };

        if (productId) load();

        return () => {
            ignore = true;
        };
    }, [productId, onSummaryChange]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSending(true);
        setError('');

        const data = await postProductReview({
            productoId: productId,
            estrellas: rating,
            comentario: comment
        });

        if (data.codigo !== 0) {
            setError(data.mensaje || 'No se pudo guardar la reseña.');
            setSending(false);
            return;
        }

        const refreshed = await getProductReviews(productId);
        if (refreshed.codigo === 0) {
            setPayload(refreshed);
            onSummaryChange?.(refreshed.summary);
        }
        setSending(false);
    };

    const summary = payload.summary || { average: 0, total: 0, distribution: [] };

    return (
        <section className="glass-card border-none p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/34">Trust layer</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">Reseñas verificadas</h3>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/52">
                        Feedback real de compradores que ya han activado {productTitle || 'este asset'} dentro del ecosistema ScriptBay.
                    </p>
                </div>
                <div className="rounded-[1.8rem] border border-white/10 bg-black/20 px-5 py-4 text-right">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-white/34">Media global</p>
                    <p className="mt-2 text-3xl font-semibold text-white">{summary.average.toFixed(1)}</p>
                    <div className="mt-2 flex items-center justify-end gap-2">
                        <RatingStars value={summary.average} size={15} />
                        <span className="text-xs text-white/44">{summary.total} reseñas</span>
                    </div>
                </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[0.78fr_1.22fr]">
                <div className="space-y-3">
                    {summary.distribution.map((row) => (
                        <div key={row.stars} className="rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-3">
                            <div className="flex items-center gap-3">
                                <span className="w-9 text-sm font-semibold text-white/78">{row.stars}.0</span>
                                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
                                    <motion.div
                                        className="h-full rounded-full bg-[linear-gradient(90deg,rgba(255,88,88,0.82),rgba(255,196,120,0.82))]"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${summary.total ? (row.count / summary.total) * 100 : 0}%` }}
                                        transition={{ duration: 0.5, ease: 'easeOut' }}
                                    />
                                </div>
                                <span className="w-8 text-right text-xs text-white/42">{row.count}</span>
                            </div>
                        </div>
                    ))}

                    <div className="rounded-[1.6rem] border border-red-400/14 bg-red-500/[0.07] p-4">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-red-100/76">
                            <Sparkles className="h-3.5 w-3.5" />
                            Compradores verificados
                        </div>
                        <p className="mt-3 text-sm leading-6 text-white/56">
                            Solo puede valorar quien haya comprado el asset. Eso mantiene el feedback limpio, util y ligado a uso real.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-[1.8rem] border border-white/10 bg-black/20 p-5">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-white">Valorar producto</p>
                                <p className="mt-1 text-xs text-white/42">Escribe una reseña premium y visible en toda la ficha.</p>
                            </div>
                            <MessageSquareQuote className="h-4.5 w-4.5 text-red-100/76" />
                        </div>

                        {!session ? (
                            <div className="mt-4 rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/50">
                                Inicia sesión para ver si tienes compra verificada y poder dejar una reseña.
                            </div>
                        ) : !payload.canReview ? (
                            <div className="mt-4 rounded-[1.4rem] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/50">
                                Necesitas haber comprado este producto para valorarlo.
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                                <div>
                                    <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/34">Tu valoración</p>
                                    <RatingStars value={rating} onChange={setRating} interactive size={20} />
                                </div>
                                <textarea
                                    value={comment}
                                    onChange={(event) => setComment(event.target.value)}
                                    rows={4}
                                    placeholder="Describe la calidad del asset, la experiencia de uso y el valor real que te aportó."
                                    className="w-full rounded-[1.5rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors duration-300 placeholder:text-white/24 focus:border-red-400/24"
                                />
                                <button type="submit" disabled={sending} className="btn-live-cta inline-flex rounded-2xl px-5 py-3 text-sm">
                                    {sending ? 'Guardando reseña...' : payload.viewerReview ? 'Actualizar reseña' : 'Publicar reseña'}
                                </button>
                            </form>
                        )}

                        {error ? (
                            <div className="mt-4 rounded-[1.4rem] border border-red-400/16 bg-red-500/[0.08] px-4 py-3 text-sm text-red-100/80">
                                {error}
                            </div>
                        ) : null}
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <div className="rounded-[1.8rem] border border-white/8 bg-white/[0.03] px-4 py-5 text-sm text-white/44">
                                Cargando reseñas recientes...
                            </div>
                        ) : payload.reviews.length === 0 ? (
                            <div className="rounded-[1.8rem] border border-white/8 bg-white/[0.03] px-4 py-5 text-sm text-white/44">
                                Todavía no hay reseñas. La primera opinión verificada abrirá la capa de reputación de este asset.
                            </div>
                        ) : payload.reviews.slice(0, 5).map((review) => (
                            <article key={review.id} className="ds-hover-row rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/25 text-sm font-semibold text-white">
                                            {(review.author?.nombre || 'U').slice(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-white">{review.author?.nombre || 'Usuario'}</p>
                                                {review.verified ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/16 bg-emerald-500/[0.08] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-100/78">
                                                        <BadgeCheck className="h-3 w-3" />
                                                        verificado
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="mt-1 flex items-center gap-2 text-xs text-white/42">
                                                <RatingStars value={review.estrellas} size={13} />
                                                <span>{formatReviewDate(review.created_at)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-4 text-sm leading-7 text-white/58">{review.comentario}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProductReviewsPanel;