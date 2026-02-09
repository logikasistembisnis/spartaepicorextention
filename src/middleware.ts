import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Cek apakah cookie session_auth ada
  const authSession = request.cookies.get('session_auth')

  // Jika tidak ada cookie, dan user mencoba akses halaman selain login
  if (!authSession && request.nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Jika sudah login tapi buka halaman login, lempar ke dashboard
  if (authSession && request.nextUrl.pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

// Tentukan halaman mana saja yang kena middleware ini
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}