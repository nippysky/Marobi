// components/AccountModal.tsx
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAccountModal } from "@/lib/context/accountModalContext";
import { getCurrentUser, User } from "@/lib/session";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import AccountForm from "./AccountForm";

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
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"login" | "register">("login");

  // Lock background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Fetch current user when opening
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getCurrentUser().then((u) => {
        setUser(u);
        setLoading(false);
      });
    }
  }, [isOpen]);

  // Called on successful login or registration
  const handleSuccess = (u: User) => {
    setUser(u);
    closeModal();
    router.push("/");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
              style={{ zIndex: 600000000 }}
            key="backdrop"
            className="fixed inset-0 z-50 bg-black/50"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={closeModal}
          />

          {/* Modal Container */}
          <motion.div
              style={{ zIndex: 600000000 }}
            key="container"
            className="fixed inset-0 z-50 flex flex-col md:flex-row h-full w-full overflow-x-hidden overflow-y-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: "tween", duration: 0.3 }}
          >
            {/* Left Image (hidden on mobile) */}
            <div
              className="hidden md:flex md:basis-1/2 bg-cover bg-center"
              style={{
                backgroundImage:
                  'url("https://plus.unsplash.com/premium_photo-1732464750981-2dfaa38f7d3a?w=1200&auto=format&fit=crop&q=80")',
              }}
            />

            {/* Right Panel */}
            <div className="flex-1 md:basis-1/2 flex flex-col bg-white dark:bg-black">
              {/* Sticky Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  My Account
                </h2>
                <button
                  onClick={closeModal}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
                  aria-label="Close account modal"
                >
                  <span>Close</span>
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <ScrollArea className="flex-1 overflow-y-auto">
                <div className="w-full mx-auto px-6 py-8">
                  {loading ? (
                    <p className="text-center text-gray-500 dark:text-gray-400">
                      Loading…
                    </p>
                  ) : user ? (
                    <AccountForm user={user} />
                  ) : mode === "login" ? (
                    <section className="w-full lg:px-32 px-0 mt-10">
                      <h1 className="font-bold text-[1.5rem] my-5">
                        Login Your Account
                      </h1>
                      <LoginForm
                        onSuccess={handleSuccess}
                        onSwitch={() => setMode("register")}
                      />
                    </section>
                  ) : (
                    <section className="w-full lg:px-32 px-0 mt-10">
                      <h1 className="font-bold text-[1.5rem] my-5">
                        Register A New Account
                      </h1>
                      <RegisterForm
                        onSuccess={handleSuccess}
                        onSwitch={() => setMode("login")}
                      />
                    </section>
                  )}
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AccountModal;
