const cx = (...parts) => parts.filter(Boolean).join(' ');

const cardLevelClass = {
  l1: 'ds-card-l1',
  l2: 'ds-card-l2',
  l3: 'ds-card-l3',
};

const intentClass = {
  product: 'ds-intent-product',
  service: 'ds-intent-service',
  analytics: 'ds-intent-analytics',
};

const normalizeIntent = (intent) => {
  if (intent === 'producto') return 'product';
  if (intent === 'servicio') return 'service';
  return intent || 'product';
};

export const getIntentClass = (intent) => intentClass[normalizeIntent(intent)] || intentClass.product;

export const getCardClass = ({ level = 'l2', intent = 'product', interactive = true, className = '' } = {}) => {
  return cx(
    'ds-card',
    cardLevelClass[level] || cardLevelClass.l2,
    getIntentClass(intent),
    className,
    interactive ? '' : 'pointer-events-auto'
  );
};

export const getButtonClass = ({ intent = 'product', variant = 'ghost', className = '' } = {}) => {
  return {
    className: cx('ds-btn', getIntentClass(intent), className),
    variant,
  };
};

export default cx;
