import { createClient } from '@/lib/supabase/server';
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

    // Parámetros de paginación y búsqueda
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const plan = searchParams.get('plan') || '';

    const offset = (page - 1) * limit;

    // Construir query
    let query = supabase
      .from('profiles')
      .select(
        'id, nombre, apellido, email_cv, plan, puntaje_completitud, onboarding_completado, created_at',
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

    return NextResponse.json(
      { error: 'Error al obtener usuarios' },
      { status: 500 }
    );
  }
}
