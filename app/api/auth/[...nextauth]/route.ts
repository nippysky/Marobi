import { authOptions } from "@/lib/authOptions"
import NextAuth from "next-auth"

export const GET  = NextAuth(authOptions)
export const POST = NextAuth(authOptions)
