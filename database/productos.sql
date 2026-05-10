CREATE TABLE productos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tipo text NOT NULL,
  titulo text NOT NULL,
  descripcion text NOT NULL,
  imagen text,
  categoria text,
  precio numeric,
  archivo jsonb,
  telefono text,
  email text,
  github text,
  linkedin text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS stripe_customer_id text DEFAULT NULL;

CREATE TABLE IF NOT EXISTS compras (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  producto_id uuid REFERENCES productos(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  precio numeric NOT NULL,
  metodo_pago text NOT NULL,
  id_transaccion text,
  blockchain_hash text,
  created_at timestamptz DEFAULT now()
);

-- ── SUBASTAS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subastas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id uuid REFERENCES productos(id) ON DELETE CASCADE NOT NULL,
  vendedor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  precio_salida numeric NOT NULL,
  precio_actual numeric NOT NULL,
  precio_compra_inmediata numeric,
  incremento_puja numeric NOT NULL DEFAULT 0.01,  -- mínimo que debe subir cada puja
  duracion text NOT NULL,             -- '1h' | '24h' | '7d'
  fecha_fin timestamptz NOT NULL,
  estado text NOT NULL DEFAULT 'activa',  -- 'activa' | 'cerrada' | 'cancelada'
  ganador_id uuid REFERENCES auth.users(id),
  puja_ganadora numeric,
  stripe_payment_intent text,
  created_at timestamptz DEFAULT now()
);

-- ── PUJAS ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pujas (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  subasta_id uuid REFERENCES subastas(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  cantidad numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Índices para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_subastas_estado ON subastas(estado);
CREATE INDEX IF NOT EXISTS idx_subastas_fecha_fin ON subastas(fecha_fin);
CREATE INDEX IF NOT EXISTS idx_pujas_subasta ON pujas(subasta_id, created_at DESC);
