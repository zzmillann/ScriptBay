import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.PROJECT_URL;
const supabaseKey = process.env.PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase PROJECT_URL or PUBLISHABLE_KEY is missing in .env file');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
