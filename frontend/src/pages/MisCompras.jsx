import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity,
    ArrowRight,
    Box,
    CalendarDays,
    CreditCard,
    Download,
    ExternalLink,
    FolderOpen,
    Grid3X3,
    Loader2,
    Package,
    Search,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Wallet,
    Zap
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getValidSession } from '../services/authClient';
import { apiUrl } from '../services/apiBase';
import { useAccount, usePublicClient } from 'wagmi';
import { normalizeImageUrl } from '../utils/imageUrl';

const CONTRACT_ADDRESS = '0x4ACBc139Cba05b41fBB7e760fD696D2A0FC8A0cC';
const API = apiUrl('/api/productos');

const formatFecha = (iso) => {
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

const formatPrice = (value) => {
    const amount = Number(value || 0);
    return `${amount.toFixed(2)} €`;
};

const looksLikeInternalCode = (value) => {
    const text = String(value || '').trim();
    if (!text) return true;
    return /^[a-f0-9]{6,}$/i.test(text) || text.toLowerCase() === 'producto';
};

const getMetodoMeta = (metodo) => {
    const payment = String(metodo || '').toLowerCase();

    if (payment.includes('stripe')) {
        return {
            label: 'Stripe',
            tone: 'ds-pill-service',
            note: 'Pago verificado'
        };
    }

    if (payment.includes('paypal')) {
        return {
            label: 'PayPal',
            tone: 'ds-pill-product',
            note: 'Cobro registrado'
        };
    }

    return {
        label: metodo || 'Digital',
        tone: 'border border-white/10 bg-white/5 text-zinc-300',
        note: 'Canal activo'
    };
};

const getTypeMeta = (type) => {
    const normalized = String(type || '').toLowerCase() === 'servicio' ? 'servicio' : 'producto';

    if (normalized === 'servicio') {
        return {
            key: 'servicio',
            label: 'Servicio',
            pill: 'ds-pill-service',
            icon: Zap,
            accent: 'from-sky-500/14 via-transparent to-transparent',
            descriptor: 'Flujo asistido'
        };
    }

    return {
        key: 'producto',
        label: 'Producto',
        pill: 'ds-pill-product',
        icon: Box,
        accent: 'from-red-500/16 via-transparent to-transparent',
        descriptor: 'Asset descargable'
    };
};

const getVersionLabel = (purchaseId) => `v${((Number(purchaseId) % 5) || 1)}.${((Number(purchaseId) * 3) % 9) || 0}`;

const getShortDescription = (title, typeMeta, metodoMeta) => {
    const safeTitle = String(title || 'asset premium');
    const focus = typeMeta.key === 'servicio' ? 'entorno de acceso privado' : 'workspace descargable';
    return `${safeTitle} listo en tu biblioteca privada con ${focus} y activacion por ${metodoMeta.label}.`;
};

const normalizePurchase = (compra) => {
    const productoId = compra.producto_id || compra.productos?.id || null;
    const titulo = looksLikeInternalCode(compra.titulo)
        ? (compra.productos?.titulo || 'Producto comprado')
        : compra.titulo;
    const image = normalizeImageUrl(compra.productos?.imagen || '') || `https://picsum.photos/seed/mis-compras-${productoId || compra.id}/960/720`;
    const typeMeta = getTypeMeta(compra.productos?.tipo || 'producto');
    const metodoMeta = getMetodoMeta(compra.metodo_pago);

    return {
        id: compra.id,
        productId: productoId,
        title: titulo,
        image,
        typeMeta,
        metodoMeta,
        description: getShortDescription(titulo, typeMeta, metodoMeta),
        date: compra.created_at,
        price: Number(compra.precio || 0),
        priceLabel: formatPrice(compra.precio),
        transactionId: compra.id_transaccion || null,
        txHash: compra.blockchain_hash || null,
        method: compra.metodo_pago,
        version: getVersionLabel(compra.id),
        purchaseState: {
            from: '/mis-compras',
            fromLabel: 'Volver a mis compras',
            purchase: {
                id: compra.id,
                productId: productoId,
                title: titulo,
                price: compra.precio,
                date: compra.created_at,
                type: compra.productos?.tipo || 'producto',
                status: 'completed',
                image,
                txHash: compra.blockchain_hash || null,
                metodoPago: compra.metodo_pago,
                idTransaccion: compra.id_transaccion
            }
        }
    };
};

const MetricCard = ({ icon: Icon, label, value, helper }) => (
    <div className="glass-card border-none p-4">
        <div className="flex items-start justify-between gap-3">
            <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">{label}</p>
                <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
                <p className="mt-1 text-xs text-white/40">{helper}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-red-200/90">
                <Icon className="h-4.5 w-4.5" />
            </div>
        </div>
    </div>
);

const FilterChip = ({ active, children, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`rounded-full border px-3.5 py-2 text-xs font-semibold tracking-[0.16em] uppercase transition-all duration-300 ${
            active
                ? 'border-red-400/35 bg-red-500/12 text-red-50 shadow-[0_0_20px_-14px_rgba(255,70,70,0.65)]'
                : 'border-white/10 bg-white/[0.04] text-white/48 hover:border-red-500/20 hover:bg-white/[0.06] hover:text-white/78'
        }`}
    >
        {children}
    </button>
);

const PurchaseCard = ({ item, index, onAccess, onDownload, onDetails, downloadingId }) => {
    const TypeIcon = item.typeMeta.icon;
    const loadingDownload = downloadingId === item.id;

    return (
        <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.34, delay: index * 0.045, ease: 'easeOut' }}
            whileHover={{ y: -4 }}
            className="ds-card ds-card-l1 ds-grid-card group relative flex h-full flex-col overflow-hidden"
            data-interactive="true"
        >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.typeMeta.accent} opacity-75`} />
            <div className="relative aspect-[1.15/1] overflow-hidden border-b border-white/8 bg-black/35">
                <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition-all duration-700 group-hover:scale-[1.05] group-hover:brightness-[1.06]"
                    onError={(event) => {
                        event.currentTarget.style.display = 'none';
                        const fallback = event.currentTarget.parentElement?.querySelector('.purchase-fallback-icon');
                        if (fallback) fallback.classList.remove('hidden');
                    }}
                />
                <div className="purchase-fallback-icon hidden absolute inset-0 flex items-center justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] border border-white/10 bg-white/6 backdrop-blur-xl">
                        <Package className="h-9 w-9 text-white/32" />
                    </div>
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,90,90,0.18),transparent_34%),linear-gradient(180deg,transparent_34%,rgba(0,0,0,0.76)_100%)]" />

                <div className="absolute left-4 top-4 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${item.typeMeta.pill}`}>
                        <TypeIcon className="h-3.5 w-3.5" />
                        {item.typeMeta.label}
                    </span>
                    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${item.metodoMeta.tone}`}>
                        {item.metodoMeta.label}
                    </span>
                </div>

                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                    <div>
                        <p className="text-[10px] uppercase tracking-[0.24em] text-white/40">Asset activo</p>
                        <p className="mt-2 text-xl font-semibold text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]">{item.title}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/30 px-3 py-2 text-right backdrop-blur-xl">
                        <p className="text-[10px] uppercase tracking-[0.22em] text-white/38">Valor</p>
                        <p className="mt-1 text-base font-semibold text-white">{item.priceLabel}</p>
                    </div>
                </div>
            </div>

            <div className="relative flex flex-1 flex-col gap-5 p-5">
                <div>
                    <p className="text-sm leading-6 text-white/58">{item.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/34">Fecha</p>
                        <p className="mt-2 inline-flex items-center gap-2 text-white/78">
                            <CalendarDays className="h-3.5 w-3.5 text-red-200/70" />
                            {formatFecha(item.date)}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/34">Version</p>
                        <p className="mt-2 text-white/78">{item.version}</p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/34">Rail</p>
                        <p className="mt-2 inline-flex items-center gap-2 text-white/78">
                            <CreditCard className="h-3.5 w-3.5 text-red-200/70" />
                            {item.metodoMeta.note}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/34">Acceso</p>
                        <p className="mt-2 text-white/78">{item.typeMeta.descriptor}</p>
                    </div>
                </div>

                <div className="mt-auto flex flex-col gap-2.5">
                    <button
                        type="button"
                        onClick={() => onAccess(item)}
                        className="btn-live-cta w-full justify-center rounded-2xl px-4 py-3 text-sm"
                        disabled={!item.productId}
                    >
                        Acceder al asset
                        <ArrowRight className="h-4 w-4" />
                    </button>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => onDownload(item)}
                            disabled={loadingDownload}
                            className="ds-btn-neutral inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold"
                        >
                            {loadingDownload ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            Descargar
                        </button>
                        <button
                            type="button"
                            onClick={() => onDetails(item)}
                            className="ds-btn-neutral inline-flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-semibold"
                            disabled={!item.productId}
                        >
                            <ExternalLink className="h-4 w-4" />
                            Ver detalles
                        </button>
                    </div>
                </div>
            </div>
        </motion.article>
    );
};

const MisCompras = () => {
    const navigate = useNavigate();
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [downloadingId, setDownloadingId] = useState(null);
    const { address } = useAccount();
    const publicClient = usePublicClient();

    const [nfts, setNfts] = useState([]);
    const [loadingNfts, setLoadingNfts] = useState(false);

    useEffect(() => {
        if (!address || !publicClient) return;

        const fetchNFTs = async () => {
            setLoadingNfts(true);
            try {
                const total = await publicClient.readContract({
                    address: CONTRACT_ADDRESS,
                    abi: [{ inputs: [], name: 'contadorLicencias', outputs: [{ type: 'uint256' }], stateMutability: 'view', type: 'function' }],
                    functionName: 'contadorLicencias'
                });

                const fetchedNfts = [];
                for (let i = 1n; i <= total; i++) {
                    try {
                        const owner = await publicClient.readContract({
                            address: CONTRACT_ADDRESS,
                            abi: [{ inputs: [{ type: 'uint256' }], name: 'ownerOf', outputs: [{ type: 'address' }], stateMutability: 'view', type: 'function' }],
                            functionName: 'ownerOf',
                            args: [i]
                        });

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
                        }
                    } catch {
                        continue;
                    }
                }

                setNfts(fetchedNfts);
            } catch (err) {
                console.error('Error global NFTs:', err);
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
                    setError('Inicia sesión para ver tu biblioteca premium.');
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

    const normalizedPurchases = useMemo(() => compras.map(normalizePurchase), [compras]);

    const filteredPurchases = useMemo(() => {
        const search = query.trim().toLowerCase();

        return normalizedPurchases.filter((item) => {
            const matchesFilter = activeFilter === 'all'
                ? true
                : activeFilter === 'recent'
                    ? Date.now() - new Date(item.date).getTime() <= 1000 * 60 * 60 * 24 * 30
                    : item.typeMeta.key === activeFilter;

            const matchesQuery = !search
                || item.title.toLowerCase().includes(search)
                || item.metodoMeta.label.toLowerCase().includes(search)
                || item.typeMeta.label.toLowerCase().includes(search);

            return matchesFilter && matchesQuery;
        });
    }, [activeFilter, normalizedPurchases, query]);

    const libraryStats = useMemo(() => {
        const totalValue = normalizedPurchases.reduce((sum, item) => sum + item.price, 0);
        const products = normalizedPurchases.filter((item) => item.typeMeta.key === 'producto').length;
        const services = normalizedPurchases.length - products;
        const newest = [...normalizedPurchases]
            .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())[0];

        return {
            totalAssets: normalizedPurchases.length,
            totalValue: formatPrice(totalValue),
            categories: [products ? 'Productos' : null, services ? 'Servicios' : null].filter(Boolean).join(' · ') || 'Sin categorias',
            recentTitle: newest?.title || 'Sin actividad reciente'
        };
    }, [normalizedPurchases]);

    const recentSwaps = useMemo(
        () => normalizedPurchases.slice().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4),
        [normalizedPurchases]
    );

    const handleAccess = (item) => {
        if (!item.productId) return;

        navigate(`/mis-compras/${item.productId}/acceso`, {
            state: item.purchaseState
        });
    };

    const handleDetails = (item) => {
        if (!item.productId) return;
        navigate(`/producto/${item.productId}`, {
            state: item.purchaseState
        });
    };

    const handleDownload = async (item) => {
        setDownloadingId(item.id);
        try {
            const session = await getValidSession();
            if (!session?.accessToken) throw new Error('Necesitas iniciar sesion para descargar este asset.');

            const response = await fetch(`${API}/DescargarArchivoCompra/${item.id}`, {
                headers: { Authorization: `Bearer ${session.accessToken}` }
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                throw new Error(payload?.mensaje || 'No se pudo descargar el asset.');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `${item.title.replace(/\s+/g, '-').toLowerCase() || 'asset-scriptbay'}`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setError(err.message);
        } finally {
            setDownloadingId(null);
        }
    };

    if (loading) {
        return (
            <div className="relative isolate overflow-hidden px-4 pb-14 pt-24 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="grid gap-6 lg:grid-cols-[1.45fr_0.85fr]">
                        <div className="glass-card border-none p-6 sm:p-8 animate-pulse">
                            <div className="h-5 w-32 rounded-full bg-white/10" />
                            <div className="mt-4 h-12 w-2/3 rounded-2xl bg-white/10" />
                            <div className="mt-4 h-4 w-3/4 rounded-full bg-white/8" />
                            <div className="mt-8 grid gap-4 sm:grid-cols-3">
                                {[...Array(3)].map((_, index) => (
                                    <div key={index} className="h-28 rounded-3xl border border-white/8 bg-white/6" />
                                ))}
                            </div>
                        </div>
                        <div className="glass-card border-none p-6 animate-pulse">
                            <div className="h-6 w-40 rounded-full bg-white/10" />
                            <div className="mt-5 space-y-3">
                                {[...Array(4)].map((_, index) => (
                                    <div key={index} className="h-16 rounded-2xl border border-white/8 bg-white/6" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !normalizedPurchases.length) {
        return (
            <div className="relative isolate overflow-hidden px-4 pb-14 pt-24 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl">
                    <div className="glass-card border-none p-8 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.6rem] border border-red-400/20 bg-red-500/10 text-red-200">
                            <ShoppingBag className="h-7 w-7" />
                        </div>
                        <h1 className="mt-5 text-3xl font-semibold text-white">No se pudo cargar tu biblioteca</h1>
                        <p className="mt-3 text-sm text-white/55">{error}</p>
                        <Link to="/" className="btn-live-cta mt-6 inline-flex">
                            Volver al marketplace
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative isolate overflow-hidden px-4 pb-16 pt-24 sm:px-6 lg:px-8">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-[460px] bg-[radial-gradient(circle_at_12%_10%,rgba(255,64,64,0.16),transparent_34%),radial-gradient(circle_at_85%_0%,rgba(255,255,255,0.06),transparent_24%),linear-gradient(180deg,rgba(8,8,10,0.7),transparent_72%)]" />
            <motion.div
                className="pointer-events-none absolute left-[8%] top-28 h-44 w-44 rounded-full bg-red-500/10 blur-[90px]"
                animate={{ opacity: [0.32, 0.56, 0.32], scale: [1, 1.08, 1] }}
                transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="pointer-events-none absolute right-[10%] top-36 h-56 w-56 rounded-full bg-red-400/6 blur-[120px]"
                animate={{ opacity: [0.18, 0.34, 0.18], y: [0, -10, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative mx-auto max-w-7xl space-y-8">
                <section className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                        className="glass-card border-none p-6 sm:p-8 lg:p-9"
                    >
                        <div className="flex flex-col gap-8">
                            <div className="flex flex-wrap items-start justify-between gap-6">
                                <div className="max-w-3xl">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-red-100/88">
                                        <Sparkles className="h-3.5 w-3.5" />
                                        Biblioteca privada ScriptBay
                                    </div>
                                    <h1 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl">
                                        Mis Compras convertida en un vault premium de assets digitales.
                                    </h1>
                                    <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58 sm:text-base">
                                        Un workspace personal para abrir, descargar y gestionar tus recursos adquiridos con la misma identidad cinematografica del ecosistema ScriptBay.
                                    </p>
                                </div>

                                <div className="rounded-[2rem] border border-white/10 bg-black/20 px-5 py-4 backdrop-blur-xl">
                                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/36">Collection state</p>
                                    <p className="mt-3 text-3xl font-semibold text-white">{libraryStats.totalAssets}</p>
                                    <p className="mt-1 text-xs text-white/42">assets activos en tu libreria</p>
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <MetricCard icon={Grid3X3} label="Assets" value={libraryStats.totalAssets} helper="Coleccion visible y accesible" />
                                <MetricCard icon={CreditCard} label="Valor" value={libraryStats.totalValue} helper="Capital desplegado en herramientas" />
                                <MetricCard icon={FolderOpen} label="Categorias" value={libraryStats.categories} helper="Clasificacion actual de tu vault" />
                            </div>

                            <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
                                <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-[0.24em] text-white/34">Busqueda y filtros</p>
                                            <p className="mt-2 text-sm text-white/56">Reduce friccion y entra directo a tu asset.</p>
                                        </div>
                                        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[11px] text-white/50">
                                            <Activity className="h-3.5 w-3.5 text-red-200/70" />
                                            ultima actividad: {libraryStats.recentTitle}
                                        </div>
                                    </div>

                                    <div className="mt-4 flex flex-col gap-3 md:flex-row">
                                        <label className="flex h-12 flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white/58 transition-colors duration-300 focus-within:border-red-500/24 focus-within:text-white/76">
                                            <Search className="h-4 w-4 text-red-200/70" />
                                            <input
                                                value={query}
                                                onChange={(event) => setQuery(event.target.value)}
                                                placeholder="Buscar por nombre, tipo o rail"
                                                className="h-full flex-1 bg-transparent outline-none placeholder:text-white/28"
                                            />
                                        </label>

                                        <div className="flex flex-wrap gap-2">
                                            <FilterChip active={activeFilter === 'all'} onClick={() => setActiveFilter('all')}>Todo</FilterChip>
                                            <FilterChip active={activeFilter === 'producto'} onClick={() => setActiveFilter('producto')}>Productos</FilterChip>
                                            <FilterChip active={activeFilter === 'servicio'} onClick={() => setActiveFilter('servicio')}>Servicios</FilterChip>
                                            <FilterChip active={activeFilter === 'recent'} onClick={() => setActiveFilter('recent')}>Recientes</FilterChip>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-[2rem] border border-red-400/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02)),radial-gradient(circle_at_top_left,rgba(255,72,72,0.14),transparent_55%)] p-5">
                                    <p className="text-[10px] uppercase tracking-[0.24em] text-white/34">Editorial note</p>
                                    <p className="mt-3 text-lg font-semibold text-white">Tu biblioteca ya no es historial: es un inventario de herramientas activas.</p>
                                    <p className="mt-3 text-sm leading-6 text-white/54">
                                        Cada compra se presenta como asset listo para acceso inmediato, descarga segura y contexto de uso dentro del ecosistema.
                                    </p>
                                </div>
                            </div>

                            {error ? (
                                <div className="rounded-[2rem] border border-red-400/18 bg-red-500/[0.08] px-4 py-3 text-sm text-red-100/82 backdrop-blur-xl">
                                    {error}
                                </div>
                            ) : null}
                        </div>
                    </motion.div>

                    <motion.aside
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.08, ease: 'easeOut' }}
                        className="glass-card border-none p-5 sm:p-6"
                    >
                        <div className="space-y-5">
                            <div className="rounded-[2rem] border border-white/10 bg-black/25 p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.24em] text-white/36">Wallet gateway</p>
                                        <h2 className="mt-2 text-xl font-semibold text-white">Estado de acceso Web3</h2>
                                    </div>
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-400/18 bg-red-500/10 text-red-100/90">
                                        <Wallet className="h-4.5 w-4.5" />
                                    </div>
                                </div>

                                {!address ? (
                                    <div className="mt-5 rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
                                        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/38">
                                            <span className="h-2 w-2 rounded-full bg-amber-300 shadow-[0_0_10px_rgba(252,211,77,0.6)]" />
                                            Gateway inactivo
                                        </div>
                                        <p className="mt-3 text-sm leading-6 text-white/58">
                                            Conecta tu wallet desde la esquina superior derecha para sincronizar las licencias verificadas del contrato y elevar esta biblioteca a modo on-chain.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="mt-5 space-y-3">
                                        <div className="rounded-[1.6rem] border border-emerald-400/14 bg-emerald-500/[0.07] p-4">
                                            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-emerald-100/78">
                                                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.55)]" />
                                                Wallet conectada
                                            </div>
                                            <p className="mt-3 text-sm text-white/72">{address.slice(0, 6)}...{address.slice(-4)}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
                                                <p className="text-[10px] uppercase tracking-[0.2em] text-white/34">Red</p>
                                                <p className="mt-2 text-sm font-semibold text-white">Sepolia</p>
                                            </div>
                                            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
                                                <p className="text-[10px] uppercase tracking-[0.2em] text-white/34">NFTs</p>
                                                <p className="mt-2 text-sm font-semibold text-white">{loadingNfts ? 'Escaneando...' : nfts.length}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-[0.24em] text-white/36">Live collection</p>
                                        <h3 className="mt-2 text-lg font-semibold text-white">Actividad reciente</h3>
                                    </div>
                                    <Activity className="h-4.5 w-4.5 text-red-100/70" />
                                </div>

                                <div className="mt-4 space-y-3">
                                    {recentSwaps.length ? recentSwaps.map((item) => (
                                        <div key={item.id} className="ds-hover-row rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-white/88 line-clamp-1">{item.title}</p>
                                                    <p className="mt-1 text-xs text-white/42">{formatFecha(item.date)} · {item.metodoMeta.label}</p>
                                                </div>
                                                <span className="text-xs font-semibold text-white/68">{item.priceLabel}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="rounded-[1.4rem] border border-white/8 bg-black/20 px-4 py-4 text-sm text-white/45">
                                            Sin actividad reciente todavia.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
                                <p className="text-[10px] uppercase tracking-[0.24em] text-white/36">Protocol notes</p>
                                <div className="mt-4 space-y-3 text-sm text-white/56">
                                    <div className="flex items-center justify-between gap-3 rounded-[1.3rem] border border-white/8 bg-black/20 px-4 py-3">
                                        <span>Acceso principal</span>
                                        <span className="text-white/80">Inmediato</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 rounded-[1.3rem] border border-white/8 bg-black/20 px-4 py-3">
                                        <span>Descarga segura</span>
                                        <span className="text-white/80">Autenticada</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 rounded-[1.3rem] border border-white/8 bg-black/20 px-4 py-3">
                                        <span>Licencias on-chain</span>
                                        <span className="text-white/80">{address ? 'Sincronizadas' : 'Opcionales'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.aside>
                </section>

                {filteredPurchases.length === 0 ? (
                    <section className="glass-card border-none p-10 text-center">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.6rem] border border-white/10 bg-white/[0.04] text-red-100/80">
                            <ShoppingBag className="h-7 w-7" />
                        </div>
                        <h2 className="mt-5 text-2xl font-semibold text-white">No hay assets para este filtro</h2>
                        <p className="mt-3 text-sm text-white/54">Prueba otra categoria o explora el marketplace para ampliar tu vault.</p>
                        <div className="mt-6 flex items-center justify-center gap-3">
                            <button type="button" onClick={() => { setQuery(''); setActiveFilter('all'); }} className="ds-btn-neutral rounded-2xl px-4 py-3">
                                Limpiar filtros
                            </button>
                            <Link to="/" className="btn-live-cta inline-flex">Ir al marketplace</Link>
                        </div>
                    </section>
                ) : (
                    <section className="space-y-5">
                        <div className="flex flex-wrap items-end justify-between gap-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.24em] text-white/34">Inventory grid</p>
                                <h2 className="mt-2 text-2xl font-semibold text-white">Coleccion activa</h2>
                            </div>
                            <p className="text-sm text-white/44">{filteredPurchases.length} asset{filteredPurchases.length !== 1 ? 's' : ''} visibles con acceso premium.</p>
                        </div>

                        <AnimatePresence initial={false} mode="popLayout">
                            <motion.div layout className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
                                {filteredPurchases.map((item, index) => (
                                    <PurchaseCard
                                        key={item.id}
                                        item={item}
                                        index={index}
                                        onAccess={handleAccess}
                                        onDownload={handleDownload}
                                        onDetails={handleDetails}
                                        downloadingId={downloadingId}
                                    />
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </section>
                )}

                <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <div className="glass-card border-none p-6 sm:p-7">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-[10px] uppercase tracking-[0.24em] text-white/34">On-chain vault</p>
                                <h2 className="mt-2 text-2xl font-semibold text-white">Licencias verificadas en blockchain</h2>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-[1.4rem] border border-red-400/16 bg-red-500/10 text-red-100/90">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                        </div>

                        {!address ? (
                            <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
                                <p className="text-sm leading-7 text-white/56">
                                    Tu libreria puede elevarse a modo verificable conectando la wallet desde la esquina superior derecha. Cuando lo hagas, ScriptBay mostrara las licencias NFT detectadas en Sepolia dentro de este vault.
                                </p>
                            </div>
                        ) : loadingNfts ? (
                            <div className="mt-6 flex items-center gap-3 rounded-[2rem] border border-white/10 bg-white/[0.03] px-5 py-5 text-sm text-white/58">
                                <Loader2 className="h-4.5 w-4.5 animate-spin text-red-200/75" />
                                Escaneando la blockchain en busca de tus licencias verificadas...
                            </div>
                        ) : nfts.length === 0 ? (
                            <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 text-sm text-white/52">
                                No se han detectado licencias para {address.slice(0, 6)}...{address.slice(-4)} en este contrato.
                            </div>
                        ) : (
                            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                {nfts.map((nft) => (
                                    <motion.article
                                        key={nft.id}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="ds-card ds-card-l1 ds-grid-card group overflow-hidden"
                                        data-interactive="true"
                                    >
                                        <div className="relative aspect-[0.92/1] overflow-hidden bg-black/40">
                                            <img
                                                src={nft.image}
                                                alt={nft.name}
                                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/20 to-transparent" />
                                            <span className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/74 backdrop-blur-xl">
                                                ERC-721
                                            </span>
                                        </div>
                                        <div className="p-5">
                                            <h3 className="text-lg font-semibold text-white">{nft.name}</h3>
                                            <p className="mt-2 line-clamp-2 text-sm text-white/52">{nft.description}</p>
                                            <a
                                                href={`https://sepolia.etherscan.io/nft/${CONTRACT_ADDRESS}/${nft.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ds-btn-neutral mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                                Ver en Etherscan
                                            </a>
                                        </div>
                                    </motion.article>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="glass-card border-none p-6 sm:p-7">
                        <p className="text-[10px] uppercase tracking-[0.24em] text-white/34">Ecosystem context</p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">Tu capa de uso dentro de ScriptBay</h2>
                        <div className="mt-6 space-y-4">
                            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
                                <p className="text-sm font-semibold text-white">Acceso inmediato</p>
                                <p className="mt-2 text-sm leading-6 text-white/52">Cada asset mantiene una accion principal clara para abrir el workspace correspondiente sin friccion visual ni operativa.</p>
                            </div>
                            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
                                <p className="text-sm font-semibold text-white">Descarga autenticada</p>
                                <p className="mt-2 text-sm leading-6 text-white/52">Las descargas usan la compra como llave de acceso, evitando que esta pagina se sienta como un simple historial administrativo.</p>
                            </div>
                            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-4">
                                <p className="text-sm font-semibold text-white">Identidad consistente</p>
                                <p className="mt-2 text-sm leading-6 text-white/52">El hover sigue siendo neutro y global; la diferenciacion contextual vive solo en pills, labels y acentos controlados.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default MisCompras;
