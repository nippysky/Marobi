import { getServerSession } from "next-auth/next"
import { authOptions }        from "@/app/api/auth/[...nextauth]/route"
import { prisma }             from "@/lib/db"
import { NextResponse }       from "next/server"

export async function GET(request: Request) {
    
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    )
  }

  const user = await prisma.customer.findUnique({
    where: { email: session.user.email },
    select: {
      // basic profile
      id:              true,
      firstName:       true,
      lastName:        true,
      email:           true,
      phone:           true,
      deliveryAddress: true,
      billingAddress:  true,
      country:         true,
      state:           true,
      registeredAt:    true,
      lastLogin:       true,

      // include all their orders
      orders: {
        orderBy: { createdAt: "desc" },  // newest first
        select: {
          id:            true,
          status:        true,
          currency:      true,
          totalAmount:   true,
          totalNGN:      true,
          paymentMethod: true,
          createdAt:     true,

          // and for each order, its items
          items: {
            select: {
              id:        true,
              name:      true,
              image:     true,
              category:  true,
              quantity:  true,
              lineTotal: true,
              color:     true,
              size:      true,
            },
          },
        },
      },
    },
  })

  if (!user) {
    return NextResponse.json(
      { error: "User not found" },
      { status: 404 }
    )
  }

  return NextResponse.json(user)
}
