"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useEffect,
} from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";

export interface OrderItem {
  id: string;
  name: string;
  image: string | null;
  category: string;
  quantity: number;
  lineTotal: number;
  color: string;
  size: string;
}

export interface Order {
  id: string;
  status: string;
  currency: string;
  totalAmount: number;
  totalNGN: number;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  deliveryAddress: string;
  billingAddress: string;
  registeredAt: string;
  lastLogin: string | null;
  orders: Order[];
}

export interface UserContextValue {
  user?: UserProfile;
  isLoading: boolean;
  error?: any;
  refresh: () => void;
}

const UserContext = createContext<UserContextValue>({
  isLoading: true,
  refresh: () => {},
});

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    throw new Error(error || res.statusText);
  }
  return res.json();
};

export function UserProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const shouldFetch = status === "authenticated";
  const { data, error, mutate, isValidating } = useSWR<UserProfile>(
    shouldFetch ? "/api/auth/me" : null,
    fetcher
  );

  // clear SWR cache on sign out
  useEffect(() => {
    if (status === "unauthenticated") {
      mutate(undefined, false);
    }
  }, [status, mutate]);

  return (
    <UserContext.Provider
      value={{
        user: data,
        isLoading: status === "loading" || isValidating,
        error,
        refresh: () => mutate(),
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
