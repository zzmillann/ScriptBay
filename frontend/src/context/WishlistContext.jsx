import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const WishlistContext = createContext(null);

const STORAGE_KEY = 'scriptbay_wishlist';

export const WishlistProvider = ({ children }) => {
    const [wishlist, setWishlist] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist));
    }, [wishlist]);

    const toggleWishlist = useCallback((product) => {
        setWishlist((prev) => {
            const exists = prev.some((p) => p.id === product.id);
            return exists
                ? prev.filter((p) => p.id !== product.id)
                : [...prev, product];
        });
    }, []);

    const isInWishlist = useCallback(
        (id) => wishlist.some((p) => p.id === id),
        [wishlist]
    );

    return (
        <WishlistContext.Provider value={{ wishlist, toggleWishlist, isInWishlist }}>
            {children}
        </WishlistContext.Provider>
    );
};

export const useWishlist = () => {
    const ctx = useContext(WishlistContext);
    if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider');
    return ctx;
};
