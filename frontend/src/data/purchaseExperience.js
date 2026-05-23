const ETH_REFERENCE_EUR = 3490;

const walletPool = [
  '0x8fA2D4C17E38b1a02Bf0D12345a9E391cd12Aa10',
  '0x71De9B63aFE4a620f5B0c9a5b13194c8d2EE7F26',
  '0x29cAF0B5126ef7311b8B3f84D12e9900B47d9C4F',
  '0x4d92A71cE9e0B2f8D3aC79A09e7614Ce1249fB90'
];

const networkPool = ['Base', 'Polygon', 'Ethereum'];
const toolkitStacks = ['Node 20+', 'Next.js', 'React', 'Express'];
const toolkitEnvs = ['Sandbox', 'Production', 'Staging'];
const libraryFormats = ['TXT', 'JSON', 'Markdown', 'CSV'];
const libraryModels = ['GPT-4.1', 'Claude 3.7', 'Gemini 2.5', 'Llama 3'];

const parseNumericPrice = (value) => {
  if (typeof value === 'number') return value;
  const normalized = String(value || '')
    .replace(',', '.')
    .replace(/EUR/gi, '')
    .replace(/€/g, '')
    .trim();
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) ? amount : 0;
};

export const formatEurPrice = (value) => `${parseNumericPrice(value).toFixed(0)} €`;

export const formatEthPrice = (value) => `≈ ${(parseNumericPrice(value) / ETH_REFERENCE_EUR).toFixed(3)} ETH`;

const toDeterministicSeed = (...candidates) => {
  for (const candidate of candidates) {
    const n = Number(candidate);
    if (Number.isFinite(n) && n > 0) return Math.floor(n);
  }

  const source = candidates
    .map((candidate) => String(candidate || ''))
    .join('|');

  // Simple hash estable para IDs no numericos (por ejemplo UUID).
  const hash = Array.from(source).reduce((acc, char, index) => {
    return (acc + char.charCodeAt(0) * (index + 1)) % 100000;
  }, 0);

  return hash || 1;
};

export const shortenHash = (value, size = 4) => {
  const stringValue = String(value || '');
  if (stringValue.length <= size * 2) return stringValue;
  return `${stringValue.slice(0, size + 2)}...${stringValue.slice(-size)}`;
};

export const inferPurchaseMode = ({ title, type, category }) => {
  const source = `${title || ''} ${type || ''} ${category || ''}`.toLowerCase();

  if (source.includes('curso') || source.includes('guia') || source.includes('documentacion premium')) return 'education';
  if (source.includes('plugin') || source.includes('sdk') || source.includes('api') || source.includes('integr') || source.includes('stripe') || source.includes('notion')) return 'plugin';
  if (source.includes('bot')) return 'bot';
  if (source.includes('automat') || source.includes('workflow') || source.includes('scrap') || source.includes('pipeline')) return 'automation';
  if (source.includes('prompt') || source.includes('pack') || source.includes('plantilla') || source.includes('template') || source.includes('asset') || source.includes('componentes')) return 'prompt';

  return 'asset';
};

const buildTxHash = (seed) => `0x${Array.from({ length: 64 }, (_, index) => ((seed + index * 13) % 16).toString(16)).join('')}`;

const buildRuntimeExperience = (seed, title) => {
  return {
    archetype: 'runtime',
    archetypeLabel: 'Workspace de uso',
    accessTitle: 'Zona de uso del producto',
    accessDescription: `${title} listo para usar con configuracion, guia rapida y recursos de instalacion.`,
    workspaceLabel: 'Bot / automatizacion',
    recommendation: 'Empieza por la guia rapida y despues configura credenciales e integraciones.',
    metrics: [
      { label: 'Licencia', value: 'Activa', meta: 'Uso personal habilitado' },
      { label: 'Ultima actualizacion', value: `Hace ${(seed % 6) + 2} dias`, meta: 'Version estable' },
      { label: 'Configuracion', value: 'Rapida', meta: 'Guia incluida' }
    ],
    actions: [
      { label: 'Descargar configuracion', meta: 'Base recomendada', iconKey: 'download' },
      { label: 'Ver documentacion', meta: 'Instalacion y uso', iconKey: 'book' },
      { label: 'Configurar API', meta: 'Credenciales', iconKey: 'key' },
      { label: 'Abrir guia rapida', meta: 'Primeros pasos', iconKey: 'play' }
    ],
    runtime: {
      highlights: [
        { label: 'Compatible con', value: 'Binance / Bybit' },
        { label: 'Estrategia incluida', value: seed % 2 === 0 ? 'Momentum' : 'DCA' },
        { label: 'Guia de instalacion', value: 'Paso a paso' },
        { label: 'Estado de licencia', value: 'Activo' }
      ],
      setup: [
        { label: '1. Importar config base', value: 'Recomendado' },
        { label: '2. Añadir API key', value: 'Obligatorio' },
        { label: '3. Validar parametros', value: 'Antes de usar' }
      ],
      integrations: [
        { label: 'Webhooks', value: 'Disponibles' },
        { label: 'Notificaciones', value: 'Email / Telegram' },
        { label: 'Formato salida', value: 'JSON' }
      ]
    }
  };
};

const buildToolkitExperience = (seed, title) => {
  const version = `v2.${(seed % 5) + 1}.${(seed % 7) + 2}`;
  const endpointCount = (seed % 4) + 3;

  return {
    archetype: 'toolkit',
    archetypeLabel: 'Workspace tecnico',
    accessTitle: 'Entorno tecnico del producto',
    accessDescription: `${title} se consume como toolkit: instalacion, API keys, snippets, endpoints y compatibilidad.`,
    workspaceLabel: 'Developer toolkit',
    recommendation: 'Copia el snippet base y valida la API key activa antes de integrarlo en tu stack.',
    metrics: [
      { label: 'Version instalada', value: version, meta: 'Canal estable' },
      { label: 'API key', value: 'Activa', meta: toolkitEnvs[seed % toolkitEnvs.length] },
      { label: 'Endpoints', value: `${endpointCount}`, meta: 'Listos para usar' },
      { label: 'Compatibilidad', value: toolkitStacks[seed % toolkitStacks.length], meta: 'Quick setup validado' }
    ],
    actions: [
      { label: 'Copiar snippet', meta: 'Setup base', iconKey: 'copy' },
      { label: 'Descargar build', meta: version, iconKey: 'download' },
      { label: 'Abrir docs', meta: 'Referencia rapida', iconKey: 'book' },
      { label: 'Ver changelog', meta: 'Ultimos cambios', iconKey: 'history' }
    ],
    toolkit: {
      setup: [
        { label: '1. Instalar dependencia', value: 'Listo' },
        { label: '2. Configurar credenciales', value: 'API key activa' },
        { label: '3. Probar endpoint base', value: '200 OK' }
      ],
      endpoints: [
        { label: 'POST /sync', meta: 'Sincronizacion manual' },
        { label: 'GET /status', meta: 'Estado del recurso' },
        { label: 'POST /events', meta: 'Webhook de salida' }
      ],
      snippet: {
        title: 'Snippet base',
        code: `const client = createClient({\n  apiKey: 'sk_live_xxxx',\n  environment: '${toolkitEnvs[seed % toolkitEnvs.length].toLowerCase()}'\n});\n\nawait client.sync();`
      },
      compatibility: [
        { label: 'SDK', value: toolkitStacks[seed % toolkitStacks.length] },
        { label: 'Auth', value: 'Bearer token' },
        { label: 'Entrega', value: 'NPM + ZIP' }
      ],
      changelog: [
        { label: version, value: 'Compatibilidad extendida', meta: 'Hace 8 dias' },
        { label: 'v2.0.0', value: 'Quick setup renovado', meta: 'Hace 1 mes' },
        { label: 'v1.8.4', value: 'Nuevos endpoints', meta: 'Hace 2 meses' }
      ]
    }
  };
};

const buildLibraryExperience = (seed, title) => {
  const items = (seed % 8) + 8;
  const formats = libraryFormats.slice(0, (seed % 3) + 2);

  return {
    archetype: 'library',
    archetypeLabel: 'Workspace de contenidos',
    accessTitle: 'Biblioteca premium del asset',
    accessDescription: `${title} se consume como coleccion organizada: previews, copias rapidas, importacion y formatos compatibles.`,
    workspaceLabel: 'Content library',
    recommendation: 'Abre el preview principal y exporta el formato que vayas a usar en tu siguiente flujo.',
    metrics: [
      { label: 'Items disponibles', value: `${items}`, meta: 'Contenido desbloqueado' },
      { label: 'Categorias', value: `${(seed % 4) + 3}`, meta: 'Coleccion organizada' },
      { label: 'Formatos', value: `${formats.length}`, meta: formats.join(' · ') },
      { label: 'GPT compatible', value: libraryModels[seed % libraryModels.length], meta: 'Uso recomendado' }
    ],
    actions: [
      { label: 'Abrir preview', meta: 'Item destacado', iconKey: 'preview' },
      { label: 'Copiar prompt', meta: 'Uso inmediato', iconKey: 'copy' },
      { label: 'Importar pack', meta: 'JSON / TXT', iconKey: 'upload' },
      { label: 'Descargar archivos', meta: 'Bundle completo', iconKey: 'download' }
    ],
    library: {
      previews: [
        { label: 'Preview destacado', value: 'Sales sequence v3', meta: 'Listo para copiar' },
        { label: 'Template mas usado', value: 'Follow-up premium', meta: 'Uso recurrente' },
        { label: 'Ultima importacion', value: 'Notion export', meta: 'Hace 2 dias' }
      ],
      categories: ['Ventas', 'Soporte', 'Outbound', 'SEO'].slice(0, (seed % 3) + 2),
      tags: ['GPT', 'Claude', 'Importable', 'Editable'].slice(0, (seed % 4) + 2),
      files: [
        { label: 'templates.json', meta: 'Coleccion importable' },
        { label: 'prompts-master.txt', meta: 'Uso rapido' },
        { label: 'variables.csv', meta: 'Parametrizacion' }
      ],
      compatibility: [
        { label: 'Formatos soportados', value: formats.join(' · ') },
        { label: 'Modelo recomendado', value: libraryModels[seed % libraryModels.length] },
        { label: 'Licencia de uso', value: 'Privada y transferible' }
      ]
    }
  };
};

const buildEducationExperience = (seed, title) => ({
  archetype: 'education',
  archetypeLabel: 'Workspace educativo',
  accessTitle: 'Area privada de aprendizaje',
  accessDescription: `${title} se consume como contenido premium: progreso, modulos, recursos y seguimiento.`,
  workspaceLabel: 'Learning center',
  recommendation: 'Retoma el siguiente modulo y descarga el recurso asociado antes de marcar progreso.',
  metrics: [
    { label: 'Progreso', value: `${40 + (seed % 5) * 10}%`, meta: 'Guardado automaticamente' },
    { label: 'Modulos', value: `${(seed % 5) + 4}`, meta: 'Contenido total' },
    { label: 'Recursos', value: `${(seed % 4) + 3}`, meta: 'Guias y plantillas' },
    { label: 'Tiempo estimado', value: `${(seed % 4) + 2} h`, meta: 'Para completar' }
  ],
  actions: [
    { label: 'Continuar modulo', meta: 'Leccion actual', iconKey: 'play' },
    { label: 'Abrir recursos', meta: 'Material extra', iconKey: 'book' },
    { label: 'Descargar guia', meta: 'PDF', iconKey: 'download' },
    { label: 'Marcar avance', meta: 'Sincronizar progreso', iconKey: 'check' }
  ],
  education: {
    progress: [
      { label: 'Modulo actual', value: 'Automatizacion aplicada' },
      { label: 'Completado', value: `${40 + (seed % 5) * 10}%` },
      { label: 'Siguiente hito', value: 'Caso practico' }
    ],
    modules: [
      { label: 'Fundamentos', meta: 'Completado' },
      { label: 'Implementacion', meta: 'En curso' },
      { label: 'Validacion', meta: 'Pendiente' }
    ],
    resources: [
      { label: 'Workbook premium', meta: 'PDF descargable' },
      { label: 'Checklist de entrega', meta: 'Editable' },
      { label: 'Plantilla de seguimiento', meta: 'Notion' }
    ]
  }
});

const modeBuilders = {
  bot: buildRuntimeExperience,
  automation: buildRuntimeExperience,
  plugin: buildToolkitExperience,
  prompt: buildLibraryExperience,
  education: buildEducationExperience,
  asset: buildLibraryExperience
};

const formatMintDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
};

export const buildPurchaseExperience = (purchase = {}) => {
  const seed = toDeterministicSeed(purchase.productId, purchase.id, 1);
  const amount = parseNumericPrice(purchase.price || purchase.precio || 0);
  const mode = inferPurchaseMode(purchase);
  const wallet = walletPool[seed % walletPool.length];
  const realTxHash = purchase.txHash || purchase.blockchain_hash || purchase.blockchainHash || null;
  const txHash = realTxHash || buildTxHash(seed + 7);
  const network = 'Sepolia';
  const owners = (seed % 4) + 1;
  const previousOwners = Math.max(owners - 1, 0);
  const transferDays = (seed % 15) + 3;
  const mintDate = purchase.date || null;
  const explorerBase = 'https://sepolia.etherscan.io/tx/';
  const builder = modeBuilders[mode] || buildLibraryExperience;
  const archetypeData = builder(seed, purchase.title || 'asset');

  return {
    mode,
    amount,
    eurPrice: formatEurPrice(amount),
    ethPrice: formatEthPrice(amount),
    wallet,
    walletShort: shortenHash(wallet),
    txHash,
    txHashShort: shortenHash(txHash, 5),
    network,
    mintedAt: formatMintDate(mintDate),
    hasMintDate: Boolean(mintDate),
    previousOwners,
    transferDays,
    explorerUrl: `${explorerBase}${txHash}`,
    hasRealTx: Boolean(realTxHash),
    ownershipLabel: owners > 1 ? 'Ownership confirmado' : 'Ownership inicial',
    licenseLabel: 'Licencia activa',
    verifiabilityLabel: 'Asset verificable',
    ...archetypeData
  };
};

export const findPurchaseByProductId = (purchases, productId) => {
  const target = String(productId || '');
  return (purchases || []).find((purchase) => String(purchase.productId || purchase.id) === target) || null;
};