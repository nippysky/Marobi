"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import { useAccountModal } from "@/lib/context/accountModalContext";
import { getCurrentUser } from "@/lib/session";
import AccountForm from "@/components/AccountForm";
import AuthPrompt from "@/components/AuthPrompt";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const containerVariants = {
  hidden: { y: "100%" },
  visible: { y: 0 },
  exit: { y: "100%" },
};

export const AccountModal: React.FC = () => {
  const { isOpen, closeModal } = useAccountModal();
  const [user, setUser] = useState<Awaited<ReturnType<typeof getCurrentUser>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getCurrentUser().then((u) => {
        setUser(u);
        setLoading(false);
      });
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="account-backdrop"
            className="fixed inset-0 z-[600000000] bg-black/50"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={closeModal}
          />

          {/* Fullscreen Modal */}
          <motion.div
            key="account-container"
            className="fixed inset-0 z-[600000001] flex flex-col bg-white dark:bg-black"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "tween", duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-6 pb-2 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                My Account
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 flex items-center space-x-2"
                aria-label="Close account modal"
              >
                <p>Close</p>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 px-4 py-6 overflow-y-auto">
              {loading ? (
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Loading account…
                </p>
              ) : user ? (
                <AccountForm user={user} />
              ) : (
                <AuthPrompt />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
