import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verificar si el usuario es admin (por ahora permitir acceso)
    // TODO: Implementar verificación de rol admin
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Total de usuarios
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Total de CVs
    const { count: totalCVs } = await supabase
      .from('cvs')
      .select('*', { count: 'exact', head: true });

    // CVs por estilo
    const { data: cvsByStyle } = await supabase
      .from('cvs')
      .select('estilo');

    const styleCount = (cvsByStyle || []).reduce((acc: Record<string, number>, cv) => {
      acc[cv.estilo] = (acc[cv.estilo] || 0) + 1;
      return acc;
    }, {});

    // CVs por intención
    const { data: cvsByIntention } = await supabase
      .from('cvs')
      .select('intencion');

    const intentionCount = (cvsByIntention || []).reduce(
      (acc: Record<string, number>, cv) => {
        acc[cv.intencion] = (acc[cv.intencion] || 0) + 1;
        return acc;
      },
      {}
    );

    // Total de aplicaciones registradas
    const { count: totalApplications } = await supabase
      .from('aplicaciones')
      .select('*', { count: 'exact', head: true });

    // Plan distribution
    const { data: planData } = await supabase
      .from('profiles')
      .select('plan');

    const planCount = (planData || []).reduce((acc: Record<string, number>, profile) => {
      acc[profile.plan] = (acc[profile.plan] || 0) + 1;
      return acc;
    }, {});

    // CVs creados en últimos 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: cvs7days } = await supabase
      .from('cvs')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    return NextResponse.json({
      overview: {
        totalUsers: totalUsers || 0,
        totalCVs: totalCVs || 0,
        totalApplications: totalApplications || 0,
        cvs7days: cvs7days || 0,
      },
      cvs: {
        byStyle: styleCount,
        byIntention: intentionCount,
      },
      plans: planCount,
    });
  } catch (error: any) {
    console.error('Admin stats error:', error);

    return NextResponse.json(
      { error: 'Error al obtener estadísticas' },
      { status: 500 }
    );
  }
}
