import React from 'react';
import { ShoppingCart, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const ProductCard = ({ title, category, price, rating, reviews, image }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
            className="glass-card group overflow-hidden"
        >
            {/* Image Container (Foto en Negro) */}
            <div className="relative h-48 overflow-hidden bg-black">
                <div className="w-full h-full bg-black transition-transform duration-500 group-hover:scale-110"></div>
                <div className="absolute inset-0 bg-linear-to-t from-darker to-transparent opacity-60"></div>
                <div className="absolute top-4 right-4">
                    <span className="bg-dark/80 backdrop-blur-md text-primary text-xs font-bold px-3 py-1.2 rounded-full border border-primary/20">
                        {category}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-5">
                <div className="flex items-center gap-1 mb-2">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs text-white/50">{rating} ({reviews})</span>
                </div>
                <h3 className="text-lg font-bold mb-1 group-hover:text-primary transition-colors leading-tight">{title}</h3>
                <p className="text-sm text-white/40 mb-4 line-clamp-2">Script de alto rendimiento optimizado para aplicaciones modernas e integración fluida.</p>

                <div className="flex items-center justify-between mt-auto">
                    <div>
                        <span className="text-xs text-white/40 block">Desde</span>
                        <span className="text-xl font-bold">{price}€</span>
                    </div>
                    <button className="flex items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-primary transition-all duration-300 group/btn">
                        <ShoppingCart className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default ProductCard;
