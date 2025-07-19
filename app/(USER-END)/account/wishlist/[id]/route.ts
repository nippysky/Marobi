import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/db"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    await prisma.wishlistItem.deleteMany({
      where: {
        id: params.id,
        customer: { email: session.user.email },
      },
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Failed to remove item" },
      { status: 500 }
    )
  }
}
