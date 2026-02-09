import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 🔥 WAJIB SKIP: Next internals & React Server Component
  const isRSC = request.headers.get('accept')?.includes('text/x-component')

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    isRSC
  ) {
    return NextResponse.next()
  }

  const authSession = request.cookies.get('session_auth')

  // belum login → lempar ke login
  if (!authSession && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // sudah login → jangan boleh ke login
  if (authSession && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!favicon.ico).*)'],
}
