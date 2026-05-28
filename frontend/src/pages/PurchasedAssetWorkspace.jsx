import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Bot,
  Box,
  CheckCircle2,
  Clock3,
  Copy,
  Download,
  ExternalLink,
  FileCode2,
  GraduationCap,
  KeyRound,
  Layers3,
  Loader2,
  Play,
  ShieldCheck,
  Sparkles,
  Upload,
  Workflow,
} from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { findPurchaseByProductId, buildPurchaseExperience } from '../data/purchaseExperience';
import { mockPurchases } from '../components/profile/PurchasesGrid';
import { getValidSession } from '../services/authClient';
import { apiUrl } from '../services/apiBase';

const iconByMode = {
  bot: Bot,
  plugin: KeyRound,
  prompt: Sparkles,
  automation: Workflow,
  education: GraduationCap,
  asset: Box,
};

const dataUrlToBlob = (dataUrl) => {
  try {
    const [meta, base64] = String(dataUrl).split(',');
    const mime = /data:([^;]+)/.exec(meta || '')?.[1] || 'application/octet-stream';
    const limpio = (base64 || '').replace(/\s/g, '');
    const bin = atob(limpio);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  } catch {
    return null;
  }
};

// Decodificacion robusta: usa el parser nativo del navegador (sirve para data URLs
// y tambien para URLs http normales) si el metodo manual falla.
const resolverBlob = async (archivo) => {
  const manual = dataUrlToBlob(archivo);
  if (manual && manual.size > 0) return manual;
  try {
    const res = await fetch(archivo);
    const blob = await res.blob();
    return blob && blob.size > 0 ? blob : null;
  } catch {
    return null;
  }
};

const extensionPorMime = (mime) => {
  const map = {
    'application/zip': 'zip',
    'application/x-zip-compressed': 'zip',
    'application/json': 'json',
    'application/pdf': 'pdf',
    'text/plain': 'txt',
    'text/javascript': 'js',
    'text/x-python': 'py',
    'application/x-tar': 'tar',
    'application/gzip': 'gz',
    'application/octet-stream': 'bin',
  };
  return map[mime] || 'bin';
};

const SectionCard = ({ title, subtitle, icon: Icon, children, className = '', hoverClass = '' }) => (
  <div className={`rounded-[24px] border border-white/10 bg-gradient-to-br from-zinc-950/92 via-zinc-900/84 to-black/88 p-5 transition-all duration-200 hover:-translate-y-[2px] ${hoverClass} ${className}`}>
    <div className="mb-4 flex items-start justify-between gap-3">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">{subtitle}</p>
        <h2 className="mt-1 text-lg font-semibold text-zinc-100">{title}</h2>
      </div>
      {Icon && <Icon className="h-4 w-4 text-zinc-300" />}
    </div>
    {children}
  </div>
);

const QuickStartTimeline = ({ accent }) => {
  const steps = [
    { id: 1, icon: Download, title: 'Descargar paquete', desc: 'Baja el bundle principal y valida checksum.' },
    { id: 2, icon: KeyRound, title: 'Configurar variables', desc: 'Completa env.example con credenciales y endpoints.' },
    { id: 3, icon: Play, title: 'Ejecutar instalación', desc: 'Lanza install.sh y verifica logs de inicialización.' },
    { id: 4, icon: BookOpen, title: 'Leer documentación', desc: 'Revisa guía técnica y runbook de despliegue.' },
  ];

  return (
    <div className="space-y-3">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isLast = idx === steps.length - 1;
        return (
          <div key={step.id} className={`relative rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition-all duration-200 ${accent.rowHover}`}>
            {!isLast && (
              <span className={`absolute left-[27px] top-[46px] h-8 w-px ${accent.line}`} aria-hidden="true" />
            )}
            <div className="flex items-start gap-3">
              <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-xs font-bold ${accent.softBadge}`}>
                {step.id}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${accent.icon}`} />
                  <p className="text-sm font-semibold text-zinc-100">{step.title}</p>
                </div>
                <p className="mt-1 text-xs text-zinc-400">{step.desc}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const PurchasedAssetWorkspace = () => {
  const { id, compraId } = useParams();
  const location = useLocation();

  const [descargando, setDescargando] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState(null);
  const [copiadoAcceso, setCopiadoAcceso] = useState(false);

  const purchaseId = compraId || location.state?.purchase?.id || null;
  const purchase = location.state?.purchase || findPurchaseByProductId(mockPurchases, id) || {
    id,
    productId: id,
    title: 'Asset desbloqueado',
    price: '149 EUR',
    date: new Date().toISOString().slice(0, 10),
    type: 'producto',
    status: 'completed',
    image: `https://picsum.photos/seed/workspace-${id}/1200/900`,
  };

  const isService = ['servicio', 'service'].includes(String(purchase.type || '').toLowerCase());
  const backTarget = location.state?.from || '/profile?view=compras';
  const backLabel = location.state?.fromLabel || 'Volver a mis compras';
  const dashboardTarget = purchase.productId ? `/producto/${purchase.productId}` : null;
  const documentationUrl = purchase.docsUrl || null;

  const experience = purchase.experience || buildPurchaseExperience(purchase);
  const AccentIcon = iconByMode[experience.mode] || Box;

  const accessCode = `SB-${String(purchase.id || purchase.productId || 'ACCESS').slice(0, 8).toUpperCase()}`;

  const accent = useMemo(() => {
    if (isService) {
      return {
        border: 'border-blue-400/25',
        glow: 'shadow-[0_22px_60px_-30px_rgba(59,130,246,0.55)]',
        softBadge: 'border-blue-400/40 bg-blue-500/15 text-blue-200',
        icon: 'text-blue-300',
        line: 'bg-blue-400/35',
        cta: 'border-blue-400/55 bg-blue-500/30 text-white hover:bg-blue-500/45 hover:shadow-[0_0_24px_rgba(59,130,246,0.55)]',
        ctaGhost: 'border-blue-400/35 bg-blue-500/12 text-blue-100 hover:bg-blue-500/20',
        rowHover: 'hover:border-blue-400/40 hover:bg-blue-500/[0.08]',
      };
    }

    return {
      border: 'border-purple-400/25',
      glow: 'shadow-[0_22px_60px_-30px_rgba(168,85,247,0.55)]',
      softBadge: 'border-purple-400/40 bg-purple-500/15 text-purple-200',
      icon: 'text-purple-300',
      line: 'bg-purple-400/35',
      cta: 'border-purple-400/55 bg-purple-500/30 text-white hover:bg-purple-500/45 hover:shadow-[0_0_24px_rgba(168,85,247,0.55)]',
      ctaGhost: 'border-purple-400/35 bg-purple-500/12 text-purple-100 hover:bg-purple-500/20',
      rowHover: 'hover:border-purple-400/40 hover:bg-purple-500/[0.08]',
    };
  }, [isService]);

  const resources = [
    {
      id: 'source',
      icon: FileCode2,
      name: 'source.zip',
      desc: 'Código fuente principal listo para setup',
      size: isService ? '1.8 MB' : '2.4 MB',
      downloadable: true,
    },
    {
      id: 'readme',
      icon: BookOpen,
      name: 'README.md',
      desc: 'Documentación técnica de instalación',
      size: '18 KB',
      downloadable: false,
    },
    {
      id: 'env',
      icon: KeyRound,
      name: 'env.example',
      desc: 'Plantilla de variables de entorno',
      size: '2 KB',
      downloadable: false,
    },
    {
      id: 'install',
      icon: Activity,
      name: 'install.sh',
      desc: 'Script de instalación inicial',
      size: '6 KB',
      downloadable: false,
    },
  ];

  const compat = [
    { label: 'React', icon: Sparkles },
    { label: 'Node.js', icon: Bot },
    { label: 'Next.js', icon: Layers3 },
    { label: 'Docker', icon: Box },
    { label: 'API Ready', icon: Workflow },
    { label: 'PostgreSQL', icon: Upload },
  ];

  const technicalRows = [
    { label: 'Acceso', value: 'Activo' },
    { label: 'Soporte', value: 'Incluido' },
    { label: 'Licencia', value: 'Digital verificable' },
    { label: 'Actualizaciones', value: 'Habilitadas' },
  ];

  const docsRows = [
    {
      title: 'Setup rápido',
      value: 'npm install && npm run dev',
    },
    {
      title: 'Requisitos',
      value: 'Node 18+, acceso API, variables ENV',
    },
    {
      title: 'Variables ENV',
      value: 'API_KEY, API_URL, JWT_SECRET',
    },
    {
      title: 'Dependencias',
      value: 'axios, zod, dotenv, react-query',
    },
    {
      title: 'Changelog',
      value: 'v2.1.0: mejoras de rendimiento y auth',
    },
    {
      title: 'Integraciones',
      value: 'REST API, webhook, OAuth2',
    },
  ];

  const handleDescargar = async () => {
    setDescargando(true);
    setErrorDescarga(null);

    try {
      const session = await getValidSession();
      if (!session?.accessToken) throw new Error('Sesion expirada');

      const downloadPath = purchase.productId || id
        ? `/api/productos/DescargarArchivo/${purchase.productId || id}`
        : `/api/productos/DescargarArchivoCompra/${purchaseId}`;

      const res = await fetch(apiUrl(downloadPath), {
        headers: { Authorization: `Bearer ${session.accessToken}` },
      });
      const data = await res.json();

      if (data.codigo !== 0) throw new Error(data.mensaje || 'No se pudo descargar el archivo');
      if (!data.archivo) throw new Error('El producto no tiene archivo asociado');

      const blob = await resolverBlob(data.archivo);
      if (!blob) throw new Error('El archivo guardado no es válido. Pide al vendedor que vuelva a subir el producto con el fichero.');

      const ext = extensionPorMime(blob.type);
      const safeName = (data.titulo || purchase.title || 'producto').replace(/[^a-z0-9\-_]+/gi, '_');

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1200);
    } catch (err) {
      setErrorDescarga(err.message || 'No se pudo completar la descarga');
    } finally {
      setDescargando(false);
    }
  };

  const copyAccess = async () => {
    try {
      await navigator.clipboard.writeText(accessCode);
      setCopiadoAcceso(true);
      setTimeout(() => setCopiadoAcceso(false), 1300);
    } catch {
      setErrorDescarga('No se pudo copiar el código de acceso');
    }
  };

  return (
    <section className="min-h-screen px-6 pb-20 pt-28">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className="space-y-6"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <Link to={backTarget} className="btn-secondary text-sm inline-flex">
                <ArrowLeft className="h-4 w-4" /> {backLabel}
              </Link>
              <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
                Mis compras &gt; <span className="text-zinc-200">{purchase.title}</span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDescargar}
                disabled={descargando}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all disabled:opacity-60 ${accent.ctaGhost}`}
              >
                {descargando ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                Descargar
              </button>

              <Link
                to={dashboardTarget || '#'}
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${dashboardTarget ? accent.ctaGhost : 'pointer-events-none border-white/10 bg-white/[0.03] text-zinc-500'}`}
              >
                <ExternalLink className="h-3.5 w-3.5" /> Abrir dashboard
              </Link>

              <a
                href={documentationUrl || '#'}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${documentationUrl ? accent.ctaGhost : 'pointer-events-none border-white/10 bg-white/[0.03] text-zinc-500'}`}
              >
                <BookOpen className="h-3.5 w-3.5" /> Documentacion
              </a>

              <button
                type="button"
                onClick={copyAccess}
                className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-200 transition-all hover:bg-white/[0.08]"
              >
                <Copy className="h-3.5 w-3.5" /> {copiadoAcceso ? 'Copiado' : 'Copiar acceso'}
              </button>
            </div>
          </div>

          <div className={`relative overflow-hidden rounded-[28px] border bg-gradient-to-br from-zinc-950/95 via-zinc-900/88 to-black/90 p-6 md:p-8 transition-all duration-300 hover:-translate-y-[2px] ${accent.border} ${accent.glow}`}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,26,26,0.16),transparent_38%)]" />
            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl border bg-white/[0.05] text-zinc-100 ${accent.border}`}>
                    <AccentIcon className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-50 md:text-4xl">{purchase.title}</h1>
                    <p className="max-w-2xl text-sm leading-7 text-zinc-400">{experience.accessDescription}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                        <CheckCircle2 className="h-3 w-3" /> Activo
                      </span>
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-zinc-200">v2.1.0</span>
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold text-zinc-300">
                        Ultima actualizacion: {experience.mintedAt && experience.mintedAt !== '—' ? experience.mintedAt : 'reciente'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-200 ${accent.rowHover}`}>
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">Archivos incluidos</p>
                    <p className="mt-2 text-lg font-semibold text-zinc-100">{resources.length}</p>
                  </div>
                  <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-200 ${accent.rowHover}`}>
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">Tecnologias</p>
                    <p className="mt-2 text-lg font-semibold text-zinc-100">{isService ? 5 : 6}</p>
                  </div>
                  <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-200 ${accent.rowHover}`}>
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">Tamano total</p>
                    <p className="mt-2 text-lg font-semibold text-zinc-100">{isService ? '1.8 MB' : '2.4 MB'}</p>
                  </div>
                  <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-200 ${accent.rowHover}`}>
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">Compatibilidad</p>
                    <p className="mt-2 text-lg font-semibold text-zinc-100">{isService ? 'Service/API' : 'Web/App/API'}</p>
                  </div>
                </div>
              </div>

              <SectionCard title="Acceso tecnico" subtitle="Workspace privado" icon={ShieldCheck} className="h-fit" hoverClass={accent.rowHover}>
                <div className="space-y-2 text-sm text-zinc-300">
                  <div className={`flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 transition-all duration-200 ${accent.rowHover}`}>
                    <span className="text-zinc-500">Codigo acceso</span>
                    <span className="font-mono text-zinc-100">{accessCode}</span>
                  </div>
                  <div className={`flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 transition-all duration-200 ${accent.rowHover}`}>
                    <span className="text-zinc-500">Licencia</span>
                    <span>Activa</span>
                  </div>
                  <div className={`flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 transition-all duration-200 ${accent.rowHover}`}>
                    <span className="text-zinc-500">Soporte</span>
                    <span>Incluido</span>
                  </div>
                  <div className={`flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 transition-all duration-200 ${accent.rowHover}`}>
                    <span className="text-zinc-500">Ultima sync</span>
                    <span>{experience.transferDays}d</span>
                  </div>
                  <div className={`flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 transition-all duration-200 ${accent.rowHover}`}>
                    <span className="text-zinc-500">Build</span>
                    <span>stable-2.1.0</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={isService ? undefined : handleDescargar}
                  className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${accent.cta}`}
                >
                  {isService ? <ExternalLink className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                  {isService ? 'Abrir dashboard' : 'Descargar pack'}
                </button>
              </SectionCard>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
            <div className="space-y-5">
              <SectionCard title="Recursos incluidos" subtitle="Archivos del paquete" icon={Layers3} hoverClass={accent.rowHover}>
                <div className="space-y-2">
                  {resources.map((resource) => {
                    const Icon = resource.icon;
                    return (
                      <div
                        key={resource.id}
                        className={`flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 transition-all ${accent.rowHover}`}
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <div className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${accent.softBadge}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-zinc-100">{resource.name}</p>
                            <p className="text-xs text-zinc-400">{resource.desc}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-zinc-400">{resource.size}</span>
                          <button
                            type="button"
                            onClick={resource.downloadable ? handleDescargar : undefined}
                            disabled={!resource.downloadable || descargando}
                            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${resource.downloadable ? accent.ctaGhost : 'border-white/10 bg-white/[0.03] text-zinc-500'}`}
                          >
                            {resource.downloadable ? 'Descargar' : 'Incluido'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

              <SectionCard title="Documentacion / info tecnica" subtitle="Panel tecnico" icon={FileCode2} hoverClass={accent.rowHover}>
                <div className="grid gap-3 md:grid-cols-2">
                  {docsRows.map((row) => (
                    <div key={row.title} className={`rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-all duration-200 ${accent.rowHover}`}>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">{row.title}</p>
                      <p className="mt-1 text-sm text-zinc-200">{row.value}</p>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>

            <div className="space-y-5">
              <SectionCard title="Compatibilidad" subtitle="Stack soportado" icon={Workflow} hoverClass={accent.rowHover}>
                <div className="grid grid-cols-2 gap-2">
                  {compat.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div key={item.label} className={`flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 transition-all ${accent.rowHover}`}>
                        <Icon className={`h-4 w-4 ${accent.icon}`} />
                        <span className="text-xs font-semibold text-zinc-100">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              </SectionCard>

              <SectionCard title="Quick Start" subtitle="Onboarding tecnico" icon={Play} hoverClass={accent.rowHover}>
                <QuickStartTimeline accent={accent} />
              </SectionCard>

              <SectionCard title="Accesos y licencia" subtitle="Estado" icon={CheckCircle2} hoverClass={accent.rowHover}>
                <div className="space-y-2 text-sm text-zinc-200">
                  {technicalRows.map((row) => (
                    <div key={row.label} className={`flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 transition-all duration-200 ${accent.rowHover}`}>
                      <span className="text-zinc-500">{row.label}</span>
                      <span>{row.value}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
          </div>

          {errorDescarga && (
            <p className="rounded-xl border border-red-400/35 bg-red-500/10 px-3 py-2 text-xs text-red-200">{errorDescarga}</p>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default PurchasedAssetWorkspace;
