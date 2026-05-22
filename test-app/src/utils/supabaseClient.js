import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 
  (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_SUPABASE_URL : undefined) || 
  'https://wyqpcldqlyrqbppjdhhp.supabase.co';
// .env 등 설정이 없을 시 기본 legacy anon API key를 Fallback으로 제공
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 
  (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined) || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5cXBjbGRxbHlycWJwcGpkaGhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MTQ3NDcsImV4cCI6MjA5NDM5MDc0N30.pGTyZtJ6uNBT0own2LnfdcY8ykT8Vpd2UW2MYMAHOXI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
