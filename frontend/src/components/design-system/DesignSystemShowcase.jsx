import { Activity, BarChart3, BookOpen, Bot, Download, Layers3, Settings2, Sparkles, Workflow } from 'lucide-react';
import DSCard, { DSRow, DSTitleBlock } from './DSCard';
import DSStatCard from './DSStatCard';

const DesignSystemShowcase = () => {
  return (
    <section className="space-y-5">
      <DSCard level="l1" intent="product" className="p-6" interactive>
        <DSTitleBlock eyebrow="Level 1" title="Showcase Card (Marketplace)" icon={Sparkles} />
        <p className="text-sm text-zinc-300">
          Card de alto impacto visual para home, marketplace y productos destacados.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <DSRow intent="product" className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Modo</span>
            <span className="text-xs font-semibold text-zinc-100">Producto</span>
          </DSRow>
          <DSRow intent="product" className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Hover</span>
            <span className="text-xs font-semibold text-zinc-100">Morado</span>
          </DSRow>
        </div>
      </DSCard>

      <div className="grid gap-5 lg:grid-cols-2">
        <DSCard level="l2" intent="service" className="p-5" interactive>
          <DSTitleBlock eyebrow="Level 2" title="Technical Panel" icon={Settings2} />
          <div className="space-y-2">
            <DSRow intent="service" className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Quick Start</span>
              <Download className="h-4 w-4 text-zinc-200" />
            </DSRow>
            <DSRow intent="service" className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Documentación</span>
              <BookOpen className="h-4 w-4 text-zinc-200" />
            </DSRow>
            <DSRow intent="service" className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Compatibilidad</span>
              <Workflow className="h-4 w-4 text-zinc-200" />
            </DSRow>
          </div>
        </DSCard>

        <DSCard level="l2" intent="service" className="p-5" interactive>
          <DSTitleBlock eyebrow="Level 2" title="Recursos Incluidos" icon={Layers3} />
          <div className="space-y-2">
            <DSRow intent="service" className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">source.zip</span>
              <span className="text-xs text-zinc-100">2.4 MB</span>
            </DSRow>
            <DSRow intent="service" className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">README.md</span>
              <span className="text-xs text-zinc-100">18 KB</span>
            </DSRow>
            <DSRow intent="service" className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">env.example</span>
              <span className="text-xs text-zinc-100">2 KB</span>
            </DSRow>
          </div>
        </DSCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DSStatCard icon={BarChart3} label="Conversion" value="8.4%" sub="Últimos 30 días" intent="analytics" delay={0} />
        <DSStatCard icon={Activity} label="Requests" value="1.2M" sub="API traffic" intent="analytics" delay={0.04} />
        <DSStatCard icon={Bot} label="IA Jobs" value="328" sub="Automatizaciones" intent="analytics" delay={0.08} />
        <DSStatCard icon={Sparkles} label="Health" value="99.9%" sub="Uptime" intent="analytics" delay={0.12} />
      </div>
    </section>
  );
};

export default DesignSystemShowcase;
