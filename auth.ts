import NextAuth, { type DefaultSession } from 'next-auth'
import Resend from 'next-auth/providers/resend'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { authConfig, isAllowedEmail } from '@/auth.config'

declare module 'next-auth' {
  interface Session {
    user: { role?: string; id?: string } & DefaultSession['user']
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.AUTH_EMAIL_FROM ?? 'Bidcom Agro <onboarding@resend.dev>',
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      return isAllowedEmail(user.email)
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token) {
        if (typeof token.role === 'string') session.user.role = token.role
        if (typeof token.id === 'string') session.user.id = token.id
      }
      return session
    },
  },
})

export { isAllowedEmail }
