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
  FileCode2,
  GraduationCap,
  KeyRound,
  Layers3,
  Play,
  ShieldCheck,
  Sparkles,
  Upload,
  Workflow
} from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { findPurchaseByProductId, buildPurchaseExperience, formatEurPrice } from '../data/purchaseExperience';
import { mockPurchases } from '../components/profile/PurchasesGrid';

const iconByMode = {
  bot: Bot,
  plugin: KeyRound,
  prompt: Sparkles,
  automation: Workflow,
  education: GraduationCap,
  asset: Box
};

const actionIconMap = {
  play: Play,
  workflow: Workflow,
  copy: Copy,
  download: Download,
  book: BookOpen,
  history: Clock3,
  preview: Layers3,
  upload: Upload,
  check: CheckCircle2,
  key: KeyRound
};

const MetricGrid = ({ items }) => (
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {items.map((metric) => (
      <div key={metric.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">{metric.label}</p>
        <p className="mt-2 text-lg font-semibold text-zinc-100">{metric.value}</p>
        <p className="mt-1 text-xs text-zinc-500">{metric.meta}</p>
      </div>
    ))}
  </div>
);

const ActionGrid = ({ actions, panelHoverClass }) => (
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
    {actions.map((action) => {
      const Icon = actionIconMap[action.iconKey] || Sparkles;
      return (
        <button
          key={action.label}
          type="button"
          className={`inline-flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left transition-all duration-200 ${panelHoverClass}`}
        >
          <div>
            <p className="text-sm font-medium text-zinc-100">{action.label}</p>
            <p className="mt-1 text-xs text-zinc-500">{action.meta}</p>
          </div>
          <Icon className="h-4 w-4 text-zinc-300" />
        </button>
      );
    })}
  </div>
);

const Panel = ({ title, subtitle, children, className = '' }) => (
  <div className={`rounded-[24px] border border-white/10 bg-gradient-to-br from-zinc-950/90 via-zinc-900/80 to-black/85 p-5 ${className}`}>
    <div className="mb-5">
      <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">{subtitle}</p>
      <h2 className="mt-2 text-xl font-semibold text-zinc-100">{title}</h2>
    </div>
    {children}
  </div>
);

const KeyValueRows = ({ rows }) => (
  <div className="space-y-3">
    {rows.map((row) => (
      <div key={row.label} className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
        <span className="text-sm text-zinc-400">{row.label}</span>
        <span className="text-sm font-medium text-zinc-100">{row.value}</span>
      </div>
    ))}
  </div>
);

const EventRows = ({ rows }) => (
  <div className="space-y-3">
    {rows.map((row) => (
      <div key={row.label} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-100">{row.label}</p>
            <p className="text-xs text-zinc-500">{row.meta}</p>
          </div>
          <span className="text-sm text-zinc-300">{row.value}</span>
        </div>
      </div>
    ))}
  </div>
);

const SimpleRows = ({ rows }) => (
  <div className="space-y-3">
    {rows.map((row) => (
      <div key={row.label} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
        <p className="text-sm font-medium text-zinc-100">{row.label}</p>
        <p className="mt-1 text-xs text-zinc-500">{row.meta}</p>
      </div>
    ))}
  </div>
);

const ChipGroup = ({ title, items }) => (
  <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
    <p className="text-sm font-medium text-zinc-100">{title}</p>
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-zinc-300">
          {item}
        </span>
      ))}
    </div>
  </div>
);

const CodeBlock = ({ title, code }) => (
  <div className="rounded-2xl border border-white/8 bg-black/30 p-4">
    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-100">
      <FileCode2 className="h-4 w-4" />
      {title}
    </div>
    <pre className="overflow-x-auto text-xs leading-6 text-zinc-300">
      <code>{code}</code>
    </pre>
  </div>
);

const RuntimeWorkspace = ({ experience, panelHoverClass }) => (
  <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
    <Panel title="Que incluye" subtitle="Uso real">
      <KeyValueRows rows={experience.runtime.highlights} />
    </Panel>
    <Panel title="Configuracion rapida" subtitle="Primeros pasos">
      <KeyValueRows rows={experience.runtime.setup} />
    </Panel>
    <Panel title="Integraciones" subtitle="Conectividad" className={panelHoverClass}>
      <KeyValueRows rows={experience.runtime.integrations} />
    </Panel>
  </div>
);

const ToolkitWorkspace = ({ experience, panelHoverClass }) => (
  <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
    <Panel title="Quick setup" subtitle="Instalacion">
      <KeyValueRows rows={experience.toolkit.setup} />
    </Panel>
    <Panel title="Endpoints disponibles" subtitle="Referencia">
      <SimpleRows rows={experience.toolkit.endpoints} />
    </Panel>
    <Panel title="Snippet base" subtitle="Integracion" className={panelHoverClass}>
      <CodeBlock title={experience.toolkit.snippet.title} code={experience.toolkit.snippet.code} />
    </Panel>
    <div className="grid gap-5">
      <Panel title="Compatibilidad" subtitle="Entorno">
        <KeyValueRows rows={experience.toolkit.compatibility} />
      </Panel>
      <Panel title="Changelog" subtitle="Versiones">
        <EventRows rows={experience.toolkit.changelog} />
      </Panel>
    </div>
  </div>
);

const LibraryWorkspace = ({ experience, panelHoverClass }) => (
  <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
    <Panel title="Preview del contenido" subtitle="Coleccion">
      <EventRows rows={experience.library.previews} />
    </Panel>
    <div className="grid gap-5">
      <Panel title="Categorias" subtitle="Organizacion">
        <ChipGroup title="Categorias activas" items={experience.library.categories} />
      </Panel>
      <Panel title="Tags IA" subtitle="Indexacion">
        <ChipGroup title="Etiquetas disponibles" items={experience.library.tags} />
      </Panel>
    </div>
    <Panel title="Archivos incluidos" subtitle="Recursos" className={panelHoverClass}>
      <SimpleRows rows={experience.library.files} />
    </Panel>
    <Panel title="Compatibilidad" subtitle="Exportacion">
      <KeyValueRows rows={experience.library.compatibility} />
    </Panel>
  </div>
);

const EducationWorkspace = ({ experience, panelHoverClass }) => (
  <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
    <Panel title="Progreso actual" subtitle="Seguimiento">
      <KeyValueRows rows={experience.education.progress} />
    </Panel>
    <Panel title="Modulos" subtitle="Ruta de aprendizaje">
      <SimpleRows rows={experience.education.modules} />
    </Panel>
    <Panel title="Recursos premium" subtitle="Material" className={panelHoverClass}>
      <SimpleRows rows={experience.education.resources} />
    </Panel>
    <Panel title="Siguiente accion" subtitle="Continuidad">
      <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-zinc-300">
        Retoma el siguiente modulo y descarga el material complementario antes de continuar.
      </div>
    </Panel>
  </div>
);

const WorkspaceRenderer = ({ experience, panelHoverClass }) => {
  if (experience.archetype === 'runtime') return <RuntimeWorkspace experience={experience} panelHoverClass={panelHoverClass} />;
  if (experience.archetype === 'toolkit') return <ToolkitWorkspace experience={experience} panelHoverClass={panelHoverClass} />;
  if (experience.archetype === 'education') return <EducationWorkspace experience={experience} panelHoverClass={panelHoverClass} />;
  return <LibraryWorkspace experience={experience} panelHoverClass={panelHoverClass} />;
};

const PurchasedAssetWorkspace = () => {
  const { id } = useParams();
  const location = useLocation();
  const purchase = location.state?.purchase || findPurchaseByProductId(mockPurchases, id) || {
    id,
    productId: id,
    title: 'Asset desbloqueado',
    price: '149 EUR',
    date: new Date().toISOString().slice(0, 10),
    type: 'producto',
    status: 'completed',
    image: `https://picsum.photos/seed/workspace-${id}/1200/900`
  };

  const experience = purchase.experience || buildPurchaseExperience(purchase);
  const AccentIcon = iconByMode[experience.mode] || Box;
  const isService = String(purchase.type || '').toLowerCase() === 'servicio';
  const backTarget = location.state?.from || '/profile?view=compras';
  const backLabel = location.state?.fromLabel || 'Volver a mis compras';
  const accentClass = isService
    ? 'from-blue-500/20 via-blue-500/10 to-transparent border-blue-400/20 shadow-[0_24px_60px_-28px_rgba(59,130,246,0.55)]'
    : 'from-purple-500/20 via-purple-500/10 to-transparent border-purple-400/20 shadow-[0_24px_60px_-28px_rgba(168,85,247,0.55)]';
  const panelHoverClass = isService
    ? 'hover:border-blue-400/35 hover:bg-blue-500/[0.06]'
    : 'hover:border-purple-400/35 hover:bg-purple-500/[0.06]';

  return (
    <section className="min-h-screen px-6 pb-20 pt-28">
      <div className="mx-auto max-w-7xl">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.32, ease: 'easeOut' }} className="space-y-8">
          <Link to={backTarget} className="btn-secondary text-sm hover:scale-[1.02]">
            <ArrowLeft className="h-4 w-4" /> {backLabel}
          </Link>

          <div className={`relative overflow-hidden rounded-[28px] border bg-gradient-to-br from-zinc-950/95 via-zinc-900/88 to-black/90 p-6 md:p-8 ${accentClass}`}>
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_32%)]" />
            <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {experience.archetypeLabel}
                </div>

                <div className="flex items-start gap-4">
                  <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] text-zinc-100">
                    <AccentIcon className="h-6 w-6" />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-50 md:text-4xl">{purchase.title}</h1>
                    <p className="max-w-2xl text-sm leading-7 text-zinc-400">{experience.accessDescription}</p>
                  </div>
                </div>

                <MetricGrid items={experience.metrics.slice(0, 3)} />
                <ActionGrid actions={experience.actions} panelHoverClass={panelHoverClass} />
              </div>

              <div className="grid gap-4">
                <div className="rounded-[24px] border border-white/10 bg-black/30 p-5 backdrop-blur-xl">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-zinc-500">Workspace</p>
                  <p className="mt-2 text-xl font-semibold text-zinc-100">{experience.workspaceLabel}</p>
                  <div className="mt-5 space-y-3 text-sm text-zinc-400">
                    <div className="flex items-center justify-between">
                      <span>Licencia</span>
                      <span className="text-zinc-200">{experience.licenseLabel}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Precio</span>
                      <span className="text-zinc-200">{formatEurPrice(purchase.price)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Soporte</span>
                      <span className="text-zinc-200">Documentacion + guia</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-100">
                    <Activity className="h-4 w-4" />
                    Siguiente accion recomendada
                  </div>
                  <p className="mt-3 text-sm leading-7 text-zinc-400">{experience.recommendation}</p>
                  <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-zinc-300">
                    Este acceso ya no vende el producto. Sirve para operarlo, integrarlo o consumir su contenido segun su arquetipo.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <WorkspaceRenderer experience={experience} panelHoverClass={panelHoverClass} />
        </motion.div>
      </div>
    </section>
  );
};

export default PurchasedAssetWorkspace;