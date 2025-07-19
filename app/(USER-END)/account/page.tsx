import Link from "next/link"
import { getServerSession } from "next-auth/next"
import { authOptions }      from "@/app/api/auth/[...nextauth]/route"
import { prisma }           from "@/lib/db"
import { redirect }         from "next/navigation"
import ProfileSection       from "@/components/account/ProfileSection"

export default async function AccountPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) redirect("/auth/login")

  const user = await prisma.customer.findUnique({
    where: { email: session.user.email },
    select: {
      id:              true,
      firstName:       true,
      lastName:        true,
      email:           true,
      phone:           true,
      deliveryAddress: true,
      billingAddress:  true,
      country:         true,  // ← grab country
      state:           true,  // ← grab state
      registeredAt:    true,
      lastLogin:       true,
    },
  })
  if (!user) redirect("/auth/login")

  // coerce nulls → empty strings, dates → ISO
  const profile = {
    id:              user.id,
    firstName:       user.firstName,
    lastName:        user.lastName,
    email:           user.email,
    phone:           user.phone,
    address:         user.deliveryAddress ?? "",
    billingAddress:  user.billingAddress ?? "",
    country:         user.country ?? "",
    state:           user.state ?? "",
    registeredAt:    user.registeredAt.toISOString(),
    lastLogin:       user.lastLogin?.toISOString() ?? null,
  }

  return (
    <>
      {/* Breadcrumbs */}
      <nav className="text-sm mb-6">
        <Link href="/" className="text-gray-700 hover:underline">
          Home
        </Link>
        <span className="mx-2 text-gray-500">/</span>
        <span className="text-gray-700">Account</span>
      </nav>

      <ProfileSection user={profile} />
    </>
  )
}
