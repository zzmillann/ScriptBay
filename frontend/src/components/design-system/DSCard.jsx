import cx, { getCardClass, getIntentClass } from './dsClassnames';

const DSCard = ({
  as: Component = 'div',
  level = 'l2',
  intent = 'product',
  interactive = true,
  className = '',
  children,
  ...rest
}) => {
  return (
    <Component
      className={getCardClass({ level, intent, interactive, className })}
      data-interactive={interactive ? 'true' : 'false'}
      {...rest}
    >
      {children}
    </Component>
  );
};

export const DSTitleBlock = ({ eyebrow, title, icon: Icon, className = '' }) => (
  <header className={cx('mb-4 flex items-start justify-between gap-3', className)}>
    <div>
      {eyebrow && <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-zinc-500">{eyebrow}</p>}
      <h3 className="mt-1 text-base font-semibold text-zinc-100 tracking-tight">{title}</h3>
    </div>
    {Icon && <Icon className="mt-0.5 h-4 w-4 text-zinc-300" />}
  </header>
);

export const DSRow = ({ intent = 'product', className = '', children }) => (
  <div className={cx('ds-hover-row rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2', getIntentClass(intent), className)}>
    {children}
  </div>
);

export default DSCard;
