import type { NextAuthConfig } from 'next-auth'

// Emails allowed beyond the @bidcom.com.ar domain
function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const e = email.toLowerCase().trim()
  if (e.endsWith('@bidcom.com.ar')) return true
  const extra = (process.env.ALLOWED_EMAILS ?? '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
  return extra.includes(e)
}

export const authConfig = {
  providers: [],
  pages: {
    signIn: '/login',
    verifyRequest: '/login?check=mail',
    error: '/login?error',
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user
      const path = request.nextUrl.pathname
      const isPublic =
        path === '/login' ||
        path.startsWith('/api/auth') ||
        path.startsWith('/_next') ||
        path.startsWith('/brand') ||
        path === '/favicon.ico' ||
        path === '/robots.txt'
      if (isPublic) return true
      return isLoggedIn
    },
  },
} satisfies NextAuthConfig

export { isAllowedEmail }
