// Genera caracteristicas / incluye / requisitos variados y coherentes con la
// categoria del producto. Es determinista: el mismo producto siempre muestra
// las mismas especificaciones, pero productos distintos obtienen combinaciones
// distintas y acordes a su dominio tecnico.

const hashSeed = (value) => {
  const source = String(value || '');
  let hash = 0;
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) % 100000;
  }
  return hash || 7;
};

// Selecciona n elementos distintos de un pool de forma determinista a partir
// del seed. Recorre el array de forma consecutiva desde un offset derivado del
// seed (garantiza terminacion: nunca puede entrar en bucle infinito).
const selectN = (pool, seed, n) => {
  const total = pool.length;
  if (n >= total) return [...pool];
  const start = seed % total;
  const result = [];
  for (let i = 0; i < total && result.length < n; i += 1) {
    result.push(pool[(start + i) % total]);
  }
  return result;
};

const inferDomain = (category, title) => {
  const source = `${category || ''} ${title || ''}`.toLowerCase();
  if (/(front|react|vue|angular|ui|css|tailwind|next|component|landing)/.test(source)) return 'frontend';
  if (/(back|api|node|express|graphql|microservic|server|rest|orm|websocket)/.test(source)) return 'backend';
  if (/(python|scrap|data|ml|machine|pandas|script|bot|automat|pipeline)/.test(source)) return 'python';
  if (/(dise|design|figma|ui kit|icon|template|plantilla|lottie|wireframe|svg)/.test(source)) return 'diseno';
  if (/(segur|security|auth|2fa|firewall|vulnerab|encrypt|cifr|owasp)/.test(source)) return 'seguridad';
  if (/(web3|nft|erc|token|smart contract|blockchain|crypto|defi|dao|stak|swap|wallet)/.test(source)) return 'web3';
  if (/(cloud|aws|kubernetes|docker|terraform|ci\/cd|serverless|devops|infra)/.test(source)) return 'cloud';
  if (/(herramient|tool|cli|plugin|eslint|monitor|generador|npm)/.test(source)) return 'herramientas';
  return 'general';
};

const characteristicsByDomain = {
  frontend: [
    'Componentes reutilizables y accesibles (WCAG AA)',
    'Diseño responsive mobile-first',
    'Modo claro/oscuro incluido',
    'Animaciones fluidas a 60 fps',
    'Bundle optimizado con tree-shaking',
    'Tipado estricto con TypeScript',
    'Puntuación Lighthouse 95+ en rendimiento',
    'Estructura de carpetas escalable',
  ],
  backend: [
    'API REST documentada con OpenAPI/Swagger',
    'Autenticación JWT y control de roles',
    'Validación de entrada y manejo de errores robusto',
    'Arquitectura en capas (controlador/servicio/repositorio)',
    'Paginación, filtrado y rate limiting',
    'Tests unitarios e integración incluidos',
    'Logs estructurados y trazabilidad de peticiones',
    'Dockerfile listo para desplegar',
  ],
  python: [
    'Código conforme a PEP 8 con type hints',
    'Entorno reproducible (requirements / Poetry)',
    'Manejo de errores y reintentos automáticos',
    'Configuración por variables de entorno',
    'Pruebas automatizadas con pytest',
    'CLI con argumentos configurables',
    'Logging por niveles configurable',
    'Procesamiento eficiente de grandes volúmenes',
  ],
  diseno: [
    'Archivos editables organizados por capas',
    'Sistema de tokens de color y tipografía',
    'Componentes con auto-layout',
    'Exportación a múltiples formatos (SVG, PNG, PDF)',
    'Guía de estilo y uso incluida',
    'Variantes claro/oscuro',
    'Cuadrícula y espaciados consistentes',
    'Listo para handoff a desarrollo',
  ],
  seguridad: [
    'Buenas prácticas según OWASP Top 10',
    'Cifrado de datos sensibles en reposo y tránsito',
    'Auditoría y registro de eventos de seguridad',
    'Gestión segura de secretos y credenciales',
    'Validación y sanitización de entradas',
    'Cabeceras de seguridad correctamente configuradas',
    'Protección frente a inyección y XSS',
    'Política de mínimos privilegios',
  ],
  web3: [
    'Smart contract verificado en el explorador',
    'Cobertura de tests con Hardhat / Foundry',
    'Consumo de gas optimizado',
    'Compatible con redes EVM (Ethereum, Polygon, Base)',
    'Eventos on-chain para trazabilidad',
    'Patrón checks-effects-interactions aplicado',
    'Protección frente a reentrancy',
    'Código auditado y sin dependencias obsoletas',
  ],
  cloud: [
    'Infraestructura como código (IaC)',
    'Despliegue automatizado mediante CI/CD',
    'Escalado horizontal configurado',
    'Monitorización y alertas integradas',
    'Configuración multi-entorno (dev/staging/prod)',
    'Backups automáticos y alta disponibilidad',
    'Gestión de secretos centralizada',
    'Optimización de costes incluida',
  ],
  herramientas: [
    'Instalación y configuración en minutos',
    'Documentación de uso clara y con ejemplos',
    'Integrable en pipelines existentes',
    'Configurable por flags o archivo',
    'Multiplataforma (Windows, macOS, Linux)',
    'Salida en formatos estándar (JSON, CSV)',
    'Bajo consumo de recursos',
    'Actualizaciones y mantenimiento activos',
  ],
  general: [
    'Código original, limpio y mantenible',
    'Buenas prácticas y patrones de diseño aplicados',
    'Documentación técnica incluida',
    'Optimizado para rendimiento',
    'Estructura modular y escalable',
    'Soporte y actualizaciones del autor',
    'Revisado por el equipo de ScriptBay',
    'Fácil de personalizar y extender',
  ],
};

const includesPool = [
  'Código fuente completo y comentado',
  'Documentación técnica y de uso',
  'Guía de instalación paso a paso',
  'Ejemplos de uso y casos reales',
  'Archivo de configuración de ejemplo (.env.example)',
  'Colección de pruebas (Postman / tests)',
  'Acceso al repositorio privado',
  'Actualizaciones menores durante 6 meses',
  'Soporte por email del autor',
  'Licencia de uso comercial',
  'Changelog y notas de versión',
  'Diagramas de arquitectura',
];

const requirementsPool = [
  'Conocimientos básicos de la tecnología',
  'Editor de código (VS Code recomendado)',
  'Git instalado',
  'Node.js 18+ o el runtime correspondiente',
  'Gestor de paquetes (npm, pnpm o yarn)',
  'Conexión a internet para instalar dependencias',
  'Cuenta en un proveedor cloud (opcional)',
  'Variables de entorno configuradas',
  'Docker instalado (opcional, para despliegue)',
  'Terminal con permisos de ejecución',
];

export const buildProductSpecs = (product = {}) => {
  const seed = hashSeed(product.id || product.title || product.category);
  const domain = inferDomain(product.category, product.title);
  const characteristicsPool = characteristicsByDomain[domain] || characteristicsByDomain.general;

  return {
    characteristics: selectN(characteristicsPool, seed, 4),
    includes: selectN(includesPool, seed + 3, 4),
    requirements: selectN(requirementsPool, seed + 7, 3),
  };
};
