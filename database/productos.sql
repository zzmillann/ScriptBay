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

-- Columna para cachear el Stripe Customer ID en el perfil del usuario
-- Igual que en el proyecto de clase: antes de crear un nuevo Customer comprobamos si ya tiene uno
ALTER TABLE perfiles ADD COLUMN IF NOT EXISTS stripe_customer_id text DEFAULT NULL;

-- Historial de compras del usuario (igual que array 'pedidos' en el proyecto de clase)
-- Cada compra completada queda registrada aqui para mostrarse en "Mis Compras" del perfil
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
