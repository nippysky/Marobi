import { PrismaClient } from "@/lib/generated/prisma-client";  // ← use the generated folder name

export const prisma = new PrismaClient();                      // ← export a named `prisma`
