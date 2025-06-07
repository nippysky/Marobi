// 1. Review stays as-is
export interface Review {
  userId: string;
  rating: number;
  comment: string;
  date: string;
}

// 2. Price wrapper for currencies
export interface PriceSet {
  NGN: number;
  USD: number;
  EUR: number;
  GBP: number;
}

// 3. Variant Model (color + size level)
export interface ProductVariant {
  color: string;
  sizes: {
    size: string;
    inStock: number;
  }[];
}

// 4. Main Product
export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  description: string;
  moreImages: string[];
  reviews?: Review[];
  variants: ProductVariant[];

  prices: PriceSet;
  isDiscounted: boolean;
  discountPrices?: PriceSet;
  basePrices?: PriceSet;

  isSizeModifiable: boolean; // If true, user can input custom size if not in sizes
}



// Example dummy dataset:

export const ALL_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Corporate-Wears Outfit 1",
    imageUrl:     "https://plus.unsplash.com/premium_photo-1732464750981-2dfaa38f7d3a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    category: "corporate-wears",
    description: "Stylish and comfortable corporate wear outfit.",
    moreImages: [     "https://images.unsplash.com/photo-1709809081557-78f803ce93a0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8QWZyaWNhbiUyMGZlbWFsZSUyMGZhc2hpb24lMjBwb3RyYWl0fGVufDB8fDB8fHww",
      "https://images.unsplash.com/photo-1629160477511-e5e730a661ee?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "https://plus.unsplash.com/premium_photo-1732464750981-2dfaa38f7d3a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTd8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",],
    reviews: [],
    variants: [
      {
        color: "Charcoal Gray",
        sizes: [
          { size: "S", inStock: 3 },
          { size: "M", inStock: 6 },
        ],
      },
    ],
    prices: {
      NGN: 35000,
      USD: 25,
      EUR: 23,
      GBP: 21,
    },
    isDiscounted: true,
    discountPrices: {
      NGN: 30000,
      USD: 22,
      EUR: 20,
      GBP: 19,
    },
    basePrices: {
      NGN: 35000,
      USD: 25,
      EUR: 23,
      GBP: 21,
    },
    isSizeModifiable: true,
  },
  {
    id: "2",
    name: "Corporate-Wears Outfit 2",
    imageUrl:     "https://images.unsplash.com/photo-1742473716872-ff82599f90db?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    category: "corporate-wears",
    description: "Elegant corporate design with breathable fabric.",
    moreImages: [
      "https://plus.unsplash.com/premium_photo-1666789257987-324048d00dfb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8QWZyaWNhbiUyMGZlbWFsZSUyMGZhc2hpb24lMjBwb3RyYWl0fGVufDB8fDB8fHww",
      "https://images.unsplash.com/photo-1680879444340-5db909e95127?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1742473716872-ff82599f90db?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    ],
    reviews: [{
    userId: "user101",
    rating: 5,
    comment: "Absolutely love the quality and fit—would buy again!",
    date: "2025-06-02",
  },
  {
    userId: "user202",
    rating: 3,
    comment: "Good design, but the fabric could feel softer.",
    date: "2025-05-28",
  },
  {
    userId: "user303",
    rating: 4,
    comment: "Stylish and true to size, just what I needed for work.",
    date: "2025-05-15",
  },
  {
    userId: "user404",
    rating: 2,
    comment: "Color faded slightly after first wash—be careful!",
    date: "2025-04-30",
  },],
    variants: [
      {
        color: "Midnight Blue",
        sizes: [
          { size: "M", inStock: 4 },
          { size: "L", inStock: 2 },
        ],
      },
    ],
    prices: {
      NGN: 40000,
      USD: 30,
      EUR: 27,
      GBP: 24,
    },
    isDiscounted: false,
    isSizeModifiable: false,
  },
  {
    id: "3",
    name: "Corporate-Wears Outfit 3",
    imageUrl:    "https://images.unsplash.com/photo-1663044023378-7316615967a0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    category: "corporate-wears",
    description: "Professional wear ideal for presentations.",
       moreImages: [
      "https://images.unsplash.com/photo-1717064153056-84b0e7c8bf15?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjN8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1666974931801-499a577af99d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzF8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1667366925528-b85a9ec15d3c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzR8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    ],
    reviews: [],
    variants: [
      {
        color: "Classic Black",
        sizes: [
          { size: "S", inStock: 1 },
          { size: "L", inStock: 3 },
        ],
      },
    ],
    prices: {
      NGN: 42000,
      USD: 32,
      EUR: 29,
      GBP: 26,
    },
    isDiscounted: true,
    discountPrices: {
      NGN: 38000,
      USD: 28,
      EUR: 25,
      GBP: 23,
    },
    basePrices: {
      NGN: 42000,
      USD: 32,
      EUR: 29,
      GBP: 26,
    },
    isSizeModifiable: true,
  },
  {
    id: "4",
    name: "Corporate-Wears Outfit 4",
    imageUrl:     "https://images.unsplash.com/photo-1667366925528-b85a9ec15d3c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzR8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    category: "corporate-wears",
    description: "Minimalist corporate attire for daily wear.",
     moreImages: [
      "https://images.unsplash.com/photo-1733324961705-97bd6cd7f4ba?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDB8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1600075113742-7548019e70ff?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTF8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1600075113742-7548019e70ff?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTF8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    ],
    reviews: [],
    variants: [
      {
        color: "Steel Gray",
        sizes: [
          { size: "M", inStock: 5 },
          { size: "XL", inStock: 1 },
        ],
      },
    ],
    prices: {
      NGN: 41000,
      USD: 31,
      EUR: 28,
      GBP: 25,
    },
    isDiscounted: false,
    isSizeModifiable: false,
  },

  // AFRICAN PRINT
  {
    id: "5",
    name: "African Print Outfit 1",
    imageUrl:       "https://images.unsplash.com/photo-1590670796065-5c2469672e18?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzV8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    category: "african-print",
    description: "Bold Ankara design with modern tailoring.",
      moreImages: [
      "https://images.unsplash.com/photo-1733324961705-97bd6cd7f4ba?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDB8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1600075113742-7548019e70ff?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTF8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1600075113742-7548019e70ff?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NTF8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    ],
    reviews: [],
    variants: [
      {
        color: "Kente",
        sizes: [
          { size: "M", inStock: 6 },
          { size: "L", inStock: 2 },
        ],
      },
    ],
    prices: {
      NGN: 30000,
      USD: 24,
      EUR: 22,
      GBP: 20,
    },
    isDiscounted: false,
    isSizeModifiable: true,
  },
  {
    id: "6",
    name: "African Print Outfit 2",
    imageUrl:    "https://images.unsplash.com/photo-1717454163803-4d1a14e113c9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDZ8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    category: "african-print",
    description: "Stylish tribal patterns with soft texture.",
     moreImages: [
      "https://images.unsplash.com/photo-1636342518291-92b11558b405?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjJ8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1663044023988-6682a5e55a5e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjN8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://plus.unsplash.com/premium_photo-1682125672174-6b5c8909dc4e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Njl8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    ],
    reviews: [],
    variants: [
      {
        color: "Ankara Red",
        sizes: [
          { size: "S", inStock: 2 },
          { size: "M", inStock: 0 },
        ],
      },
    ],
    prices: {
      NGN: 32000,
      USD: 26,
      EUR: 23,
      GBP: 21,
    },
    isDiscounted: true,
    discountPrices: {
      NGN: 29000,
      USD: 22,
      EUR: 20,
      GBP: 18,
    },
    basePrices: {
      NGN: 32000,
      USD: 26,
      EUR: 23,
      GBP: 21,
    },
    isSizeModifiable: true,
  },
  {
    id: "7",
    name: "African Print Outfit 3",
    imageUrl:    "https://images.unsplash.com/photo-1730140183778-b220315011fa?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nzh8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    category: "african-print",
    description: "Heritage-inspired fabric with sleek cut.",
    moreImages: [
      "https://images.unsplash.com/photo-1730140183778-b220315011fa?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nzh8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1625843699905-a768871b51e0?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nzl8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1712149463355-0ea04d43187f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODR8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    ],
    reviews: [],
    variants: [
      {
        color: "Tribal Blue",
        sizes: [{ size: "M", inStock: 3 }],
      },
    ],
    prices: {
      NGN: 33000,
      USD: 27,
      EUR: 24,
      GBP: 22,
    },
    isDiscounted: false,
    isSizeModifiable: false,
  },
  {
    id: "8",
    name: "African Print Outfit 4",
    imageUrl:    "https://images.unsplash.com/photo-1712149463355-0ea04d43187f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODR8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    category: "african-print",
    description: "Eye-catching pattern with a tailored fit.",
     moreImages: [
      "https://images.unsplash.com/photo-1712149463355-0ea04d43187f?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODR8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1654967823638-62acf4987dfd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTAwfHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
      "https://images.unsplash.com/photo-1654967823638-62acf4987dfd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTAwfHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
    ],
    reviews: [{
    userId: "user101",
    rating: 5,
    comment: "Absolutely love the quality and fit—would buy again!",
    date: "2025-06-02",
  },
  {
    userId: "user202",
    rating: 3,
    comment: "Good design, but the fabric could feel softer.",
    date: "2025-05-28",
  },
  {
    userId: "user303",
    rating: 4,
    comment: "Stylish and true to size, just what I needed for work.",
    date: "2025-05-15",
  },
  {
    userId: "user404",
    rating: 2,
    comment: "Color faded slightly after first wash—be careful!",
    date: "2025-04-30",
  },],
    variants: [
      {
        color: "Safari Gold",
        sizes: [{ size: "L", inStock: 5 }],
      },
    ],
    prices: {
      NGN: 34000,
      USD: 28,
      EUR: 25,
      GBP: 23,
    },
    isDiscounted: true,
    discountPrices: {
      NGN: 30000,
      USD: 24,
      EUR: 21,
      GBP: 19,
    },
    basePrices: {
      NGN: 34000,
      USD: 28,
      EUR: 25,
      GBP: 23,
    },
    isSizeModifiable: false,
  },

  // CASUAL LOOKS
  {
    id: "9",
    name: "Casual Looks Outfit 1",
    imageUrl:       "https://images.unsplash.com/photo-1663044023244-fd0f2ec01a21?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OTZ8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    category: "casual-looks",
    description: "Chill weekend tee and jogger set.",
    moreImages: ["https://images.unsplash.com/photo-1713845784494-33f5d1f96d25?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTA0fHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
      "https://images.unsplash.com/photo-1696962701419-6f510910e838?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OTl8fEFmcmljYW4lMjBmZW1hbGUlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D"],
    reviews: [  ],
    variants: [
      {
        color: "Washed Denim",
        sizes: [{ size: "S", inStock: 7 }],
      },
    ],
    prices: {
      NGN: 20000,
      USD: 15,
      EUR: 13,
      GBP: 12,
    },
    isDiscounted: false,
    isSizeModifiable: true,
  },
  {
    id: "10",
    name: "Casual Looks Outfit 2",
    imageUrl:       "https://images.unsplash.com/photo-1601653233006-5c9fd30eab12?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTMyfHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
    category: "casual-looks",
    description: "Soft cotton tee with trendy graphics.",
      moreImages: [
      "https://images.unsplash.com/photo-1601653233006-5c9fd30eab12?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTMyfHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
      "https://images.unsplash.com/photo-1601653233006-5c9fd30eab12?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTMyfHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
      "https://images.unsplash.com/photo-1733322987025-ab3d2d96e347?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTU4fHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
    ],
    reviews: [{
    userId: "user101",
    rating: 5,
    comment: "Absolutely love the quality and fit—would buy again!",
    date: "2025-06-02",
  },
  {
    userId: "user202",
    rating: 3,
    comment: "Good design, but the fabric could feel softer.",
    date: "2025-05-28",
  },
  {
    userId: "user303",
    rating: 4,
    comment: "Stylish and true to size, just what I needed for work.",
    date: "2025-05-15",
  },
  {
    userId: "user404",
    rating: 2,
    comment: "Color faded slightly after first wash—be careful!",
    date: "2025-04-30",
  },],
    variants: [
      {
        color: "Soft Olive",
        sizes: [{ size: "M", inStock: 4 }],
      },
    ],
    prices: {
      NGN: 21000,
      USD: 16,
      EUR: 14,
      GBP: 13,
    },
    isDiscounted: false,
    isSizeModifiable: false,
  },
  {
    id: "11",
    name: "Casual Looks Outfit 3",
    imageUrl:     "https://images.unsplash.com/photo-1567715809585-2047fad7f96b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTYyfHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
    category: "casual-looks",
    description: "Relaxed fit shirt for casual Fridays.",
    moreImages: [    "https://images.unsplash.com/photo-1733322987025-ab3d2d96e347?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTU4fHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D"],
    reviews: [],
    variants: [
      {
        color: "Charcoal Heather",
        sizes: [{ size: "L", inStock: 3 }],
      },
    ],
    prices: {
      NGN: 21500,
      USD: 17,
      EUR: 15,
      GBP: 13,
    },
    isDiscounted: true,
    discountPrices: {
      NGN: 19500,
      USD: 15,
      EUR: 13,
      GBP: 12,
    },
    basePrices: {
      NGN: 21500,
      USD: 17,
      EUR: 15,
      GBP: 13,
    },
    isSizeModifiable: false,
  },
  {
    id: "12",
    name: "Casual Looks Outfit 4",
    imageUrl:       "https://images.unsplash.com/photo-1567715809585-2047fad7f96b?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTYyfHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
    category: "casual-looks",
    description: "Breathable polo shirt with stretch.",
    moreImages: [      "https://images.unsplash.com/photo-1597409836417-6bcae30f3c1e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTY0fHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
      "https://plus.unsplash.com/premium_photo-1666789257909-ea31315d1113?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTY5fHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D"],
    reviews: [{
    userId: "user101",
    rating: 5,
    comment: "Absolutely love the quality and fit—would buy again!",
    date: "2025-06-02",
  },
  {
    userId: "user202",
    rating: 3,
    comment: "Good design, but the fabric could feel softer.",
    date: "2025-05-28",
  },
  {
    userId: "user303",
    rating: 4,
    comment: "Stylish and true to size, just what I needed for work.",
    date: "2025-05-15",
  },
  {
    userId: "user404",
    rating: 2,
    comment: "Color faded slightly after first wash—be careful!",
    date: "2025-04-30",
  },],
    variants: [
      {
        color: "Slate Green",
        sizes: [{ size: "M", inStock: 8 }],
      },
    ],
    prices: {
      NGN: 23000,
      USD: 18,
      EUR: 16,
      GBP: 14,
    },
    isDiscounted: true,
    discountPrices: {
      NGN: 20000,
      USD: 15,
      EUR: 14,
      GBP: 13,
    },
    basePrices: {
      NGN: 23000,
      USD: 18,
      EUR: 16,
      GBP: 14,
    },
    isSizeModifiable: true,
  },

  // I HAVE AN EVENT
  {
    id: "13",
    name: "Event Outfit 1",
    imageUrl:       "https://plus.unsplash.com/premium_photo-1701205421505-340ee702de8c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTczfHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
    category: "i-have-an-event",
    description: "Elegant outfit for weddings and ceremonies.",
    moreImages: [      "https://images.unsplash.com/photo-1712196053033-d35490ace1f4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTgyfHxBZnJpY2FuJTIwZmVtYWxlJTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",
      "https://images.unsplash.com/photo-1643616964756-7e2822e38ee9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YmxhY2slMjBmZW1hbGUlMjBldmVudCUyMGZhc2hpb24lMjBwb3RyYWl0fGVufDB8fDB8fHww",],
    reviews: [],
    variants: [
      {
        color: "Royal Purple",
        sizes: [{ size: "M", inStock: 4 }],
      },
    ],
    prices: {
      NGN: 45000,
      USD: 35,
      EUR: 33,
      GBP: 30,
    },
    isDiscounted: false,
    isSizeModifiable: true,
  },
  {
    id: "14",
    name: "Event Outfit 2",
    imageUrl:       "https://images.unsplash.com/photo-1640600184159-7d469fa46286?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjR8fGJsYWNrJTIwZmVtYWxlJTIwZXZlbnQlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    category: "i-have-an-event",
    description: "Glamorous fit for red carpet occasions.",
    moreImages: [    "https://images.unsplash.com/photo-1731412921161-3ef636e99968?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjZ8fGJsYWNrJTIwZmVtYWxlJTIwZXZlbnQlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1707162740880-d814829a0679?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzV8fGJsYWNrJTIwZmVtYWxlJTIwZXZlbnQlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D"],
    reviews: [],
    variants: [
      {
        color: "Champagne",
        sizes: [{ size: "L", inStock: 2 }],
      },
    ],
    prices: {
      NGN: 47000,
      USD: 37,
      EUR: 35,
      GBP: 32,
    },
    isDiscounted: true,
    discountPrices: {
      NGN: 43000,
      USD: 32,
      EUR: 30,
      GBP: 28,
    },
    basePrices: {
      NGN: 47000,
      USD: 37,
      EUR: 35,
      GBP: 32,
    },
    isSizeModifiable: false,
  },
  {
    id: "15",
    name: "Event Outfit 3",
    imageUrl:       "https://images.unsplash.com/photo-1707162740880-d814829a0679?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzV8fGJsYWNrJTIwZmVtYWxlJTIwZXZlbnQlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    category: "i-have-an-event",
    description: "Formal dinner gown with high slit.",
    moreImages: [    "https://images.unsplash.com/photo-1613186267203-f72a3785a01a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NDd8fGJsYWNrJTIwZmVtYWxlJTIwZXZlbnQlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1615453590051-9cc24146d6ae?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NjB8fGJsYWNrJTIwZmVtYWxlJTIwZXZlbnQlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",],
    reviews: [{
    userId: "user101",
    rating: 5,
    comment: "Absolutely love the quality and fit—would buy again!",
    date: "2025-06-02",
  },
  {
    userId: "user202",
    rating: 3,
    comment: "Good design, but the fabric could feel softer.",
    date: "2025-05-28",
  },
  {
    userId: "user303",
    rating: 4,
    comment: "Stylish and true to size, just what I needed for work.",
    date: "2025-05-15",
  },
  {
    userId: "user404",
    rating: 2,
    comment: "Color faded slightly after first wash—be careful!",
    date: "2025-04-30",
  },],
    variants: [
      {
        color: "Emerald",
        sizes: [{ size: "S", inStock: 1 }],
      },
    ],
    prices: {
      NGN: 49000,
      USD: 39,
      EUR: 37,
      GBP: 34,
    },
    isDiscounted: false,
    isSizeModifiable: true,
  },
  {
    id: "16",
    name: "Event Outfit 4",
    imageUrl:    "https://images.unsplash.com/photo-1638500123083-c642027f0259?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Njh8fGJsYWNrJTIwZmVtYWxlJTIwZXZlbnQlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
    category: "i-have-an-event",
    description: "Statement outfit for gala events.",
    moreImages: [    "https://images.unsplash.com/photo-1625027663037-96e4560e97fa?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODN8fGJsYWNrJTIwZmVtYWxlJTIwZXZlbnQlMjBmYXNoaW9uJTIwcG90cmFpdHxlbnwwfHwwfHx8MA%3D%3D",
      "https://images.unsplash.com/photo-1562594342-9339b30426a6?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTA0fHxibGFjayUyMGZlbWFsZSUyMGV2ZW50JTIwZmFzaGlvbiUyMHBvdHJhaXR8ZW58MHx8MHx8fDA%3D",],
    reviews: [{
    userId: "user101",
    rating: 5,
    comment: "Absolutely love the quality and fit—would buy again!",
    date: "2025-06-02",
  },
  {
    userId: "user202",
    rating: 3,
    comment: "Good design, but the fabric could feel softer.",
    date: "2025-05-28",
  },
  {
    userId: "user303",
    rating: 4,
    comment: "Stylish and true to size, just what I needed for work.",
    date: "2025-05-15",
  },
  {
    userId: "user404",
    rating: 2,
    comment: "Color faded slightly after first wash—be careful!",
    date: "2025-04-30",
  },],
    variants: [
      {
        color: "Ruby Red",
        sizes: [{ size: "M", inStock: 5 }],
      },
    ],
    prices: {
      NGN: 50000,
      USD: 40,
      EUR: 38,
      GBP: 35,
    },
    isDiscounted: true,
    discountPrices: {
      NGN: 46000,
      USD: 36,
      EUR: 34,
      GBP: 31,
    },
    basePrices: {
      NGN: 50000,
      USD: 40,
      EUR: 38,
      GBP: 35,
    },
    isSizeModifiable: false,
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
