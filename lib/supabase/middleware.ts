import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Proteger rutas
  const pathname = request.nextUrl.pathname;
  const protectedRoutes = [
    '/onboarding',
    '/perfil',
    '/crear-cv',
    '/mis-cvs',
    '/aplicaciones',
    '/cuenta',
  ];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si tiene sesión pero no completó onboarding
  if (user && pathname.startsWith('/onboarding') === false && isProtectedRoute) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completado')
      .eq('id', user.id)
      .single();

    if (profile && !profile.onboarding_completado && !pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }

  // Si está logueado y va a login/register, redirigir a perfil
  if (user && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/perfil', request.url));
  }

  return supabaseResponse;
}
