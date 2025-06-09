"use client";

import { useState } from "react";
import type { User } from "@/lib/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
  country: string;
  state: string;
  address: string;
}

interface ProfileSectionProps {
  // extend with optional profile fields
  user: User & {
    phone?: string;
    country?: string;
    state?: string;
    address?: string;
  };
}

export default function ProfileSection({ user }: ProfileSectionProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<ProfileForm>({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    country: user.country || "",
    state: user.state || "",
    address: user.address || "",
  });
  const [loading, setLoading] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Save failed");
      setEditing(false);
    } catch {
      // TODO: toast error
    } finally {
      setLoading(false);
    }
  };

  const displayOrDash = (val?: string) => val?.trim() || "—";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Details</CardTitle>
      </CardHeader>
      <CardContent>
        {!editing ? (
          <div className="space-y-4">
            <p>
              <strong>Name:</strong> {displayOrDash(user.name)}
            </p>
            <p>
              <strong>Email:</strong> {displayOrDash(user.email)}
            </p>
            <p>
              <strong>Phone:</strong> {displayOrDash(user.phone)}
            </p>
            <p>
              <strong>Country:</strong> {displayOrDash(user.country)}
            </p>
            <p>
              <strong>State/Region:</strong> {displayOrDash(user.state)}
            </p>
            <p>
              <strong>Delivery Address:</strong> {displayOrDash(user.address)}
            </p>
            <Button onClick={() => setEditing(true)}>Edit Profile</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={onChange}
                disabled={loading}
                className="mt-1"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                disabled={loading}
                className="mt-1"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="e.g. +2348012345678"
                value={form.phone}
                onChange={onChange}
                disabled={loading}
                className="mt-1"
              />
            </div>

            {/* Country */}
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                name="country"
                placeholder="Country"
                value={form.country}
                onChange={onChange}
                disabled={loading}
                className="mt-1"
              />
            </div>

            {/* State/Region */}
            <div>
              <Label htmlFor="state">State / Region</Label>
              <Input
                id="state"
                name="state"
                placeholder="State or region"
                value={form.state}
                onChange={onChange}
                disabled={loading}
                className="mt-1"
              />
            </div>

            {/* Delivery Address */}
            <div className="md:col-span-2">
              <Label htmlFor="address">Delivery Address</Label>
              <Input
                id="address"
                name="address"
                placeholder="Street address, city, ZIP"
                value={form.address}
                onChange={onChange}
                disabled={loading}
                className="mt-1"
              />
            </div>

            {/* Action buttons span two columns */}
            <div className="md:col-span-2 flex space-x-3">
              <Button onClick={onSave} disabled={loading}>
                {loading ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditing(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
