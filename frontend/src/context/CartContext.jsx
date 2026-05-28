import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);

const STORAGE_KEY = 'scriptbay_cart';

const toNumber = (value) => {
    const n = Number(String(value ?? '').toString().replace(',', '.').replace(/[^0-9.]/g, ''));
    return Number.isFinite(n) ? n : 0;
};

export const CartProvider = ({ children }) => {
    const [items, setItems] = useState(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    });
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const addToCart = useCallback((product) => {
        setItems((prev) => {
            const exists = prev.find((p) => p.id === product.id);
            if (exists) {
                return prev.map((p) => (p.id === product.id ? { ...p, qty: p.qty + 1 } : p));
            }
            return [
                ...prev,
                {
                    id: product.id,
                    title: product.title,
                    price: toNumber(product.price),
                    image: product.image || '',
                    category: product.category || '',
                    qty: 1,
                },
            ];
        });
        setIsOpen(true);
    }, []);

    const removeFromCart = useCallback((id) => {
        setItems((prev) => prev.filter((p) => p.id !== id));
    }, []);

    const updateQty = useCallback((id, qty) => {
        setItems((prev) =>
            prev
                .map((p) => (p.id === id ? { ...p, qty: Math.max(1, qty) } : p))
                .filter((p) => p.qty > 0)
        );
    }, []);

    const clearCart = useCallback(() => setItems([]), []);
    const isInCart = useCallback((id) => items.some((p) => p.id === id), [items]);

    const openCart = useCallback(() => setIsOpen(true), []);
    const closeCart = useCallback(() => setIsOpen(false), []);

    const count = useMemo(() => items.reduce((acc, p) => acc + p.qty, 0), [items]);
    const total = useMemo(() => items.reduce((acc, p) => acc + p.price * p.qty, 0), [items]);

    return (
        <CartContext.Provider
            value={{ items, addToCart, removeFromCart, updateQty, clearCart, isInCart, count, total, isOpen, openCart, closeCart }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used inside CartProvider');
    return ctx;
};
