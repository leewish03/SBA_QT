import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || 
  (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_SUPABASE_URL : undefined) || 
  'https://ebfpjvwwbognddixrvyc.supabase.co';
// .env 등 설정이 없을 시 기본 legacy anon API key를 Fallback으로 제공
const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || 
  (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY : undefined) || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImViZnBqdnd3Ym9nbmRkaXhydnljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0MzIyMzcsImV4cCI6MjA5NTAwODIzN30.m2FL3awa0zooqHGaHFeT7128HjuonWVjsuWDlsj5Oxs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
