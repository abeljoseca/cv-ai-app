import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ isSuperAdmin: false, isAdmin: false });

    const { data: profile } = await supabase
      .from('profiles')
      .select('email_cv, is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) return NextResponse.json({ isSuperAdmin: false, isAdmin: false });

    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    const isSuperAdmin = !!superAdminEmail && profile.email_cv === superAdminEmail;

    return NextResponse.json({ isSuperAdmin, isAdmin: true });
  } catch {
    return NextResponse.json({ isSuperAdmin: false, isAdmin: false });
  }
}