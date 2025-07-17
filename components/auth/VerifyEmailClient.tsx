"use client"

import React, { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "react-hot-toast"

export default function VerifyEmailClient() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get("token")
  const email = params.get("email") || ""

  // pending → waiting for link,  
  // verifying → token provided, calling API,  
  // error → token invalid/expired,  
  // success → handled by redirect
  const [status, setStatus] = useState<"pending"|"verifying"|"error">(
    token ? "verifying" : "pending"
  )
  const [resending, setResending] = useState(false)

  useEffect(() => {
    if (!token) return
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Verification failed")
        toast.success("Email verified! Redirecting to login…")
        setTimeout(() => router.push("/auth/login"), 1500)
      })
      .catch((err: any) => {
        toast.error(err.message)
        setStatus("error")
      })
  }, [token, router])

  const handleResend = async () => {
    if (!email) return toast.error("Missing email address.")
    setResending(true)
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to resend")
      toast.success(data.message)
      setStatus("pending")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setResending(false)
    }
  }

  return (
    <>

      <div className="max-w-md mx-auto py-16 px-6 text-center space-y-6">
        {status === "pending" && (
          <>
            <p className="text-lg">Thanks for registering!</p>
            <p>
              We’ve sent a verification link to{" "}
              <strong>{email}</strong>. Check your inbox (and spam).
            </p>
            <Button onClick={handleResend} disabled={resending}>
              {resending ? "Resending…" : "Resend verification email"}
            </Button>
          </>
        )}

        {status === "verifying" && (
          <p className="text-lg">Verifying your email…</p>
        )}

        {status === "error" && (
          <>
            <p className="text-lg text-red-600">
              Your verification link is invalid or expired.
            </p>
            <Button onClick={handleResend} disabled={resending}>
              {resending ? "Resending…" : "Resend verification email"}
            </Button>
          </>
        )}
      </div>
    </>
  )
}
