import React, { useEffect, useState } from 'react';
import { Box, CalendarDays, CheckCircle2, Clock3, Info, PackageOpen, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { buildPurchaseExperience, formatEthPrice, formatEurPrice } from '../../data/purchaseExperience';
import { normalizeImageUrl } from '../../utils/imageUrl';

export const mockPurchases = [
  {
    id: 1,
    productId: 27,
    title: 'Bot de trading automatico',
    price: '€249',
    date: '2026-05-01',
    status: 'completed',
    type: 'producto',
    image: 'https://picsum.photos/seed/trading-bot/800/500'
  },
  {
    id: 2,
    productId: 6,
    title: 'Script automatizacion Discord',
    price: '€79',
    date: '2026-04-28',
    status: 'pending',
    type: 'servicio',
    image: 'https://picsum.photos/seed/discord-script/800/500'
  },
  {
    id: 3,
    productId: 38,
    title: 'Pack prompts IA para ventas',
    price: '€39',
    date: '2026-04-22',
    status: 'completed',
    type: 'producto',
    image: 'https://picsum.photos/seed/prompt-pack/800/500'
  },
  {
    id: 4,
    productId: 3,
    title: 'Plantilla SaaS dashboard React',
    price: '€109',
    date: '2026-04-18',
    status: 'completed',
    type: 'producto',
    image: 'https://picsum.photos/seed/saas-template/800/500'
  },
  {
    id: 5,
    productId: 11,
    title: 'Automatizacion scraping de leads',
    price: '€139',
    date: '2026-04-15',
    status: 'pending',
    type: 'servicio',
    image: 'https://picsum.photos/seed/leads-scraper/800/500'
  },
  {
    id: 6,
    productId: 10,
    title: 'Plugin Notion API workflows',
    price: '€59',
    date: '2026-04-10',
    status: 'completed',
    type: 'servicio',
    image: 'https://picsum.photos/seed/notion-plugin/800/500'
  },
  {
    id: 7,
    productId: 25,
    title: 'Pack UI neon components',
    price: '€89',
    date: '2026-04-06',
    status: 'pending',
    type: 'producto',
    image: 'https://picsum.photos/seed/neon-ui-kit/800/500'
  },
  {
    id: 8,
    productId: 23,
    title: 'Sistema de facturacion Stripe',
    price: '€199',
    date: '2026-03-30',
    status: 'completed',
    type: 'servicio',
    image: 'https://picsum.photos/seed/stripe-billing/800/500'
  }
];

const statusStyles = {
  completed: 'bg-emerald-500/50 text-white border border-emerald-300/60 shadow-lg shadow-emerald-500/20 backdrop-blur-lg [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]',
  pending:   'bg-amber-500/45  text-white border border-amber-300/60  shadow-lg shadow-amber-500/20  backdrop-blur-lg [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]'
};

const typeStyles = {
  producto: 'bg-purple-500/50 text-white border border-purple-300/60 shadow-lg shadow-purple-500/25 backdrop-blur-lg saturate-150 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]',
  servicio: 'bg-blue-500/50   text-white border border-blue-300/60   shadow-lg shadow-blue-500/25   backdrop-blur-lg saturate-150 [text-shadow:0_1px_3px_rgba(0,0,0,0.5)]'
};

const normalizeStatus = (status) => {
  const value = String(status || '').toLowerCase();
  if (value.includes('pending') || value.includes('pendient') || value.includes('proces')) return 'pending';
  return 'completed';
};

const normalizeType = (type) => {
  const value = String(type || '').toLowerCase();
  return value === 'servicio' ? 'servicio' : 'producto';
};

const getCtaConfig = ({ status, targetProductId, purchaseId, type }) => {
  if (status === 'pending') {
    return {
      label: 'Procesando pago',
      disabled: true,
      accessTo: null,
      detailsTo: null
    };
  }

  return {
    label: type === 'servicio' ? 'Ver servicio' : 'Acceder',
    disabled: !targetProductId && !purchaseId,
    accessTo: targetProductId
      ? `/mis-compras/${targetProductId}/acceso`
      : purchaseId
        ? `/mis-compras/compra/${purchaseId}/acceso`
        : null,
    detailsTo: targetProductId ? `/producto/${targetProductId}` : null
  };
};

const getAccessLabel = ({ status, type }) => {
  if (status === 'pending') return 'En procesamiento';
  if (type === 'servicio') return 'Acceso habilitado';
  return 'Licencia válida';
};

const formatDate = (isoDate) => {
  try {
    return new Date(isoDate).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return isoDate;
  }
};

const getDaysSince = (isoDate) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  return days;
};

const PurchasesGrid = ({ purchases = mockPurchases }) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  if (!purchases.length) {
    return (
      <section
        className={`rounded-2xl border border-red-500/20 bg-gradient-to-br from-zinc-950/85 via-zinc-900/80 to-black/85 backdrop-blur-lg p-8 text-center transition-all duration-500 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}
      >
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/30 bg-red-500/10">
          <PackageOpen className="h-6 w-6 text-red-300" />
        </div>
        <h3 className="text-lg font-semibold text-zinc-100">Aun no tienes compras</h3>
        <p className="mt-2 text-sm text-zinc-400">
          Cuando compres productos o servicios, apareceran aqui.
        </p>
      </section>
    );
  }

  return (
    <section
      className={`transition-all duration-500 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
      }`}
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {purchases.map((purchase, index) => {
          const normalizedPurchase = {
            id: purchase.id ?? index + 1,
            title: purchase.title || purchase.titulo || 'Compra',
            price: purchase.price ?? purchase.precio ?? 0,
            date: purchase.date || purchase.created_at || new Date().toISOString(),
            status: purchase.status || purchase.estado || purchase.estado_pago || 'completed',
            type: purchase.type || purchase.productos?.tipo || 'producto',
            image: normalizeImageUrl(purchase.image || purchase.productos?.imagen || '') || `https://picsum.photos/seed/purchase-${purchase.id || index}/800/500`
          };

          const status = normalizeStatus(normalizedPurchase.status);
          const type = normalizeType(normalizedPurchase.type);
          const statusLabel = status === 'completed' ? 'Activo' : 'Pendiente';
          const typeLabel = type === 'producto' ? 'Producto' : 'Servicio';
          const badgeClass = statusStyles[status] || statusStyles.pending;
          const typeBadgeClass = typeStyles[type] || typeStyles.producto;
          const typeIcon = type === 'servicio'
            ? <Zap className="h-3.5 w-3.5" />
            : <Box className="h-3.5 w-3.5" />;
          const targetProductId = purchase.productId || purchase.idProducto || purchase.product_id || purchase.producto_id;
          const cta = getCtaConfig({ status, targetProductId, purchaseId: normalizedPurchase.id, type });
          const accessLabel = getAccessLabel({ status, type });
          const isService = type === 'servicio';
          const purchaseExperience = buildPurchaseExperience({ ...normalizedPurchase, ...purchase, productId: targetProductId, type });
          const formattedDate = formatDate(normalizedPurchase.date);
          const daysSince = getDaysSince(normalizedPurchase.date);
          const titleToneClass = 'group-hover:text-zinc-100';
          const statusIcon = status === 'completed'
            ? <CheckCircle2 className="h-3.5 w-3.5" />
            : <Clock3 className="h-3.5 w-3.5" />;
          const isLoading = loadingId === purchase.id;

          return (
            <motion.article
              key={normalizedPurchase.id}
              initial={{ opacity: 0, y: 16 }}
              animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.99 }}
              className="ds-card ds-card-l1 ds-grid-card group relative flex h-full flex-col overflow-hidden"
              data-interactive="true"
              style={{ transitionDelay: `${index * 55}ms` }}
            >
              {/* Imagen */}
                <div className="relative h-48 overflow-hidden bg-zinc-100 dark:bg-black">
                <img
                  src={normalizedPurchase.image}
                  alt={normalizedPurchase.title}
                  className="h-full w-full object-cover transition-all duration-500 group-hover:scale-[1.04] group-hover:brightness-110"
                  loading="lazy"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-85" />
                {/* Tag tipo — glassmorphism mejorado */}
                <div className="absolute left-3 top-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide ${typeBadgeClass}`}>
                    {typeIcon}
                    {typeLabel}
                  </span>
                </div>
                {/* Badge estado sobre imagen */}
                <div className="absolute right-3 top-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass}`}>
                    {statusIcon}
                    {statusLabel}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-3 p-5">
                {/* Título */}
                <h4 className={`line-clamp-2 text-base font-semibold leading-snug text-base-primary transition-colors duration-200 ${titleToneClass}`}>
                  {normalizedPurchase.title}
                </h4>

                {/* Precio + acceso */}
                <div className="flex items-end justify-between gap-2">
                  <p className="text-2xl font-bold tracking-tight text-base-primary">
                    {formatEurPrice(normalizedPurchase.price)}
                  </p>
                  <span className="text-[11px] font-medium text-zinc-500 tracking-wide">{accessLabel}</span>
                </div>
                <p className="-mt-2 text-[11px] font-medium tracking-wide text-zinc-500">{formatEthPrice(normalizedPurchase.price)}</p>

                {/* Fecha */}
                <p className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                  {formattedDate}{daysSince !== null && status === 'completed' ? ` · hace ${daysSince}d` : ''}
                </p>

                {!cta.disabled && cta.accessTo ? (
                  <div className="mt-auto grid grid-cols-[1fr_auto] gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setLoadingId(normalizedPurchase.id);
                        window.setTimeout(() => {
                          navigate(cta.accessTo, {
                            state: {
                              from: '/profile?view=compras',
                              fromLabel: 'Volver a mis compras',
                              purchase: {
                                ...normalizedPurchase,
                                ...purchase,
                                productId: targetProductId,
                                type,
                                experience: purchaseExperience
                              }
                            }
                          });
                          setLoadingId(null);
                        }, 260);
                      }}
                      className="ds-btn-neutral w-full rounded-xl px-4 py-2.5 text-center text-sm font-semibold active:scale-[0.97]"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Abriendo...' : cta.label}
                    </button>
                    {cta.detailsTo && (
                      <button
                        type="button"
                        onClick={() => {
                          navigate(cta.detailsTo, {
                            state: {
                              from: '/profile?view=compras',
                              fromLabel: 'Volver a mis compras',
                              purchase: {
                                ...normalizedPurchase,
                                ...purchase,
                                productId: targetProductId,
                                type,
                                experience: purchaseExperience
                              }
                            }
                          });
                        }}
                        className="ds-btn-neutral inline-flex items-center justify-center px-3 py-2.5 text-xs font-medium text-zinc-200 active:scale-[0.97]"
                      >
                        <Info className="h-3.5 w-3.5" />
                        <span className="ml-1">Ver detalles</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="mt-auto w-full cursor-not-allowed rounded-xl border border-zinc-700/60 bg-zinc-800/30 px-4 py-2.5 text-sm font-semibold text-zinc-500"
                  >
                    {cta.label}
                  </button>
                )}
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
};

export default PurchasesGrid;
