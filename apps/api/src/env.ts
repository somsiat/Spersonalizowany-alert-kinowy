
export const env = {
  PORT: Number(process.env.PORT || 3001),
  DATABASE_URL: process.env.DATABASE_URL!,
  SUPABASE_JWKS_URL: process.env.SUPABASE_JWT_JWKS_URL || '',
  DEV_ALLOW_ANON: process.env.DEV_ALLOW_ANON === 'true',
  DEV_USER_ID: process.env.DEV_USER_ID || '00000000-0000-0000-0000-000000000001'
};
