import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ExternalLink, CreditCard, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getValidSession } from '../services/authClient';
import { useAccount, usePublicClient } from 'wagmi';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { normalizeImageUrl } from '../utils/imageUrl';

const CONTRACT_ADDRESS = '0x4ACBc139Cba05b41fBB7e760fD696D2A0FC8A0cC';

const API = 'http://localhost:3000/api/productos';

const formatFecha = (iso) => {
    try {
        return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
        return iso;
    }
};

const badgeMetodo = (metodo) => {
    const m = String(metodo || '').toLowerCase();
    if (m.includes('stripe')) return { label: 'Stripe', cls: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-300' };
    if (m.includes('paypal')) return { label: 'PayPal', cls: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300' };
    return { label: metodo, cls: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400' };
};

const MisCompras = () => {
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { address } = useAccount();
    const publicClient = usePublicClient();

    const [nfts, setNfts] = useState([]);
    const [loadingNfts, setLoadingNfts] = useState(false);

    // Cargar NFTs On-Chain
    useEffect(() => {
        if (!address || !publicClient) return;
        const fetchNFTs = async () => {
            setLoadingNfts(true);
            try {
                console.log("[MisCompras] Address conectada a Wagmi:", address);
                console.log("[MisCompras] Consultando contrato:", CONTRACT_ADDRESS);
                
                const total = await publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: [{ inputs: [], name: 'contadorLicencias', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' }],
                    functionName: 'contadorLicencias'
                });
                console.log("[MisCompras] Total licencias en el contrato:", Number(total));

                const fetchedNfts = [];
                for (let i = 1n; i <= total; i++) {
                    try {
                        const owner = await publicClient.readContract({
                            address: CONTRACT_ADDRESS,
                            abi: [{ inputs: [{ type: 'uint256' }], name: 'ownerOf', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' }],
                            functionName: 'ownerOf',
                            args: [i]
                        });
                        console.log(`[MisCompras] Token ID ${i} pertenece a: ${owner}`);

                        if (owner.toLowerCase() === address.toLowerCase()) {
                            const uri = await publicClient.readContract({
                                address: CONTRACT_ADDRESS,
                                abi: [{ inputs: [{ type: 'uint256' }], name: 'tokenURI', outputs: [{ type: 'string' }], stateMutability: 'view', type: 'function' }],
                                functionName: 'tokenURI',
                                args: [i]
                            });

                            const base64Data = uri.split(',')[1];
                            const json = JSON.parse(atob(base64Data));
                            fetchedNfts.push({ id: Number(i), ...json });
                            console.log(`[MisCompras] Añadido token ${i} a la galería`);
                        }
                    } catch (e) {
                        console.error("Error reading token", i, e);
                    }
                }
                setNfts(fetchedNfts);
            } catch (err) {
                console.error("Error global NFTs:", err);
            } finally {
                setLoadingNfts(false);
            }
        };
        fetchNFTs();
    }, [address, publicClient]);

    useEffect(() => {
        const cargar = async () => {
            try {
                const session = await getValidSession();
                if (!session?.accessToken) {
                    setError('Inicia sesión para ver tus compras.');
                    setLoading(false);
                    return;
                }
                const res = await fetch(`${API}/MisCompras`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` }
                });
                const data = await res.json();
                if (data.codigo !== 0) throw new Error(data.mensaje || 'Error al cargar compras');
                setCompras(data.compras || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        cargar();
    }, []);

    if (loading) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-12 mt-16">
                <div className="flex items-center gap-3 mb-8">
                    <ShoppingBag className="w-6 h-6 text-primary" />
                    <h1 className="text-3xl font-bold text-base-primary">Mis Compras</h1>
                </div>
                <div className="flex flex-col gap-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="surface-card p-4 animate-pulse flex gap-4">
                            <div className="w-16 h-16 rounded-xl bg-zinc-200 dark:bg-zinc-700 shrink-0" />
                            <div className="flex-1 space-y-2 py-1">
                                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3" />
                                <div className="h-3 bg-zinc-200 dark:bg-zinc-700 rounded w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-12 mt-16">
                <p className="text-red-500 text-sm">{error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-12 mt-16">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="mb-8"
            >
                <div className="flex items-center gap-3 mb-1">
                    <ShoppingBag className="w-6 h-6 text-primary" />
                    <h1 className="text-3xl font-bold text-base-primary">Mis Compras</h1>
                </div>
                <p className="text-base-secondary text-sm">
                    {compras.length === 0
                        ? 'Aún no has comprado nada.'
                        : `${compras.length} compra${compras.length !== 1 ? 's' : ''} realizadas`}
                </p>
            </motion.div>

            {compras.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center justify-center py-28 gap-5 text-center"
                >
                    <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800/60 flex items-center justify-center">
                        <ShoppingBag className="w-9 h-9 text-zinc-300 dark:text-zinc-600" />
                    </div>
                    <div>
                        <p className="text-base-primary font-semibold text-lg">Sin compras todavía</p>
                        <p className="text-base-secondary text-sm mt-1">Explora el marketplace y encuentra tu próximo recurso.</p>
                    </div>
                    <Link to="/" className="btn-primary text-sm px-5 py-2">Explorar productos</Link>
                </motion.div>
            ) : (
                <div className="flex flex-col gap-3">
                    <AnimatePresence initial={false}>
                        {compras.map((compra, i) => {
                            const imagen = compra.productos?.imagen || null;
                            const productoId = compra.producto_id || null;
                            const badge = badgeMetodo(compra.metodo_pago);
                            const purchaseState = {
                                from: '/mis-compras',
                                fromLabel: 'Volver a mis compras',
                                purchase: {
                                    id: compra.id,
                                    productId: productoId,
                                    title: compra.titulo,
                                    price: compra.precio,
                                    date: compra.created_at,
                                    type: compra.productos?.tipo || 'producto',
                                    status: 'completed',
                                    image: normalizeImageUrl(compra.productos?.imagen || ''),
                                    txHash: compra.blockchain_hash || null,
                                    metodoPago: compra.metodo_pago,
                                    idTransaccion: compra.id_transaccion
                                }
                            };

                            return (
                                <motion.div
                                    key={compra.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.25, delay: i * 0.04 }}
                                    className="surface-card p-4 flex items-center gap-4"
                                >
                                    <div className="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800 shrink-0 overflow-hidden flex items-center justify-center">
                                        {imagen ? (
                                            <img
                                                src={normalizeImageUrl(imagen)}
                                                alt={compra.titulo}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <Package className="w-7 h-7 text-zinc-400 dark:text-zinc-600" />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-base-primary truncate">{compra.titulo}</p>
                                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${badge.cls}`}>
                                                {badge.label}
                                            </span>
                                            <span className="text-xs text-faint flex items-center gap-1">
                                                <CreditCard className="w-3 h-3" />
                                                {compra.id_transaccion ? compra.id_transaccion.slice(-10) : '—'}
                                            </span>
                                            <span className="text-xs text-faint">{formatFecha(compra.created_at)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-base font-bold text-base-primary">
                                            {Number(compra.precio).toFixed(2)} €
                                        </span>
                                        {productoId && (
                                            <Link
                                                to={`/mis-compras/${productoId}/acceso`}
                                                state={purchaseState}
                                                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors duration-150"
                                            >
                                                Acceder
                                                <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* SECCIÓN BLOCKCHAIN: MIS LICENCIAS */}
            <div className="mt-16">
                <div className="flex items-center gap-3 mb-6">
                    <ShieldCheck className="w-6 h-6 text-violet-500" />
                    <h2 className="text-2xl font-bold text-base-primary">Mis Licencias On-Chain</h2>
                </div>
                
                {!address ? (
                    <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6 text-center">
                        <p className="text-violet-400">Conecta tu wallet MetaMask arriba a la derecha para ver tus licencias NFT verificadas en la blockchain de Sepolia.</p>
                    </div>
                ) : loadingNfts ? (
                    <div className="flex items-center gap-3 text-subtle py-8">
                        <Loader2 className="w-5 h-5 animate-spin" /> Escaneando la blockchain en busca de tus licencias...
                    </div>
                ) : nfts.length === 0 ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
                        <p className="text-dimmed">No se han encontrado licencias asociadas a la wallet {address.slice(0,6)}...{address.slice(-4)}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {nfts.map(nft => (
                            <motion.div 
                                key={nft.id} 
                                initial={{ opacity: 0, scale: 0.9 }} 
                                animate={{ opacity: 1, scale: 1 }} 
                                className="group surface-card overflow-hidden hover:border-violet-500/50 hover:shadow-[0_0_30px_-10px_rgba(139,92,246,0.3)] transition-all duration-300"
                            >
                                <div className="aspect-[4/5] bg-zinc-900 w-full overflow-hidden relative">
                                    <img 
                                        src={nft.image} 
                                        alt={nft.name} 
                                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500" 
                                    />
                                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 text-[10px] font-bold text-white tracking-widest uppercase">
                                        ERC-721
                                    </div>
                                </div>
                                <div className="p-5 border-t border-white/5">
                                    <h3 className="text-lg font-bold text-white mb-1">{nft.name}</h3>
                                    <p className="text-xs text-zinc-400 mb-4 line-clamp-2">{nft.description}</p>
                                    <div className="space-y-2">
                                        {nft.attributes?.map((attr, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-xs bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                                                <span className="text-zinc-500">{attr.trait_type}</span>
                                                <span className="font-semibold text-zinc-300 truncate max-w-[120px]" title={attr.value}>{attr.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <a 
                                        href={`https://sepolia.etherscan.io/nft/${CONTRACT_ADDRESS}/${nft.id}`}
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="mt-4 w-full flex items-center justify-center gap-2 btn-secondary py-2 text-xs"
                                    >
                                        <ExternalLink className="w-3 h-3" /> Ver tx en Etherscan
                                    </a>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MisCompras;
