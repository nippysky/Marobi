"use client";

import React, { ReactNode, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface ProfileSectionProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    billingAddress: string;
    country: string;
    state: string;
    registeredAt: string;
    lastLogin: string | null;
  };
}

const FormField = ({
  label,
  htmlFor,
  children,
  span2 = false,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
  span2?: boolean;
}) => (
  <div className={`${span2 ? "md:col-span-2" : ""} flex flex-col gap-2`}>
    <Label htmlFor={htmlFor}>{label}</Label>
    {children}
  </div>
);

export default function ProfileSection({ user }: ProfileSectionProps) {
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [address, setAddress] = useState(user.address);
  const [billingAddress, setBillingAddress] = useState(user.billingAddress);
  const [country, setCountry] = useState(user.country);
  const [stateVal, setStateVal] = useState(user.state);

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSave = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          address,
          billingAddress,
          country,
          state: stateVal,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Details</CardTitle>
      </CardHeader>
      <CardContent>
        {!editing ? (
          <div className="space-y-4">
            <p>
              <strong>Name:</strong> {firstName} {lastName}
            </p>
            <p>
              <strong>Email:</strong> {email}
            </p>
            <p>
              <strong>Phone:</strong> {phone}
            </p>
            <p>
              <strong>Country:</strong> {country}
            </p>
            <p>
              <strong>State/Region:</strong> {stateVal}
            </p>
            <p>
              <strong>Delivery Address:</strong> {address}
            </p>
            <p>
              <strong>Billing Address:</strong> {billingAddress}
            </p>
            <Button onClick={() => setEditing(true)}>Edit Profile</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="First Name" htmlFor="firstName">
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={loading}
              />
            </FormField>
            <FormField label="Last Name" htmlFor="lastName">
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={loading}
              />
            </FormField>
            <FormField label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </FormField>
            <FormField label="Phone" htmlFor="phone">
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={loading}
              />
            </FormField>
            <FormField label="Country" htmlFor="country">
              <Input
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                disabled={loading}
              />
            </FormField>
            <FormField label="State / Region" htmlFor="state">
              <Input
                id="state"
                value={stateVal}
                onChange={(e) => setStateVal(e.target.value)}
                disabled={loading}
              />
            </FormField>
            <FormField label="Delivery Address" htmlFor="address" span2>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </FormField>
            <FormField
              label="Billing Address"
              htmlFor="billingAddress"
              span2
            >
              <Textarea
                id="billingAddress"
                value={billingAddress}
                onChange={(e) => setBillingAddress(e.target.value)}
                disabled={loading}
                rows={3}
              />
            </FormField>
            <div className="md:col-span-2 flex space-x-3">
              <Button onClick={onSave} disabled={loading}>
                {loading ? "Saving…" : "Save"}
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
