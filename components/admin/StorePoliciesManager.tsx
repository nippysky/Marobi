// components/admin/StorePoliciesManager.tsx
'use client'
import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import toast from "react-hot-toast"

type PolicyType = "Privacy" | "Shipping" | "Refund"

interface Policy {
  id: string
  type: PolicyType
  content: string
}

export default function StorePoliciesManager({ initialPolicies }: { initialPolicies: Policy[] }) {
  const [policies, setPolicies] = useState(initialPolicies)

  function update(type: PolicyType, content: string) {
    setPolicies(p => p.map(x => x.type === type ? { ...x, content } : x))
  }

  async function save() {
    try {
      await fetch("/api/store-settings/policies", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(policies.map(({type, content})=>({ type, content })))
      })
      toast.success("Policies saved")
    } catch {
      toast.error("Failed to save")
    }
  }

  return (
    <div className="space-y-6">
      {policies.map(p => (
        <div key={p.type} className="space-y-1">
          <Label className="font-semibold">{p.type} Policy</Label>
          <Textarea
            rows={6}
            value={p.content}
            onChange={e => update(p.type as PolicyType, e.target.value)}
          />
        </div>
      ))}
      <Button onClick={save}>Save Policies</Button>
    </div>
)
}
