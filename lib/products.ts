
export interface Review {
  userId: string;
  rating: number;      // 1–5 stars
  comment: string;
  date: string;        // ISO date or whatever format you prefer
}

export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  basePrice?: number;
  category: string;
  description: string;
  inStock: number;
  moreImages: string[];
  reviews?: Review[];   // ← new optional field for future use
}

// ... ALL_PRODUCTS, getProductsByCategory, getProductById, etc. remain unchanged ...


// Example dummy dataset:
export const ALL_PRODUCTS: Product[] = [
  // ─── Corporate Wears ─────────────────────────────────────────────────────
  {
    id: "cw-1",
    name: "Girly White Shirt With Denim Skirt",
    imageUrl:
      "https://plus.unsplash.com/premium_photo-1732464750981-2dfaa38f7d3a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    price: 520,
    basePrice: 650,
    category: "corporate-wears",
    description:
      "A chic girly white button-down shirt paired with a tailored denim skirt. Perfect for a professional yet playful office look.",
    inStock: 25,
    moreImages: [
      "https://images.unsplash.com/photo-1709809081557-78f803ce93a0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8QWZyaWNhbiUyMGZlbWFsZSUyMGZhc2hpb24lMjBwb3RyYWl0fGVufDB8fDB8fHww",
      "https://images.unsplash.com/photo-1629160477511-e5e730a661ee?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://plus.unsplash.com/premium_photo-1732464750981-2dfaa38f7d3a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    ],
  },
  {
    id: "cw-2",
    name: "Classic Black Blazer for Ladies",
    imageUrl:
      "https://images.unsplash.com/photo-1742473716872-ff82599f90db?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    price: 750,
    basePrice: 900,
    category: "corporate-wears",
    description:
      "A timeless black blazer cut for a feminine silhouette. Ideal for board meetings or upscale events.",
    inStock: 40,
    moreImages: [
      "https://plus.unsplash.com/premium_photo-1666789257987-324048d00dfb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8QWZyaWNhbiUyMGZlbWFsZSUyMGZhc2hpb24lMjBwb3RyYWl0fGVufDB8fDB8fHww",
      "https://images.unsplash.com/photo-1680879444340-5db909e95127?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1742473716872-ff82599f90db?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    ],
  },
  {
    id: "cw-3",
    name: "Tailored Grey Suit Jacket & Pants",
    imageUrl:
      "https://images.unsplash.com/photo-1663044023378-7316615967a0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    price: 1280,
    basePrice: 1500,
    category: "corporate-wears",
    description:
      "A sophisticated grey suit set—jacket and matching pants—crafted for a sharp, professional appearance.",
    inStock: 15,
    moreImages: [
      "https://images.unsplash.com/photo-1717064153056-84b0e7c8bf15?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjN8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1666974931801-499a577af99d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzF8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1667366925528-b85a9ec15d3c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzR8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    ],
  },
  {
    id: "cw-4",
    name: "Women’s Navy Pencil Skirt & Blouse Combo",
    imageUrl:
      "https://images.unsplash.com/photo-1667366925528-b85a9ec15d3c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzR8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    price: 660,
    basePrice: 800,
    category: "corporate-wears",
    description:
      "A navy pencil skirt paired with a crisp blouse—elegant and polished for workplace success.",
    inStock: 30,
    moreImages: [
      "https://images.unsplash.com/photo-1733324961705-97bd6cd7f4ba?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDB8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1600075113742-7548019e70ff?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTF8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1600075113742-7548019e70ff?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTF8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    ],
  },

  // ─── African Print ─────────────────────────────────────────────────────────
  {
    id: "ap-1",
    name: "Vibrant Ankara Maxi Dress",
    imageUrl:
      "https://images.unsplash.com/photo-1590670796065-5c2469672e18?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzV8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    price: 350,
    category: "african-print",
    description:
      "A flowing ankle-length Ankara maxi dress in vibrant prints—perfect for standing out at any event.",
    inStock: 50,
    moreImages: [
      "https://images.unsplash.com/photo-1733324961705-97bd6cd7f4ba?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDB8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1600075113742-7548019e70ff?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTF8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1600075113742-7548019e70ff?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTF8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    ],
  },
  {
    id: "ap-2",
    name: "Geometric African Print Top & Pants",
    imageUrl:
      "https://images.unsplash.com/photo-1717454163803-4d1a14e113c9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDZ8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    price: 420,
    basePrice: 500,
    category: "african-print",
    description:
      "A matching set featuring a geometric print top and pants—bold style with a modern twist.",
    inStock: 35,
    moreImages: [
      "https://images.unsplash.com/photo-1636342518291-92b11558b405?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjJ8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1663044023988-6682a5e55a5e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjN8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://plus.unsplash.com/premium_photo-1682125672174-6b5c8909dc4e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Njl8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    ],
  },
  {
    id: "ap-3",
    name: "Traditional Dashiki Shift Dress",
    imageUrl:
      "https://images.unsplash.com/photo-1730140183778-b220315011fa?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nzh8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    price: 500,
    category: "african-print",
    description:
      "Classic Dashiki-style shift dress in traditional prints—comfort meets culture.",
    inStock: 20,
    moreImages: [
      "https://images.unsplash.com/photo-1730140183778-b220315011fa?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nzh8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1625843699905-a768871b51e0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nzl8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1712149463355-0ea04d43187f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODR8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    ],
  },
  {
    id: "ap-4",
    name: "Modern Kente Fabric Co-Ord Set",
    imageUrl:
      "https://images.unsplash.com/photo-1712149463355-0ea04d43187f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODR8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    price: 620,
    basePrice: 700,
    category: "african-print",
    description:
      "A contemporary Kente co-ord set—blouse and skirt—in vibrant traditional motifs.",
    inStock: 18,
    moreImages: [
      "https://images.unsplash.com/photo-1712149463355-0ea04d43187f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODR8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1654967823638-62acf4987dfd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTAwfHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
      "https://images.unsplash.com/photo-1654967823638-62acf4987dfd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTAwfHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
    ],
  },

  // ─── Casual Looks ───────────────────────────────────────────────────────────
  {
    id: "cl-1",
    name: "Girly White Shirt With Denim Shorts",
    imageUrl:
      "https://images.unsplash.com/photo-1663044023244-fd0f2ec01a21?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OTZ8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    price: 280,
    category: "casual-looks",
    description:
      "A relaxed white tee paired with denim shorts—easygoing style for everyday wear.",
    inStock: 60,
    moreImages: [
      "https://images.unsplash.com/photo-1713845784494-33f5d1f96d25?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTA0fHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
      "https://images.unsplash.com/photo-1696962701419-6f510910e838?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OTl8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1696962701419-6f510910e838?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OTl8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    ],
  },
  {
    id: "cl-2",
    name: "Women’s Relaxed Fit T-shirt & Jeans",
    imageUrl:
      "https://images.unsplash.com/photo-1601653233006-5c9fd30eab12?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTMyfHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
    price: 320,
    basePrice: 400,
    category: "casual-looks",
    description:
      "A loose-fit T-shirt with comfortable jeans—perfect for casual afternoons or weekend outings.",
    inStock: 45,
    moreImages: [
      "https://images.unsplash.com/photo-1601653233006-5c9fd30eab12?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTMyfHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
      "https://images.unsplash.com/photo-1601653233006-5c9fd30eab12?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTMyfHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
      "https://images.unsplash.com/photo-1733322987025-ab3d2d96e347?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTU4fHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
    ],
  },
  {
    id: "cl-3",
    name: "Casual Stripe Top & High Waist Pants",
    imageUrl:
      "https://images.unsplash.com/photo-1733322987025-ab3d2d96e347?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTU4fHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
    price: 390,
    category: "casual-looks",
    description:
      "A breezy striped top matched with high-waisted pants for a relaxed yet stylish look.",
    inStock: 30,
    moreImages: [
      "https://images.unsplash.com/photo-1567715809585-2047fad7f96b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTYyfHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
      "https://images.unsplash.com/photo-1567715809585-2047fad7f96b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTYyfHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
      "https://images.unsplash.com/photo-1567715809585-2047fad7f96b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTYyfHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
    ],
  },
  {
    id: "cl-4",
    name: "Summer Floral Blouse & Skirt Set",
    imageUrl:
      "https://images.unsplash.com/photo-1567715809585-2047fad7f96b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTYyfHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
    price: 450,
    basePrice: 550,
    category: "casual-looks",
    description:
      "A lightweight floral blouse and matching skirt—ideal for warm weather and beachside strolls.",
    inStock: 22,
    moreImages: [
      "https://images.unsplash.com/photo-1597409836417-6bcae30f3c1e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTY0fHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
      "https://plus.unsplash.com/premium_photo-1666789257909-ea31315d1113?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTY5fHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
      "https://plus.unsplash.com/premium_photo-1666789257909-ea31315d1113?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTY5fHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
    ],
  },

  // ─── I Have an Event ───────────────────────────────────────────────────────
  {
    id: "ev-1",
    name: "Elegant White Evening Gown",
    imageUrl:
      "https://plus.unsplash.com/premium_photo-1701205421505-340ee702de8c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTczfHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
    price: 1250,
    basePrice: 1500,
    category: "i-have-an-event",
    description:
      "A floor-length white evening gown with delicate draping—perfect for galas and formal events.",
    inStock: 10,
    moreImages: [
      "https://images.unsplash.com/photo-1712196053033-d35490ace1f4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTgyfHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
      "https://images.unsplash.com/photo-1712196053033-d35490ace1f4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTgyfHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
      "https://images.unsplash.com/photo-1643616964756-7e2822e38ee9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YmxhY2slMjBmZW1hbGUlMjBldmVudCUyMGZhc2hpb24lMjBwb3RyYWl0fGVufDB8fDB8fHww",
    ],
  },
  {
    id: "ev-2",
    name: "Satin Black Cocktail Dress",
    imageUrl:
      "https://images.unsplash.com/photo-1640600184159-7d469fa46286?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjR8fGJsYWNrJTIwZmVtYWxlJTIwZXZlbnQlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    price: 980,
    category: "i-have-an-event",
    description:
      "A sleek black satin cocktail dress—ideal for evening soirées and upscale parties.",
    inStock: 8,
    moreImages: [
      "https://images.unsplash.com/photo-1731412921161-3ef636e99968?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjZ8fGJsYWNrJTIwZmVtYWxlJTIwZXZlbnQlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1731412921161-3ef636e99968?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjZ8fGJsYWNrJTIwZmVtYWxlJTIwZXZlbnQlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1707162740880-d814829a0679?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzV8fGJsYWNrJTIwZmVtYWxlJTIwZXZlbnQlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    ],
  },
  {
    id: "ev-3",
    name: "Red Mermaid Gown with Beaded Bodice",
    imageUrl:
      "https://images.unsplash.com/photo-1707162740880-d814829a0679?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzV8fGJsYWNrJTIwZmVtYWxlJTIwZXZlbnQlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    price: 1350,
    basePrice: 1600,
    category: "i-have-an-event",
    description:
      "A striking red mermaid silhouette gown adorned with intricate beadwork—designed to turn heads.",
    inStock: 5,
    moreImages: [
      "https://images.unsplash.com/photo-1613186267203-f72a3785a01a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDd8fGJsYWNrJTIwZmVtYWxlJTIwZXZlbnQlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1613186267203-f72a3785a01a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDd8fGJsYWNrJTIwZmVtYWxlJTIwZXZlbnQlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1615453590051-9cc24146d6ae?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjB8fGJsYWNrJTIwZmVtYWxlJTIwZXZlbnQlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    ],
  },
  {
    id: "ev-4",
    name: "Silver Sequin Party Dress",
    imageUrl:
      "https://images.unsplash.com/photo-1638500123083-c642027f0259?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Njh8fGJsYWNrJTIwZmVtYWxlJTIwZXZlbnQlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    price: 1150,
    category: "i-have-an-event",
    description:
      "A dazzling silver sequin dress—perfect for making an entrance at any celebration.",
    inStock: 12,
    moreImages: [
      "https://images.unsplash.com/photo-1625027663037-96e4560e97fa?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODN8fGJsYWNrJTIwZmVtYWxlJTIwZXZlbnQlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1625027663037-96e4560e97fa?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODN8fGJsYWNrJTIwZmVtYWxlJTIwZXZlbnQlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1562594342-9339b30426a6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTA0fHxibGFjayUyMGZlbWFsZSUyMGV2ZW50JTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
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
