import { OrderStatus, Currency } from "@/lib/generated/prisma-client";

export type OrderChannel = "ONLINE" | "OFFLINE";

export interface OrderRow {
  id:            string;
  status:        OrderStatus;
  channel:       OrderChannel;
  currency:      Currency;
  totalAmount:   number;
  totalNGN:      number;
  paymentMethod: string;
  createdAt:     string;
  products: {
    id:        string;
    name:      string;
    image:     string;
    category:  string;
    color:     string;
    size:      string;
    quantity:  number;
    lineTotal: number;
    priceNGN: number;
    hasSizeMod: boolean;
    sizeModFee: number;
  }[];
  customer: {
    id:      string | null;
    name:    string;
    email:   string;
    phone:   string;
    address: string;
  };
}
