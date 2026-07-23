import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://uwtzzzohzuqfrbtwmstz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3dHp6em9oenVxZnJidHdtc3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3NDkxOTUsImV4cCI6MjEwMDMyNTE5NX0.lyltdQ7h1aAY4_TZ9fLoAJiLzxhUUtx5_9eFfFusJ20';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
