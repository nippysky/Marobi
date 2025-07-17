import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT as DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: DefaultSession["user"] & {
      /** UI‑level access role (SuperAdmin, OrderAdmin, etc.) */
      role: string
      /** Day‑to‑day job roles array */
      jobRoles: string[]
    }
  }

  // (only needed if you ever use `session.user` on server)
  interface User extends DefaultUser {
    role: string
    jobRoles: string[]
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    role?: string
    jobRoles?: string[]
  }
}
