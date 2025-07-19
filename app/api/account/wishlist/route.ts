import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const items = await prisma.wishlistItem.findMany({
      where: {
        customer: { email: session.user.email },
      },
      orderBy: { addedAt: "desc" },
      select: {
        id: true,
        addedAt: true,
        product: {
          select: {
            id: true,
            name: true,
            image: true,
            category: true,
            priceNGN: true,
            priceUSD: true,
            priceEUR: true,
            priceGBP: true,
          },
        },
      },
    })
    return NextResponse.json(items)
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Failed to load wishlist items" },
      { status: 500 }
    )
  }
}
