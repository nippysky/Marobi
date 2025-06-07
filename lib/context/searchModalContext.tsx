"use client";

import React, { createContext, useContext, useState } from "react";

interface SearchModalContextType {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const SearchModalContext = createContext<SearchModalContextType | undefined>(undefined);

export const SearchModalProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <SearchModalContext.Provider value={{ isOpen, openModal, closeModal }}>
      {children}
    </SearchModalContext.Provider>
  );
};

export const useSearchModal = (): SearchModalContextType => {
  const context = useContext(SearchModalContext);
  if (!context) throw new Error("useSearchModal must be used within SearchModalProvider");
  return context;
};
