import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('is_admin, email_cv')
      .eq('id', user.id)
      .single();

    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const allowed = ['plan', 'is_admin', 'is_editor'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Sin campos válidos' }, { status: 400 });
    }

    // Solo el super admin puede cambiar roles de admin
    if ('is_admin' in updates) {
      const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
      if (superAdminEmail && adminProfile.email_cv !== superAdminEmail) {
        return NextResponse.json(
          { error: 'Solo el super admin puede cambiar roles de administrador' },
          { status: 403 }
        );
      }
    }

    // Capturar estado actual para el log de auditoría
    const { data: currentUser } = await supabase
      .from('profiles')
      .select('plan, is_admin, is_editor')
      .eq('id', id)
      .single();

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Registrar en audit log
    const actionMap: Record<string, string> = {
      plan: 'change_plan',
      is_admin: 'change_admin_role',
      is_editor: 'change_editor_role',
    };
    const auditEntries = Object.keys(updates).map(key => ({
      admin_id: user.id,
      target_user_id: id,
      action: actionMap[key] || key,
      old_value: String(currentUser?.[key as keyof typeof currentUser] ?? ''),
      new_value: String(updates[key]),
    }));
    if (auditEntries.length > 0) {
      await supabase.from('admin_audit_log').insert(auditEntries);
    }

    return NextResponse.json({ user: data });
  } catch (error: any) {
    console.error('Admin update user error:', error);
    return NextResponse.json({ error: 'Error al actualizar el usuario. Intenta de nuevo.' }, { status: 500 });
  }
}