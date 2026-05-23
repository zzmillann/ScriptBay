import { motion } from 'framer-motion';
import DSCard from './DSCard';

const DSStatCard = ({ icon: Icon, label, value, sub, intent = 'analytics', delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.26, delay }}>
    <DSCard level="l3" intent={intent} className="flex items-start gap-3" interactive>
      {Icon && (
        <span className="ds-accent-ring mt-0.5 inline-grid h-9 w-9 shrink-0 place-items-center rounded-xl border">
          <Icon className="h-4 w-4" />
        </span>
      )}
      <div>
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">{label}</p>
        <p className="mt-1 text-xl font-bold text-zinc-100 leading-tight">{value}</p>
        {sub && <p className="mt-1 text-xs text-zinc-400">{sub}</p>}
      </div>
    </DSCard>
  </motion.div>
);

export default DSStatCard;
