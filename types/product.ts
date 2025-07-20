export type ProductStatus = "Draft" | "Published" | "Archived";

export type ProductPayload = {
  id?: string;
  name: string;
  category: string;
  description: string;
  images: string[];
  price: { NGN: string | number; USD: string | number; EUR: string | number; GBP: string | number };
  status: "Draft" | "Published" | "Archived";
  sizeMods: boolean;
  colors: string[];        // empty => no color dimension
  sizeStocks: Record<string, string>; // size -> stock (string input)
  customSizes: string[];   // custom size labels
};
