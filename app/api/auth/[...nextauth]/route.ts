import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcrypt'
import { prisma } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers: [
    CredentialsProvider({
      name: 'Email & Password',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
        role:     { label: 'Login as', type: 'text', placeholder: 'customer or staff' }
      },
      // note the two parameters here (credentials, req)
      async authorize(
        credentials: Record<'email'|'password'|'role', string> | undefined,
        req
      ) {
        if (!credentials) return null
        const { email, password, role } = credentials

        // CUSTOMER LOGIN
        if (role === 'customer') {
          const user = await prisma.customer.findUnique({ where: { email } })
          if (
            user?.passwordHash &&
            user.emailVerified &&
            await bcrypt.compare(password, user.passwordHash)
          ) {
            return {
              id:       user.id,
              name:     `${user.firstName} ${user.lastName}`,
              email:    user.email,
              role:     'customer',
              jobRoles: []          // <-- always include this
            }
          }
        }

        // STAFF LOGIN
        if (role === 'staff') {
          const staff = await prisma.staff.findUnique({ where: { email } })
          if (
            staff?.emailVerified &&
            await bcrypt.compare(password, staff.passwordHash)
          ) {
            return {
              id:       staff.id,
              name:     `${staff.firstName} ${staff.lastName}`,
              email:    staff.email,
              role:     staff.access,    // e.g. SuperAdmin, OrderAdmin…
              jobRoles: staff.jobRoles   // array of JobRole values
            }
          }
        }

        return null
      }
    })
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role     = (user as any).role
        token.jobRoles = (user as any).jobRoles
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.role     = token.role as string
        session.user.jobRoles = token.jobRoles as string[]
      }
      return session
    }
  },

  // we’ll build distinct pages for each route,
  // but NextAuth needs only one signIn entrypoint:
  pages: {
    signIn: '/auth/signin'
  }
}

export default NextAuth(authOptions)
