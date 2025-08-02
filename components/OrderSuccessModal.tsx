"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Copy, X, Printer } from "lucide-react";
import toast from "react-hot-toast";

interface OrderSuccessModalProps {
  open: boolean;
  orderId: string;
  email: string;
  onClose?: () => void;
}

const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  open,
  orderId,
  email,
  onClose,
}) => {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) {
      setCopied(false);
    }
  }, [open]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // fallback: do nothing
    }
  };

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-label="Order success"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-6"
    >
      <div
        className="relative max-w-xl w-full bg-gradient-to-br from-white/80 to-slate-50/90 dark:from-[#0f141a]/80 dark:to-[#1f2736]/90 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 animate-fade-in"
        style={{ backdropFilter: "blur(12px)" }}
      >
        {/* Close */}
        <button
          aria-label="Close"
          onClick={() => onClose?.()}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>

        <div className="p-8 flex flex-col items-center text-center gap-4">
          <div className="flex items-center justify-center mb-1">
            <div className="rounded-full bg-green-100 dark:bg-green-900 p-4 inline-flex">
              <CheckCircle className="w-14 h-14 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Successful</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-[480px]">
            Thank you! Your order{" "}
            <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {orderId}
            </span>{" "}
            has been placed.
          </p>
          <div className="flex gap-2 items-center text-sm text-gray-700 dark:text-gray-300">
            <div>
              A receipt has been sent to{" "}
              <span className="font-medium">{email}</span>.
            </div>
          </div>

          <div className="w-full flex flex-col sm:flex-row gap-3 mt-4">
            <button
              onClick={() => {
                router.push("/all-products");
              }}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0f9d58] to-[#1ed760] text-white font-semibold rounded-full shadow-lg hover:brightness-105 transition"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => onClose?.()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-full font-medium hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              Close
            </button>
          </div>

          <div className="w-full flex flex-wrap justify-between items-center mt-4 gap-3">
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="font-semibold">Order ID:</span>
                <div className="relative flex items-center bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono text-sm">
                  {orderId}
                  <button
                    aria-label="Copy order ID"
                    onClick={handleCopy}
                    className="ml-2 flex items-center justify-center p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    <Copy className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                  </button>
                  {copied && (
                    <div className="absolute -top-6 right-0 bg-black text-white text-[10px] px-2 py-1 rounded">
                      Copied!
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                aria-label="Print receipt"
                onClick={() => window.print()}
                className="flex items-center gap-1 text-xs font-medium px-4 py-2 bg-white border border-gray-300 dark:bg-[#1f2736] dark:border-gray-600 rounded-full shadow-sm hover:shadow-md transition"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
              <button
                aria-label="Copy receipt link"
                onClick={() => {
                  const url = typeof window !== "undefined" ? window.location.href : "";
                  navigator.clipboard.writeText(url);
                  toast?.success?.("Receipt link copied");
                }}
                className="flex items-center gap-1 text-xs font-medium px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <Copy className="w-4 h-4" />
                <span>Copy Link</span>
              </button>
            </div>
          </div>
        </div>

        {/* subtle footer or note */}
        <div className="border-t border-gray-100 dark:border-gray-700 px-6 py-3 text-center text-[11px] text-gray-500 dark:text-gray-400">
          If you have any questions, reply to the email or contact support.
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessModal;
