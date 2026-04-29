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
