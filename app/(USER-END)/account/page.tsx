import React from "react";
import Link from "next/link";
import { Header } from "@/components/shared/header";
import { getCurrentUser, type User } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function AccountPage() {
  const user: User | null = await getCurrentUser();

  return (
    <section className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto py-8">
        {/* Breadcrumbs */}
        <nav className="text-sm mb-6">
          <Link href="/" className="text-blue-600 hover:underline">
            Home
          </Link>
          <span className="mx-2 text-gray-500">/</span>
          <span className="text-gray-700">Account</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar menu */}
          <aside className="w-full lg:w-1/4">
            <Card>
              <CardHeader>
                <CardTitle>Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <nav>
                  <ul className="space-y-2">
                    <li>
                      <Link
                        href="/account"
                        className="block px-3 py-2 rounded hover:bg-gray-100"
                      >
                        Profile Details
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/account/orders"
                        className="block px-3 py-2 rounded hover:bg-gray-100"
                      >
                        Orders
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/account/wishlist"
                        className="block px-3 py-2 rounded hover:bg-gray-100"
                      >
                        Wishlist
                      </Link>
                    </li>
                  </ul>
                </nav>
              </CardContent>
            </Card>
          </aside>

          {/* Main content */}
          <main className="w-full lg:w-3/4 space-y-8">
            <ProfileSection user={user} />
            <Separator />
            <OrdersSection />
            <Separator />
            <WishlistSection />
          </main>
        </div>
      </div>
    </section>
  );
}

function ProfileSection({ user }: { user: User | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Details</CardTitle>
      </CardHeader>
      <CardContent>
        {user ? (
          <div className="space-y-4">
            <p>
              <strong>Name:</strong> {user.name}
            </p>
            <p>
              <strong>Email:</strong> {user.email}
            </p>
            <Link href="/account/edit">
              <Button variant="outline">Edit Profile</Button>
            </Link>
          </div>
        ) : (
          <p>
            Please{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              log in
            </Link>{" "}
            to view your profile.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function OrdersSection() {
  // TODO: Fetch real orders from your database
  const orders: Array<{
    id: string;
    date: string;
    items: { name: string }[];
    status: string;
  }> = [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Orders</CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length > 0 ? (
          <table className="w-full table-auto">
            <thead>
              <tr>
                <th className="text-left py-2">Order #</th>
                <th className="text-left py-2">Date Bought</th>
                <th className="text-left py-2">Items</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="py-2">{order.id}</td>
                  <td className="py-2">
                    {new Date(order.date).toLocaleDateString()}
                  </td>
                  <td className="py-2">
                    {order.items.map((i) => i.name).join(", ")}
                  </td>
                  <td className="py-2">{order.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>You haven’t placed any orders yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

function WishlistSection() {
  // TODO: Fetch real wishlist items from your database
  const wishlist: Array<{
    id: string;
    name: string;
    price: string;
    image: string;
  }> = [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Wishlist</CardTitle>
      </CardHeader>
      <CardContent>
        {wishlist.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {wishlist.map((item) => (
              <div key={item.id} className="border rounded p-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-32 object-cover mb-2 rounded"
                />
                <p className="font-medium">{item.name}</p>
                <p className="text-gray-600">{item.price}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>Your wishlist is empty.</p>
        )}
      </CardContent>
    </Card>
  );
}
