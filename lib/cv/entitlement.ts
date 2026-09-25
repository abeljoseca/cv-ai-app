import type { SupabaseClient } from '@supabase/supabase-js'

// Server-side source of truth for "may this user download this CV as PDF?".
// Same rule the UI shows (Pro plan, or a confirmed one-off payment for that CV),
// but enforced where it can't be bypassed: the print page and the PDF endpoint.
// Pass the user-scoped (RLS) client so ownership is enforced by the DB too.
export async function canDownloadCV(
  supabase: SupabaseClient,
  userId: string,
  cvId: string,
): Promise<boolean> {
  const [{ data: profile }, { data: pago }] = await Promise.all([
    supabase.from('profiles').select('plan').eq('id', userId).single(),
    supabase
      .from('pagos')
      .select('id')
      .eq('user_id', userId)
      .eq('cv_id', cvId)
      .eq('estado', 'confirmado')
      .limit(1)
      .maybeSingle(),
  ])
  return profile?.plan === 'pro' || !!pago
}
