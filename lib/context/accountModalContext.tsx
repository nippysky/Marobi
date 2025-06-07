
"use client";

import { createContext, useContext, useState } from "react";

const AccountModalContext = createContext<{
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}>({
  isOpen: false,
  openModal: () => {},
  closeModal: () => {},
});

export const AccountModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AccountModalContext.Provider
      value={{
        isOpen,
        openModal: () => setIsOpen(true),
        closeModal: () => setIsOpen(false),
      }}
    >
      {children}
    </AccountModalContext.Provider>
  );
};

export const useAccountModal = () => useContext(AccountModalContext);
