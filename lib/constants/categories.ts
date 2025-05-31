export interface Category {
  slug: string;       // used in the URL, e.g. “corporate-wears”
  name: string;       // human‐readable title, e.g. “Corporate Wears”
  description?: string;
}

// A static list of categories:
export const CATEGORIES: Category[] = [
  {
    slug: "corporate-wears",
    name: "Corporate Wears",
    description: "Professional outfits for the workplace.",
  },
  {
    slug: "african-print",
    name: "African Print",
    description: "Traditional and modern African print styles.",
  },
  {
    slug: "casual-looks",
    name: "Casual Looks",
    description: "Everyday outfits for comfort and style.",
  },
  {
    slug: "i-have-an-event",
    name: "I Have an Event",
    description: "Dress to impress for any occasion.",
  },
];

// A helper to look up a single category by slug:
export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((cat) => cat.slug === slug);
}
