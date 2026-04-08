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
