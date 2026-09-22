import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Verify admin role before using admin client
    const { data: callerProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!callerProfile?.is_admin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Use admin client to bypass RLS and see all profiles
    const admin = createAdminClient();

    // Parámetros de paginación y búsqueda
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const plan = searchParams.get('plan') || '';
    const role = searchParams.get('role') || '';

    const offset = (page - 1) * limit;

    // Construir query
    let query = admin
      .from('profiles')
      .select(
        'id, nombre, apellido, email_cv, plan, puntaje_completitud, onboarding_completado, is_admin, is_editor, is_embajador, created_at',
        { count: 'exact' }
      );

    // Filtros
    if (search) {
      query = query.or(
        `nombre.ilike.%${search}%,apellido.ilike.%${search}%,email_cv.ilike.%${search}%`
      );
    }

    if (plan && plan !== 'all') {
      query = query.eq('plan', plan);
    }

    if (role === 'admin')      query = query.eq('is_admin', true);
    if (role === 'editor')     query = query.eq('is_editor', true);
    if (role === 'embajador')  query = query.eq('is_embajador', true);
    if (role === 'usuario')    query = query.eq('is_admin', false).eq('is_editor', false).eq('is_embajador', false);

    // Paginación
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data: users, count } = await query;

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Admin users error:', error);
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar que el solicitante es admin
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

    const { email, role } = await request.json() as { email: string; role: 'user' | 'editor' | 'admin' };

    if (!email || !role) {
      return NextResponse.json({ error: 'Email y rol son requeridos' }, { status: 400 });
    }

    // Validar que el solicitante puede asignar el rol pedido
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    const isSuperAdmin = !!superAdminEmail && adminProfile.email_cv === superAdminEmail;

    if (role === 'admin' && !isSuperAdmin) {
      return NextResponse.json(
        { error: 'Solo el super admin puede invitar administradores' },
        { status: 403 }
      );
    }

    // Crear usuario + enviar invite link via service role
    const adminClient = createAdminClient();
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      { redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/auth/callback` }
    );

    if (inviteError) {
      console.error('Invite user error:', inviteError);
      const msg = inviteError.message.toLowerCase().includes('already')
        ? 'Este email ya tiene una cuenta registrada'
        : 'No se pudo enviar la invitación. Intenta de nuevo.';
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const newUserId = inviteData.user.id;

    // Crear / actualizar perfil con el rol asignado
    const { error: profileError } = await adminClient
      .from('profiles')
      .upsert({
        id: newUserId,
        email_cv: email,
        plan: 'gratuito',
        is_admin: role === 'admin',
        is_editor: role === 'editor',
        puntaje_completitud: 0,
        onboarding_completado: false,
      }, { onConflict: 'id' });

    if (profileError) {
      return NextResponse.json({ error: 'Usuario creado pero hubo un error asignando el perfil' }, { status: 207 });
    }

    // Registrar en audit log
    await supabase.from('admin_audit_log').insert({
      admin_id: user.id,
      target_user_id: newUserId,
      action: 'invite_user',
      old_value: null,
      new_value: role,
    });

    return NextResponse.json({ success: true, userId: newUserId });
  } catch (error: any) {
    console.error('Admin invite error:', error);
    return NextResponse.json({ error: 'Error al invitar usuario. Intenta de nuevo.' }, { status: 500 });
  }
}
