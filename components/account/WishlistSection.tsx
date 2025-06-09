import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WishlistSection() {
  // TODO: Fetch your real wishlist items
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
