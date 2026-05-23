import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import DesignSystemShowcase from '../components/design-system/DesignSystemShowcase';

const DesignSystemLab = () => {
  return (
    <section className="min-h-screen px-6 pb-20 pt-28">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-2">
          <Link to="/" className="btn-secondary text-sm inline-flex">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
          <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Design System</p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-50 md:text-4xl">ScriptBay Visual DNA</h1>
          <p className="max-w-3xl text-sm text-zinc-400">
            Laboratorio visual para validar coherencia entre marketplace, panel técnico y analytics.
          </p>
        </div>

        <DesignSystemShowcase />
      </div>
    </section>
  );
};

export default DesignSystemLab;
