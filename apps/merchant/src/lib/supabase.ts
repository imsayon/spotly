import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gfzxlonhtgvxojyosskx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmenhsb25odGd2eG9qeW9zc2t4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNjc2NjUsImV4cCI6MjA5MTg0MzY2NX0.QUlY5RZZano0irlZ5bSS5Tqwin_8GufJSZIN9etiHr8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
