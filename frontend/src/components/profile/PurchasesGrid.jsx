import React, { useEffect, useState } from 'react';
import { Box, CalendarDays, CheckCircle2, Clock3, Info, PackageOpen, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { buildPurchaseExperience, formatEthPrice, formatEurPrice } from '../../data/purchaseExperience';

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
  if (value === 'completed' || value === 'completado') return 'completed';
  return 'pending';
};

const normalizeType = (type) => {
  const value = String(type || '').toLowerCase();
  return value === 'servicio' ? 'servicio' : 'producto';
};

const getCtaConfig = ({ status, targetProductId, type }) => {
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
    disabled: !targetProductId,
    accessTo: targetProductId ? `/mis-compras/${targetProductId}/acceso` : null,
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
          const status = normalizeStatus(purchase.status);
          const type = normalizeType(purchase.type);
          const statusLabel = status === 'completed' ? 'Activo' : 'Pendiente';
          const typeLabel = type === 'producto' ? 'Producto' : 'Servicio';
          const badgeClass = statusStyles[status] || statusStyles.pending;
          const typeBadgeClass = typeStyles[type] || typeStyles.producto;
          const typeIcon = type === 'servicio'
            ? <Zap className="h-3.5 w-3.5" />
            : <Box className="h-3.5 w-3.5" />;
          const targetProductId = purchase.productId || purchase.idProducto || purchase.product_id;
          const cta = getCtaConfig({ status, targetProductId, type });
          const accessLabel = getAccessLabel({ status, type });
          const isService = type === 'servicio';
          const purchaseExperience = buildPurchaseExperience({ ...purchase, productId: targetProductId, type });
          const formattedDate = formatDate(purchase.date);
          const daysSince = getDaysSince(purchase.date);
          const cardToneClass = isService
            ? 'hover:border-blue-500/45 hover:shadow-[0_24px_55px_-20px_rgba(59,130,246,0.55),0_4px_20px_rgba(59,130,246,0.12)]'
            : 'hover:border-purple-500/45 hover:shadow-[0_24px_55px_-20px_rgba(168,85,247,0.55),0_4px_20px_rgba(168,85,247,0.12)]';
          const titleToneClass = isService ? 'group-hover:text-blue-200' : 'group-hover:text-purple-200';
          const ctaToneClass = isService
            ? 'border-blue-400/60 bg-blue-500/25 text-white hover:border-blue-300/80 hover:bg-blue-500/40 hover:shadow-[0_0_18px_rgba(59,130,246,0.40)]'
            : 'border-purple-400/60 bg-purple-500/25 text-white hover:border-purple-300/80 hover:bg-purple-500/40 hover:shadow-[0_0_18px_rgba(168,85,247,0.40)]';
          const statusIcon = status === 'completed'
            ? <CheckCircle2 className="h-3.5 w-3.5" />
            : <Clock3 className="h-3.5 w-3.5" />;
          const isLoading = loadingId === purchase.id;

          return (
            <motion.article
              key={purchase.id}
              initial={{ opacity: 0, y: 16 }}
              animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.99 }}
              className={`surface-card group relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-zinc-950/90 via-zinc-900/75 to-black/85 backdrop-blur-lg transition-all duration-300 ease-out hover:from-zinc-900/95 hover:via-zinc-900/85 hover:to-black/90 ${cardToneClass}`}
              style={{ transitionDelay: `${index * 55}ms` }}
            >
              {/* Imagen */}
              <div className="relative h-48 overflow-hidden bg-black">
                <img
                  src={purchase.image}
                  alt={purchase.title}
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
                <h4 className={`line-clamp-2 text-base font-semibold leading-snug text-zinc-100 transition-colors duration-200 ${titleToneClass}`}>
                  {purchase.title}
                </h4>

                {/* Precio + acceso */}
                <div className="flex items-end justify-between gap-2">
                  <p className={`text-2xl font-bold tracking-tight ${isService ? 'text-blue-300' : 'text-purple-300'}`}>
                    {formatEurPrice(purchase.price)}
                  </p>
                  <span className="text-[11px] font-medium text-zinc-500 tracking-wide">{accessLabel}</span>
                </div>
                <p className="-mt-2 text-[11px] font-medium tracking-wide text-zinc-500">{formatEthPrice(purchase.price)}</p>

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
                        setLoadingId(purchase.id);
                        window.setTimeout(() => {
                          navigate(cta.accessTo, {
                            state: {
                              from: '/profile?view=compras',
                              fromLabel: 'Volver a mis compras',
                              purchase: {
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
                      className={`w-full rounded-xl border px-4 py-2.5 text-center text-sm font-semibold transition-all duration-200 ease-out active:scale-[0.97] ${ctaToneClass}`}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Abriendo...' : cta.label}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigate(cta.detailsTo, {
                          state: {
                            from: '/profile?view=compras',
                            fromLabel: 'Volver a mis compras',
                            purchase: {
                              ...purchase,
                              productId: targetProductId,
                              type,
                              experience: purchaseExperience
                            }
                          }
                        });
                      }}
                      className={`inline-flex items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-xs font-medium text-zinc-400 transition-all duration-200 active:scale-[0.97] ${isService ? 'hover:border-blue-400/35 hover:bg-blue-500/10 hover:text-blue-200' : 'hover:border-purple-400/35 hover:bg-purple-500/10 hover:text-purple-200'}`}
                    >
                      <Info className="h-3.5 w-3.5" />
                      <span className="ml-1">Ver detalles</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="mt-auto w-full cursor-not-allowed rounded-xl border border-zinc-700/60 bg-zinc-800/40 px-4 py-2.5 text-sm font-semibold text-zinc-500"
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
