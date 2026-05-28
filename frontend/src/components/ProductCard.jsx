import React, { useEffect, useMemo, useState } from 'react';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

const ProductCard = ({ id, title, category, price, rating, reviews, image }) => {
    const fallbackImage = useMemo(() => `https://picsum.photos/seed/card-${id}/640/420`, [id]);
    const [imgSrc, setImgSrc] = useState(image || fallbackImage);
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { addToCart, isInCart } = useCart();
    const liked = isInWishlist(id);
    const enCarrito = isInCart(id);

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart({ id, title, category, price, image: image || fallbackImage });
    };
    const isService = /servicio|service|api|microservicio|automatizacion|automation/i.test(String(category || ''));
    const intentClass = isService ? 'ds-intent-service' : 'ds-intent-product';

    const handleWishlist = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist({ id, title, category, price, rating, reviews, image });
    };

    useEffect(() => {
        setImgSrc(image || fallbackImage);
    }, [image, fallbackImage]);

    return (
        <Link to={`/producto/${id}`} className="block h-full">
            <motion.article
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                whileHover={{ y: -3, scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className={`ds-card ds-card-l1 ds-grid-card ${intentClass} group flex h-full flex-col overflow-hidden`}
                data-interactive="true"
            >
                {/* Imagen */}
                <motion.div layoutId={`product-image-${id}`} className="relative h-48 overflow-hidden bg-zinc-100 dark:bg-black">
                    <img
                        src={imgSrc}
                        alt={title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={() => setImgSrc(fallbackImage)}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-zinc-900/70 dark:from-darker to-transparent opacity-60" />
                    <div className="absolute top-4 right-4">
                        <span className={`ds-pill ${isService ? 'ds-pill-service' : 'ds-pill-product'}`}>
                            {category}
                        </span>
                    </div>
                    {/* Botón favoritos */}
                    <button
                        type="button"
                        onClick={handleWishlist}
                        aria-label={liked ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                        className="absolute top-4 left-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 dark:bg-dark/80 backdrop-blur-md border border-zinc-200/60 dark:border-white/10 shadow-sm transition-all duration-200 hover:scale-110 active:scale-95"
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                                key={liked ? 'liked' : 'unliked'}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                transition={{ duration: 0.18 }}
                            >
                                <Heart
                                    className={`w-4 h-4 transition-colors ${
                                        liked
                                            ? 'text-primary fill-primary'
                                            : 'text-zinc-400 dark:text-zinc-500'
                                    }`}
                                />
                            </motion.span>
                        </AnimatePresence>
                    </button>
                </motion.div>

                {/* Contenido */}
                <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-1 mb-2">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="label-muted">{rating} ({reviews})</span>
                    </div>

                    <motion.h3
                        layoutId={`product-title-${id}`}
                        className="text-base-primary text-lg font-bold mb-1 transition-colors leading-tight group-hover:text-zinc-100"
                    >
                        {title}
                    </motion.h3>

                    <p className="text-base-secondary text-sm mb-4 line-clamp-2">
                        Script de alto rendimiento optimizado para aplicaciones modernas e integración fluida.
                    </p>

                    <div className="flex items-center justify-between mt-auto">
                        <div>
                            <span className="label-muted block">Desde</span>
                            <motion.span
                                layoutId={`product-price-${id}`}
                                className="text-base-primary text-xl font-bold"
                            >
                                {price}€
                            </motion.span>
                        </div>
                        <button
                            type="button"
                            onClick={handleAddToCart}
                            aria-label={enCarrito ? 'Añadir otra unidad al carrito' : 'Añadir al carrito'}
                            title={enCarrito ? 'En el carrito · añadir otra unidad' : 'Añadir al carrito'}
                            className={`ds-icon-neutral group/btn transition-all hover:scale-110 active:scale-95 ${enCarrito ? 'ring-2 ring-primary/60' : ''}`}
                        >
                            <ShoppingCart className={`w-5 h-5 transition-all group-hover/btn:scale-110 ${enCarrito ? 'text-primary' : 'text-zinc-600 dark:text-white group-hover/btn:text-white'}`} />
                        </button>
                    </div>
                </div>
            </motion.article>
        </Link>
    );
};

export default ProductCard;
