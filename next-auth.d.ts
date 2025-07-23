import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT as DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      /** The user's database ID */
      id: string
      /** UI‑level access role (SuperAdmin, OrderAdmin, etc.) */
      role: string
      /** Day‑to‑day job roles array */
      jobRoles: string[]
    } & DefaultSession["user"]
  }

  // only needed if you ever use `session.user` on the server side
  interface User extends DefaultUser {
    id: string
    role: string
    jobRoles: string[]
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id?: string
    role?: string
    jobRoles?: string[]
  }
}
