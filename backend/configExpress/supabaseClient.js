import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.PROJECT_URL;
// Usar SERVICE_ROLE en backend es más seguro para poder crear perfiles o gestionar usuarios sin bloqueos de RLS
const supabaseKey = process.env.SERVICE_ROLE || process.env.PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase PROJECT_URL or SERVICE_ROLE/PUBLISHABLE_KEY is missing in .env file');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false, // Fundamental en Node.js (Backend) para evitar cruce de sesiones entre usuarios
        autoRefreshToken: false
    }
});
