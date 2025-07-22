import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import bcrypt from "bcrypt"
import { z } from "zod"
import { rateLimit } from "@/lib/rateLimiter"

const CredsSchema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be 8+ characters"),
  role:     z.enum(["customer", "staff"]),
})

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  cookies: {
    sessionToken: {
      name: "marobi_session",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "Email & Password",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
        role:     { label: "Role",     type: "text" },
      },
      async authorize(credentials, req) {
        // --- Rate limit by IP ---
        const ip = typeof req.headers?.get === "function"
          ? (req.headers.get("x-forwarded-for") ?? "unknown")
          : "unknown"
        const { ok, reset } = rateLimit(ip)
        if (!ok) {
          const wait = Math.ceil((reset - Date.now()) / 1000)
            .toString()
          throw new Error(`Too many login attempts. Try again in ${wait}s.`)
        }

        // --- Validate input shape ---
        const parsed = CredsSchema.safeParse(credentials)
        if (!parsed.success) {
            const msg = parsed.error.issues.map(i => i.message).join("; ")
            throw new Error(msg || "Invalid credentials format.")
        }

        let { email, password, role } = parsed.data
        email = email.trim().toLowerCase()

        // --- Customer login flow ---
        if (role === "customer") {
          const user = await prisma.customer.findUnique({ where: { email } })

          if (!user) {
            throw new Error("No account found with that email.")
          }
          if (!user.emailVerified) {
            throw new Error("Please verify your email before logging in.")
          }
          if (!user.passwordHash) {
            throw new Error("Password not set. Please reset your password.")
          }
          const valid = await bcrypt.compare(password, user.passwordHash)
          if (!valid) {
            throw new Error("Incorrect password.")
          }

            return {
              id:       user.id,
              name:     `${user.firstName} ${user.lastName}`,
              email:    user.email,
              role,
              jobRoles: [] as string[],
            }
        }

        // --- Staff login flow ---
        const staff = await prisma.staff.findUnique({ where: { email } })
        if (!staff) {
          throw new Error("Staff account not found.")
        }
        if (!staff.emailVerified) {
          throw new Error("Staff email not verified.")
        }
        if (!staff.passwordHash) {
          throw new Error("Password not set. Contact administrator.")
        }
        const staffValid = await bcrypt.compare(password, staff.passwordHash)
        if (!staffValid) {
          throw new Error("Incorrect password.")
        }

        return {
          id:       staff.id,
          name:     `${staff.firstName} ${staff.lastName}`,
          email:    staff.email,
          role:     staff.access,   // preserving existing design
          jobRoles: staff.jobRoles,
        }
      },
    }),
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
      session.user = session.user || {}
      session.user.role     = token.role as string
      session.user.jobRoles = token.jobRoles as string[]
      return session
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/"))     return `${baseUrl}${url}`
      if (url.startsWith(baseUrl)) return url
      return baseUrl
    },
  },

  pages: {
    signIn: "/auth/login",
    error:  "/",
  },
}

export const GET  = NextAuth(authOptions)
export const POST = NextAuth(authOptions)
