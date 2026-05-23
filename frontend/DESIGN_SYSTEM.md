# ScriptBay Design System

Sistema visual unificado para mantener el ADN premium dark cyber/dev en toda la plataforma.

## Principios

- Mantener identidad actual: dark mode premium + glow rojo ambiental.
- Diferenciar por intención de negocio, no por pantalla.
- Reducir ruido visual: menos estilos ad-hoc, más tokens compartidos.
- Motion premium corto y suave.

## Niveles de cards

1. Level 1 (Showcase): alto impacto para marketplace y home.
2. Level 2 (Technical): paneles limpios para setup, docs y compatibilidad.
3. Level 3 (Utility/Stats): widgets compactos para métricas y metadata.

## Intents de color (solo hover/focus/active)

- Product: morado.
- Service: azul.
- Analytics: rojo sutil.

## Clases base

- `ds-card`: card base unificada.
- `ds-card-l1`: showcase card.
- `ds-card-l2`: technical panel.
- `ds-card-l3`: utility/stat card.
- `ds-intent-product`: hover morado.
- `ds-intent-service`: hover azul.
- `ds-intent-analytics`: hover rojo sutil.
- `ds-hover-row`: fila interna con hover consistente.
- `ds-btn`: botón base con variantes `solid` y `ghost`.

## Componentes React

Ubicación: `src/components/design-system/`

- `DSCard`: primitive de contenedor para los 3 niveles.
- `DSTitleBlock`: encabezado estándar de panel/card.
- `DSRow`: fila interna de panel técnico.
- `DSStatCard`: card compacta para analytics y métricas.
- `DesignSystemShowcase`: ejemplos visuales reutilizables.

## Reglas de implementación

- Toda card nueva debe usar `DSCard` o clases `ds-card*`.
- No mezclar múltiples radios: usar radio del sistema.
- El color de intent no debe estar activo en estado idle.
- Reusar `ds-hover-row` para listas técnicas.
- Evitar glow permanente; usar glow contextual por interacción.

## Plan de adopción recomendado

1. Marketplace: migrar cards de listados y destacados a L1.
2. Product Detail y Purchased Workspace: migrar paneles a L2.
3. Dashboard y analytics: migrar stats y widgets a L3.
4. Formularios técnicos: mantener superficie base y botones DS.
