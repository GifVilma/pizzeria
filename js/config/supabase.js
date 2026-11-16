// Configuración PÚBLICA: añade tu publishable key desde el panel de Supabase.
// Nunca uses secret keys, service_role ni contraseñas de PostgreSQL aquí.
// La sitekey de Turnstile también es pública; su secreto solo vive en el servidor.
export const supabaseConfig = Object.freeze({
  projectUrl: 'https://czbgbkrznsulbvjwqesx.supabase.co',
  publishableKey: 'sb_publishable_hLZJvx5szUbYzfEnCJsNGg_7QmCCdT5',
  turnstileSiteKey: '0x4AAAAAAGCUYvbSEqPnR3aL'
});
