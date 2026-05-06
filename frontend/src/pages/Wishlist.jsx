import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { useWishlist } from '../context/WishlistContext';

const Wishlist = () => {
    const { wishlist } = useWishlist();

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 mt-16">
            {/* Cabecera */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mb-10"
            >
                <div className="flex items-center gap-3 mb-2">
                    <Heart className="w-6 h-6 text-primary fill-primary" />
                    <h1 className="text-3xl font-bold text-base-primary">Mis Favoritos</h1>
                </div>
                <p className="text-base-secondary text-sm">
                    {wishlist.length === 0
                        ? 'Aún no tienes ningún producto guardado.'
                        : `${wishlist.length} producto${wishlist.length !== 1 ? 's' : ''} guardado${wishlist.length !== 1 ? 's' : ''}`}
                </p>
            </motion.div>

            {wishlist.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center justify-center py-28 gap-5 text-center"
                >
                    <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-center">
                        <Heart className="w-9 h-9 text-zinc-300 dark:text-zinc-600" />
                    </div>
                    <div>
                        <p className="text-base-primary font-semibold text-lg">Sin favoritos todavía</p>
                        <p className="text-base-secondary text-sm mt-1">
                            Pulsa el corazón en cualquier producto para guardarlo aquí.
                        </p>
                    </div>
                </motion.div>
            ) : (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {wishlist.map((product) => (
                        <ProductCard
                            key={product.id}
                            id={product.id}
                            title={product.title}
                            category={product.category}
                            price={product.price}
                            rating={product.rating}
                            reviews={product.reviews}
                            image={product.image}
                        />
                    ))}
                </motion.div>
            )}
        </div>
    );
};

export default Wishlist;
