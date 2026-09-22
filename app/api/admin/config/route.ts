import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single();
  return data?.is_admin ? user : null;
}

export async function GET() {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const admin = createAdminClient();
  const { data } = await admin.from('configuracion').select('*').order('clave');
  return NextResponse.json(data ?? []);
}

export async function PATCH(request: NextRequest) {
  const user = await assertAdmin();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  let body: { clave?: string; valor?: string };
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Payload inválido' }, { status: 400 }); }

  if (!body.clave || body.valor === undefined) {
    return NextResponse.json({ error: 'Faltan campos clave y valor' }, { status: 400 });
  }

  const val = parseFloat(body.valor);
  if (isNaN(val) || val < 0) {
    return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('configuracion')
    .upsert({ clave: body.clave, valor: String(val), updated_at: new Date().toISOString() }, { onConflict: 'clave' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}