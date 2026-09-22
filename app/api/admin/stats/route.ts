import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Verify admin role server-side — never trust client-side checks alone
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Use admin client to bypass RLS for aggregate stats
    const admin = createAdminClient();

    // Total de usuarios
    const { count: totalUsers } = await admin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Total de CVs
    const { count: totalCVs } = await admin
      .from('cvs')
      .select('*', { count: 'exact', head: true });

    // CVs por estilo
    const { data: cvsByStyle } = await admin
      .from('cvs')
      .select('estilo');

    const styleCount = (cvsByStyle || []).reduce((acc: Record<string, number>, cv) => {
      acc[cv.estilo] = (acc[cv.estilo] || 0) + 1;
      return acc;
    }, {});

    // CVs por intención
    const { data: cvsByIntention } = await admin
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
    const { count: totalApplications } = await admin
      .from('aplicaciones')
      .select('*', { count: 'exact', head: true });

    // Plan distribution
    const { data: planData } = await admin
      .from('profiles')
      .select('plan');

    const planCount = (planData || []).reduce((acc: Record<string, number>, p) => {
      acc[p.plan] = (acc[p.plan] || 0) + 1;
      return acc;
    }, {});

    // CVs creados en últimos 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: cvs7days } = await admin
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
