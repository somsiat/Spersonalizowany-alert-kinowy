/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON: string;
  readonly VITE_API_URL?: string; // np. http://localhost:3000
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
