import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.PROJECT_URL || process.env.SUPABASE_URL;
// Se aceptan varios nombres para facilitar distintos formatos de .env
const supabaseKey =
    process.env.SERVICE_ROLE ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error(
        'Faltan variables de Supabase en backend/.env. Usa PROJECT_URL o SUPABASE_URL y SERVICE_ROLE/SUPABASE_SERVICE_ROLE_KEY (o PUBLISHABLE_KEY/SUPABASE_ANON_KEY).'
    );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false, // Fundamental en Node.js (Backend) para evitar cruce de sesiones entre usuarios
        autoRefreshToken: false
    }
});
