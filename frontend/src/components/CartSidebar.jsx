import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, ExternalLink, Loader2, Minus, Plus, ShoppingCart, Trash2, Wallet, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useCart } from '../context/CartContext';
import { getSession } from '../services/authClient';
import { postPagarCarrito } from '../services/stripeClient';

const CartSidebar = () => {
    const navigate = useNavigate();
    const { address, isConnected } = useAccount();
    const { items, isOpen, closeCart, removeFromCart, updateQty, clearCart, total, count } = useCart();

    const [estado, setEstado] = useState('idle'); // idle | procesando | ok | error
    const [mensaje, setMensaje] = useState('');
    const [resultado, setResultado] = useState(null); // { tokenId, blockchainHash }

    const cerrar = () => {
        closeCart();
        // Reseteamos el estado del pago al cerrar (con pequeño margen para la animacion)
        setTimeout(() => {
            setEstado('idle');
            setMensaje('');
            setResultado(null);
        }, 300);
    };

    const irAlProducto = (id) => {
        cerrar();
        navigate(`/producto/${id}`);
    };

    const tramitarCompra = async () => {
        const session = getSession();
        if (!session?.accessToken) {
            setEstado('error');
            setMensaje('Inicia sesión para completar la compra.');
            return;
        }

        setEstado('procesando');
        setMensaje('');

        const payload = items.map((it) => ({
            id: it.id,
            titulo: it.title,
            precio: it.price,
            qty: it.qty,
        }));

        try {
            const res = await postPagarCarrito(payload, 'visa', isConnected ? address : null);
            if (res.codigo === 0) {
                setResultado({ tokenId: res.tokenId, blockchainHash: res.blockchainHash });
                setEstado('ok');
                clearCart();
            } else {
                setEstado('error');
                setMensaje(res.mensaje || 'No se pudo completar el pago.');
            }
        } catch {
            setEstado('error');
            setMensaje('Error de red al procesar el pago.');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        key="cart-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={cerrar}
                        className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm"
                    />

                    <motion.aside
                        key="cart-panel"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
                        className="fixed right-0 top-0 z-[95] flex h-full w-full max-w-md flex-col border-l border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0e0e12] shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 px-5 py-4">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5 text-primary" />
                                <h2 className="text-lg font-bold text-base-primary">Tu carrito</h2>
                                {count > 0 && (
                                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{count}</span>
                                )}
                            </div>
                            <button
                                onClick={cerrar}
                                className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/5 dark:hover:text-white"
                                aria-label="Cerrar carrito"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Estado: compra completada */}
                        {estado === 'ok' ? (
                            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                                <CheckCircle2 className="h-14 w-14 text-emerald-500" />
                                <div>
                                    <p className="text-xl font-bold text-base-primary">¡Compra completada!</p>
                                    <p className="mt-1 text-sm text-dimmed">Tus productos ya están en "Mis Compras".</p>
                                </div>

                                {resultado?.tokenId && (
                                    <div className="w-full rounded-2xl border border-violet-400/30 bg-violet-500/5 p-4 text-left">
                                        <p className="mb-1 text-sm font-bold text-violet-500">🦊 Licencia NFT minteada</p>
                                        <p className="text-xs text-dimmed">Se ha creado <span className="font-semibold">un único NFT</span> para toda la compra.</p>
                                        <p className="mt-2 font-mono text-xs text-base-primary">Token ID: {resultado.tokenId}</p>
                                        {resultado.blockchainHash && (
                                            <a
                                                href={`https://sepolia.etherscan.io/tx/${resultado.blockchainHash}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-violet-500 hover:underline"
                                            >
                                                <ExternalLink className="h-3 w-3" /> Ver en Etherscan
                                            </a>
                                        )}
                                    </div>
                                )}

                                <div className="mt-2 flex w-full flex-col gap-2">
                                    <button onClick={() => { cerrar(); navigate('/mis-compras'); }} className="btn-primary w-full h-11 font-bold">
                                        Ver mis compras
                                    </button>
                                    <button onClick={cerrar} className="btn-secondary w-full h-11">
                                        Seguir comprando
                                    </button>
                                </div>
                            </div>
                        ) : items.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                                <div className="grid h-16 w-16 place-items-center rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.03]">
                                    <ShoppingCart className="h-7 w-7 text-faint" />
                                </div>
                                <p className="text-base-primary font-semibold">Tu carrito está vacío</p>
                                <p className="text-sm text-dimmed">Añade productos desde el marketplace para verlos aquí.</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex gap-3 rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.03] p-3"
                                    >
                                        <button
                                            onClick={() => irAlProducto(item.id)}
                                            className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-200 dark:bg-black/40"
                                        >
                                            {item.image && <img src={item.image} alt={item.title} className="h-full w-full object-cover" />}
                                        </button>

                                        <div className="flex min-w-0 flex-1 flex-col">
                                            <button
                                                onClick={() => irAlProducto(item.id)}
                                                className="truncate text-left text-sm font-semibold text-base-primary hover:text-primary"
                                                title={item.title}
                                            >
                                                {item.title}
                                            </button>
                                            <p className="text-xs text-dimmed">{item.category}</p>

                                            <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                                                <div className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-white/10">
                                                    <button
                                                        onClick={() => updateQty(item.id, item.qty - 1)}
                                                        className="grid h-7 w-7 place-items-center text-zinc-500 hover:text-primary disabled:opacity-40"
                                                        disabled={item.qty <= 1}
                                                        aria-label="Restar"
                                                    >
                                                        <Minus className="h-3.5 w-3.5" />
                                                    </button>
                                                    <span className="min-w-[1.25rem] text-center text-sm font-semibold text-base-primary">{item.qty}</span>
                                                    <button
                                                        onClick={() => updateQty(item.id, item.qty + 1)}
                                                        className="grid h-7 w-7 place-items-center text-zinc-500 hover:text-primary"
                                                        aria-label="Sumar"
                                                    >
                                                        <Plus className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>

                                                <span className="text-sm font-bold text-base-primary">{(item.price * item.qty).toFixed(2)} €</span>

                                                <button
                                                    onClick={() => removeFromCart(item.id)}
                                                    className="grid h-7 w-7 place-items-center rounded-lg text-zinc-400 hover:bg-red-500/10 hover:text-red-500"
                                                    aria-label="Quitar del carrito"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <button onClick={clearCart} className="mt-1 w-full text-center text-xs font-semibold text-faint hover:text-red-500">
                                    Vaciar carrito
                                </button>
                            </div>
                        )}

                        {/* Footer total + checkout */}
                        {estado !== 'ok' && items.length > 0 && (
                            <div className="border-t border-zinc-200 dark:border-white/10 px-5 py-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-dimmed">Total</span>
                                    <span className="text-2xl font-black text-base-primary">{total.toFixed(2)} €</span>
                                </div>

                                <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/[0.03] px-3 py-2 text-xs">
                                    <Wallet className="h-4 w-4 text-amber-500 shrink-0" />
                                    {isConnected ? (
                                        <span className="text-dimmed">Wallet conectada · se minteará <span className="font-semibold text-base-primary">1 NFT</span> para toda la compra.</span>
                                    ) : (
                                        <span className="text-dimmed">Sin wallet conectada · se pagará sin NFT (puedes conectarla arriba a la derecha).</span>
                                    )}
                                </div>

                                {estado === 'error' && (
                                    <div className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-500">
                                        <AlertCircle className="h-4 w-4 shrink-0" /> {mensaje}
                                    </div>
                                )}

                                <button
                                    onClick={tramitarCompra}
                                    disabled={estado === 'procesando'}
                                    className="btn-primary btn-shine w-full h-12 font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                                >
                                    {estado === 'procesando' ? (
                                        <><Loader2 className="h-4 w-4 animate-spin" /> Procesando pago...</>
                                    ) : (
                                        <>Tramitar compra · {total.toFixed(2)} €</>
                                    )}
                                </button>
                                <p className="text-center text-[11px] text-faint">Pago de prueba con tarjeta (Stripe sandbox).</p>
                            </div>
                        )}
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
};

export default CartSidebar;
