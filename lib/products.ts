// lib/products.ts

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  basePrice?: number;
  category: string;
  description: string;
  inStock: number;
  moreImages: string[]; // additional photos for the gallery
}

// Example dummy dataset:
export const ALL_PRODUCTS: Product[] = [
  // ─── Corporate Wears ─────────────────────────────────────────────────────
  {
    id: "cw-1",
    name: "Girly White Shirt With Denim Skirt",
    imageUrl:
      "https://i0.wp.com/kipfashion.com/wp-content/uploads/2021/02/Aadaeze-Asymmetric-Africa-print-dress-1-scaled.jpg?fit=430%2C645&ssl=1",
    price: 520,
    basePrice: 650,
    category: "corporate-wears",
    description:
      "A chic girly white button-down shirt paired with a tailored denim skirt. Perfect for a professional yet playful office look.",
    inStock: 25,
    moreImages: [
      "https://i0.wp.com/kipfashion.com/wp-content/uploads/2021/02/Aadaeze-Asymmetric-Africa-print-dress-1-scaled.jpg?fit=430%2C645&ssl=1",
      "https://i.pinimg.com/236x/45/38/75/45387519561b7b80668941f2c09124f0.jpg",
      "https://i.pinimg.com/236x/6e/6a/0b/6e6a0b1a8a58919a08ea621ffbd82ee1.jpg",
    ],
  },
  {
    id: "cw-2",
    name: "Classic Black Blazer for Ladies",
    imageUrl:
      "https://i.pinimg.com/236x/6e/6a/0b/6e6a0b1a8a58919a08ea621ffbd82ee1.jpg",
    price: 750,
    basePrice: 900,
    category: "corporate-wears",
    description:
      "A timeless black blazer cut for a feminine silhouette. Ideal for board meetings or upscale events.",
    inStock: 40,
    moreImages: [
      "https://i.pinimg.com/236x/6e/6a/0b/6e6a0b1a8a58919a08ea621ffbd82ee1.jpg",
      "https://i0.wp.com/kipfashion.com/wp-content/uploads/2021/02/Aadaeze-Asymmetric-Africa-print-dress-1-scaled.jpg?fit=430%2C645&ssl=1",
      "https://www.shutterstock.com/image-photo/full-body-photo-dreamy-young-600nw-2019387041.jpg",
    ],
  },
  {
    id: "cw-3",
    name: "Tailored Grey Suit Jacket & Pants",
    imageUrl:
      "https://i.pinimg.com/236x/45/38/75/45387519561b7b80668941f2c09124f0.jpg",
    price: 1280,
    basePrice: 1500,
    category: "corporate-wears",
    description:
      "A sophisticated grey suit set—jacket and matching pants—crafted for a sharp, professional appearance.",
    inStock: 15,
    moreImages: [
      "https://i.pinimg.com/236x/45/38/75/45387519561b7b80668941f2c09124f0.jpg",
      "https://i0.wp.com/kipfashion.com/wp-content/uploads/2021/02/Aadaeze-Asymmetric-Africa-print-dress-1-scaled.jpg?fit=430%2C645&ssl=1",
      "https://i.pinimg.com/236x/6e/6a/0b/6e6a0b1a8a58919a08ea621ffbd82ee1.jpg",
    ],
  },
  {
    id: "cw-4",
    name: "Women’s Navy Pencil Skirt & Blouse Combo",
    imageUrl:
      "https://www.shutterstock.com/image-photo/full-body-photo-dreamy-young-600nw-2019387041.jpg",
    price: 660,
    basePrice: 800,
    category: "corporate-wears",
    description:
      "A navy pencil skirt paired with a crisp blouse—elegant and polished for workplace success.",
    inStock: 30,
    moreImages: [
      "https://www.shutterstock.com/image-photo/full-body-photo-dreamy-young-600nw-2019387041.jpg",
      "https://i.pinimg.com/236x/45/38/75/45387519561b7b80668941f2c09124f0.jpg",
      "https://i0.wp.com/kipfashion.com/wp-content/uploads/2021/02/Aadaeze-Asymmetric-Africa-print-dress-1-scaled.jpg?fit=430%2C645&ssl=1",
    ],
  },

  // ─── African Print ─────────────────────────────────────────────────────────
  {
    id: "ap-1",
    name: "Vibrant Ankara Maxi Dress",
    imageUrl:
      "https://www.shutterstock.com/image-photo/full-body-photo-dreamy-young-600nw-2019387041.jpg",
    price: 350,
    category: "african-print",
    description:
      "A flowing ankle-length Ankara maxi dress in vibrant prints—perfect for standing out at any event.",
    inStock: 50,
    moreImages: [
      "https://www.shutterstock.com/image-photo/full-body-photo-dreamy-young-600nw-2019387041.jpg",
      "https://i.pinimg.com/236x/6e/6a/0b/6e6a0b1a8a58919a08ea621ffbd82ee1.jpg",
      "https://i0.wp.com/kipfashion.com/wp-content/uploads/2021/02/Aadaeze-Asymmetric-Africa-print-dress-1-scaled.jpg?fit=430%2C645&ssl=1",
    ],
  },
  {
    id: "ap-2",
    name: "Geometric African Print Top & Pants",
    imageUrl:
      "https://i.pinimg.com/236x/6e/6a/0b/6e6a0b1a8a58919a08ea621ffbd82ee1.jpg",
    price: 420,
    basePrice: 500,
    category: "african-print",
    description:
      "A matching set featuring a geometric print top and pants—bold style with a modern twist.",
    inStock: 35,
    moreImages: [
      "https://i.pinimg.com/236x/6e/6a/0b/6e6a0b1a8a58919a08ea621ffbd82ee1.jpg",
      "https://i0.wp.com/kipfashion.com/wp-content/uploads/2021/02/Aadaeze-Asymmetric-Africa-print-dress-1-scaled.jpg?fit=430%2C645&ssl=1",
      "https://www.shutterstock.com/image-photo/full-body-photo-dreamy-young-600nw-2019387041.jpg",
    ],
  },
  {
    id: "ap-3",
    name: "Traditional Dashiki Shift Dress",
    imageUrl:
      "https://i0.wp.com/kipfashion.com/wp-content/uploads/2021/02/Aadaeze-Asymmetric-Africa-print-dress-1-scaled.jpg?fit=430%2C645&ssl=1",
    price: 500,
    category: "african-print",
    description:
      "Classic Dashiki-style shift dress in traditional prints—comfort meets culture.",
    inStock: 20,
    moreImages: [
      "https://i0.wp.com/kipfashion.com/wp-content/uploads/2021/02/Aadaeze-Asymmetric-Africa-print-dress-1-scaled.jpg?fit=430%2C645&ssl=1",
      "https://i.pinimg.com/236x/6e/6a/0b/6e6a0b1a8a58919a08ea621ffbd82ee1.jpg",
      "https://i.pinimg.com/236x/45/38/75/45387519561b7b80668941f2c09124f0.jpg",
    ],
  },
  {
    id: "ap-4",
    name: "Modern Kente Fabric Co-Ord Set",
    imageUrl:
      "https://i0.wp.com/kipfashion.com/wp-content/uploads/2021/02/Aadaeze-Asymmetric-Africa-print-dress-1-scaled.jpg?fit=430%2C645&ssl=1",
    price: 620,
    basePrice: 700,
    category: "african-print",
    description:
      "A contemporary Kente co-ord set—blouse and skirt—in vibrant traditional motifs.",
    inStock: 18,
    moreImages: [
      "https://i0.wp.com/kipfashion.com/wp-content/uploads/2021/02/Aadaeze-Asymmetric-Africa-print-dress-1-scaled.jpg?fit=430%2C645&ssl=1",
      "https://i.pinimg.com/236x/45/38/75/45387519561b7b80668941f2c09124f0.jpg",
      "https://i.pinimg.com/236x/6e/6a/0b/6e6a0b1a8a58919a08ea621ffbd82ee1.jpg",
    ],
  },

  // ─── Casual Looks ───────────────────────────────────────────────────────────
  {
    id: "cl-1",
    name: "Girly White Shirt With Denim Shorts",
    imageUrl:
      "https://i0.wp.com/kipfashion.com/wp-content/uploads/2021/02/Aadaeze-Asymmetric-Africa-print-dress-1-scaled.jpg?fit=430%2C645&ssl=1",
    price: 280,
    category: "casual-looks",
    description:
      "A relaxed white tee paired with denim shorts—easygoing style for everyday wear.",
    inStock: 60,
    moreImages: [
      "https://i0.wp.com/kipfashion.com/wp-content/uploads/2021/02/Aadaeze-Asymmetric-Africa-print-dress-1-scaled.jpg?fit=430%2C645&ssl=1",
      "https://i.pinimg.com/236x/6e/6a/0b/6e6a0b1a8a58919a08ea621ffbd82ee1.jpg",
      "https://i.pinimg.com/236x/45/38/75/45387519561b7b80668941f2c09124f0.jpg",
    ],
  },
  {
    id: "cl-2",
    name: "Women’s Relaxed Fit T-shirt & Jeans",
    imageUrl:
      "https://i.pinimg.com/236x/6e/6a/0b/6e6a0b1a8a58919a08ea621ffbd82ee1.jpg",
    price: 320,
    basePrice: 400,
    category: "casual-looks",
    description:
      "A loose-fit T-shirt with comfortable jeans—perfect for casual afternoons or weekend outings.",
    inStock: 45,
    moreImages: [
      "https://i.pinimg.com/236x/6e/6a/0b/6e6a0b1a8a58919a08ea621ffbd82ee1.jpg",
      "https://i0.wp.com/kipfashion.com/wp-content/uploads/2021/02/Aadaeze-Asymmetric-Africa-print-dress-1-scaled.jpg?fit=430%2C645&ssl=1",
      "https://i.pinimg.com/236x/45/38/75/45387519561b7b80668941f2c09124f0.jpg",
    ],
  },
  {
    id: "cl-3",
    name: "Casual Stripe Top & High Waist Pants",
    imageUrl:
      "https://i.pinimg.com/236x/6e/6a/0b/6e6a0b1a8a58919a08ea621ffbd82ee1.jpg",
    price: 390,
    category: "casual-looks",
    description:
      "A breezy striped top matched with high-waisted pants for a relaxed yet stylish look.",
    inStock: 30,
    moreImages: [
      "https://i.pinimg.com/236x/6e/6a/0b/6e6a0b1a8a58919a08ea621ffbd82ee1.jpg",
      "https://i0.wp.com/kipfashion.com/wp-content/uploads/2021/02/Aadaeze-Asymmetric-Africa-print-dress-1-scaled.jpg?fit=430%2C645&ssl=1",
      "https://i.pinimg.com/236x/45/38/75/45387519561b7b80668941f2c09124f0.jpg",
    ],
  },
  {
    id: "cl-4",
    name: "Summer Floral Blouse & Skirt Set",
    imageUrl:
      "https://i.pinimg.com/236x/6e/6a/0b/6e6a0b1a8a58919a08ea621ffbd82ee1.jpg",
    price: 450,
    basePrice: 550,
    category: "casual-looks",
    description:
      "A lightweight floral blouse and matching skirt—ideal for warm weather and beachside strolls.",
    inStock: 22,
    moreImages: [
      "https://i.pinimg.com/236x/6e/6a/0b/6e6a0b1a8a58919a08ea621ffbd82ee1.jpg",
      "https://i0.wp.com/kipfashion.com/wp-content/uploads/2021/02/Aadaeze-Asymmetric-Africa-print-dress-1-scaled.jpg?fit=430%2C645&ssl=1",
      "https://i.pinimg.com/236x/45/38/75/45387519561b7b80668941f2c09124f0.jpg",
    ],
  },

  // ─── I Have an Event ───────────────────────────────────────────────────────
  {
    id: "ev-1",
    name: "Elegant White Evening Gown",
    imageUrl:
      "https://i.pinimg.com/236x/6e/6a/0b/6e6a0b1a8a58919a08ea621ffbd82ee1.jpg",
    price: 1250,
    basePrice: 1500,
    category: "i-have-an-event",
    description:
      "A floor-length white evening gown with delicate draping—perfect for galas and formal events.",
    inStock: 10,
    moreImages: [
      "https://i.pinimg.com/236x/6e/6a/0b/6e6a0b1a8a58919a08ea621ffbd82ee1.jpg",
      "https://www.shutterstock.com/image-photo/full-body-photo-dreamy-young-600nw-2019387041.jpg",
      "https://i0.wp.com/kipfashion.com/wp-content/uploads/2021/02/Aadaeze-Asymmetric-Africa-print-dress-1-scaled.jpg?fit=430%2C645&ssl=1",
    ],
  },
  {
    id: "ev-2",
    name: "Satin Black Cocktail Dress",
    imageUrl:
      "https://www.shutterstock.com/image-photo/full-body-photo-dreamy-young-600nw-2019387041.jpg",
    price: 980,
    category: "i-have-an-event",
    description:
      "A sleek black satin cocktail dress—ideal for evening soirées and upscale parties.",
    inStock: 8,
    moreImages: [
      "https://www.shutterstock.com/image-photo/full-body-photo-dreamy-young-600nw-2019387041.jpg",
      "https://i0.wp.com/kipfashion.com/wp-content/uploads/2021/02/Aadaeze-Asymmetric-Africa-print-dress-1-scaled.jpg?fit=430%2C645&ssl=1",
      "https://i.pinimg.com/236x/6e/6a/0b/6e6a0b1a8a58919a08ea621ffbd82ee1.jpg",
    ],
  },
  {
    id: "ev-3",
    name: "Red Mermaid Gown with Beaded Bodice",
    imageUrl:
      "https://i.pinimg.com/236x/6e/6a/0b/6e6a0b1a8a58919a08ea621ffbd82ee1.jpg",
    price: 1350,
    basePrice: 1600,
    category: "i-have-an-event",
    description:
      "A striking red mermaid silhouette gown adorned with intricate beadwork—designed to turn heads.",
    inStock: 5,
    moreImages: [
      "https://i.pinimg.com/236x/6e/6a/0b/6e6a0b1a8a58919a08ea621ffbd82ee1.jpg",
      "https://www.shutterstock.com/image-photo/full-body-photo-dreamy-young-600nw-2019387041.jpg",
      "https://i0.wp.com/kipfashion.com/wp-content/uploads/2021/02/Aadaeze-Asymmetric-Africa-print-dress-1-scaled.jpg?fit=430%2C645&ssl=1",
    ],
  },
  {
    id: "ev-4",
    name: "Silver Sequin Party Dress",
    imageUrl:
      "https://www.shutterstock.com/image-photo/full-body-photo-dreamy-young-600nw-2019387041.jpg",
    price: 1150,
    category: "i-have-an-event",
    description:
      "A dazzling silver sequin dress—perfect for making an entrance at any celebration.",
    inStock: 12,
    moreImages: [
      "https://www.shutterstock.com/image-photo/full-body-photo-dreamy-young-600nw-2019387041.jpg",
      "https://i.pinimg.com/236x/45/38/75/45387519561b7b80668941f2c09124f0.jpg",
      "https://i0.wp.com/kipfashion.com/wp-content/uploads/2021/02/Aadaeze-Asymmetric-Africa-print-dress-1-scaled.jpg?fit=430%2C645&ssl=1",
    ],
  },
];

/** Fetch “all” or “by category” */
export function getProductsByCategory(slug: string): Product[] {
  if ( slug === "corporate-wears" || slug === "casual-looks" || slug === "i-have-an-event" || slug === "african-print") {
    return ALL_PRODUCTS;
  }
  return ALL_PRODUCTS.filter((p) => p.category === slug);
}

/** Fetch a single product by ID (for product details page) */
export function getProductById(id: string): Product | undefined {
  return ALL_PRODUCTS.find((p) => p.id === id);
}
