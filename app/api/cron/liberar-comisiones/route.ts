import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

// Called on a schedule (see vercel.json) to move ambassador commissions
// from 'pendiente' to 'disponible' once their 24h holdback has elapsed.
// Vercel Cron sends `Authorization: Bearer $CRON_SECRET` automatically
// when the CRON_SECRET env var is set — see https://vercel.com/docs/cron-jobs/manage-cron-jobs#securing-cron-jobs
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron/liberar-comisiones] CRON_SECRET not configured')
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const admin = createAdminClient()
    const { data: releasedCount, error } = await admin.rpc('liberar_comisiones_disponibles')

    if (error) {
      console.error('[cron/liberar-comisiones] RPC error:', error)
      return NextResponse.json({ error: 'RPC failed' }, { status: 500 })
    }

    console.log(`[cron/liberar-comisiones] Comisiones liberadas: ${releasedCount}`)
    return NextResponse.json({ released: releasedCount })
  } catch (error: unknown) {
    console.error('[cron/liberar-comisiones] Error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
