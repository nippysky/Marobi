"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FaArrowLeftLong,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa6";

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [step, setStep] = useState<1 | 2>(1);
  const numDigits = 6;
  const [codeArr, setCodeArr] = useState<string[]>(
    Array(numDigits).fill("")
  );
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConf, setShowConf] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Handle OTP input + auto-focus
  const handleCodeChange = (val: string, idx: number) => {
    const char = val.replace(/\D/g, "").slice(-1);
    const next = [...codeArr];
    next[idx] = char;
    setCodeArr(next);
    if (char && idx < numDigits - 1) {
      inputsRef.current[idx + 1]?.focus();
    }
  };
  const handleCodeKey = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (e.key === "Backspace" && !codeArr[idx] && idx > 0) {
      inputsRef.current[idx - 1]?.focus();
    }
  };
  const code = codeArr.join("");

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (code.length < numDigits) {
      setError("Please enter all 6 digits");
      return;
    }
    setLoading(true);
    // TODO: POST /api/auth/verify-reset-code { email, code }
    setStep(2);
    setLoading(false);
  };

  const resetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    // TODO: POST /api/auth/reset-password { email, code, password }
    router.push("/auth/login");
    setLoading(false);
  };

  useEffect(() => {
    if (step === 1) inputsRef.current[0]?.focus();
  }, [step]);

  return (
    <div className="w-full max-w-xl mx-auto py-16 px-6">
      <Link
        href="/auth/forgot-password"
        className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <FaArrowLeftLong className="mr-2" /> Back
      </Link>
      <h1 className="text-2xl font-semibold mb-8">
        {step === 1
          ? "Enter Verification Code"
          : "Set New Password"}
      </h1>

      {step === 1 ? (
        <form onSubmit={verifyCode} className="space-y-6">
          <p className="text-gray-600">
            We’ve sent a 6-digit code to <strong>{email}</strong>.
          </p>
          <div className="flex justify-between">
            {codeArr.map((digit, idx) => (
              <Input
                key={idx}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) =>
                  handleCodeChange(e.target.value, idx)
                }
                onKeyDown={(e) => handleCodeKey(e, idx)}
                ref={(el) => {
                  inputsRef.current[idx] = el;
                }}
                disabled={loading}
                className="w-16 h-16 text-center text-xl font-medium"
              />
            ))}
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || code.length < numDigits}
          >
            {loading ? "Verifying…" : "Verify Code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="space-y-6">
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <div>
            <Label htmlFor="password">New Password</Label>
            <div className="relative mt-2">
              <Input
                id="password"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="w-full"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={
                  showPwd ? "Hide password" : "Show password"
                }
              >
                {showPwd ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <div>
            <Label htmlFor="confirm">Confirm Password</Label>
            <div className="relative mt-2">
              <Input
                id="confirm"
                type={showConf ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                disabled={loading}
                className="w-full"
                placeholder="Re-enter your password"
              />
              <button
                type="button"
                onClick={() => setShowConf((v) => !v)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                aria-label={
                  showConf
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >
                {showConf ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !password || !confirm}
          >
            {loading ? "Resetting…" : "Reset Password"}
          </Button>
        </form>
      )}
    </div>
  );
}
