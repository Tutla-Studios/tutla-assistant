import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const target = new URL('/api/auth/oauth2/callback/tutla', url.origin)
  target.search = url.search
  return NextResponse.redirect(target)
}
