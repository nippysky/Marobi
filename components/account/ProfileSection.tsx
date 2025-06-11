"use client";

import React, {
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from "react";
import type { User } from "@/lib/session";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface CountryData {
  name: string;
  iso2: string;
  callingCodes: string[];
}

interface ProfileSectionProps {
  user: User & {
    phone?: string;
    country?: string;
    state?: string;
    address?: string;
  };
}

// helper for label + control
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

// ISO code → flag emoji
const flagEmoji = (iso2: string) =>
  iso2
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));

export default function ProfileSection({ user }: ProfileSectionProps) {
  // split name
  const [firstName, setFirstName] = useState(
    user.name?.split(" ")[0] ?? ""
  );
  const [lastName, setLastName] = useState(
    user.name?.split(" ").slice(1).join(" ") ?? ""
  );
  const [email, setEmail] = useState(user.email);

  // phone
  const [phoneCode, setPhoneCode] = useState("+234");
  const [phoneNumber, setPhoneNumber] = useState(user.phone ?? "");

  // country & state
  const [countryList, setCountryList] = useState<CountryData[]>([]);
  const [country, setCountry] = useState<CountryData | null>(null);
  const [stateList, setStateList] = useState<string[]>([]);
  const [stateVal, setStateVal] = useState(user.state ?? "");

  // address
  const [address, setAddress] = useState(user.address ?? "");

  // editing / loading
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // 1️⃣ load countries & merge ISO/callingCodes
  useEffect(() => {
    Promise.all([
      fetch("https://countriesnow.space/api/v0.1/countries").then((r) =>
        r.json()
      ),
      fetch(
        "https://restcountries.com/v2/all?fields=name,alpha2Code,callingCodes"
      ).then((r) => r.json()),
    ]).then(([cnJson, rcJson]: any[]) => {
      const merged: CountryData[] = cnJson.data.map((c: any) => {
        const rc = (rcJson as any[]).find((r) => r.name === c.country);
        return {
          name: c.country,
          iso2: rc?.alpha2Code ?? "",
          callingCodes: rc?.callingCodes ?? [],
        };
      });
      setCountryList(merged);

      // pick default: user.country or Nigeria
      const found =
        merged.find((c) => c.name === user.country) ??
        merged.find((c) => c.name === "Nigeria") ??
        null;
      setCountry(found);
      if (found?.callingCodes.length) {
        setPhoneCode(`+${found.callingCodes[0]}`);
      }
    });
  }, [user.country]);

  // 2️⃣ when country changes → fetch states + update phoneCode
  useEffect(() => {
    if (!country) {
      setStateList([]);
      return;
    }
    setStateList([]);
    setStateVal("");

    fetch("https://countriesnow.space/api/v0.1/countries/states", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country: country.name }),
    })
      .then((r) => r.json())
      .then((json: any) => {
        const names: string[] =
          json.data?.states?.map((s: any) => s.name) ?? [];
        setStateList(names);
      })
      .catch(() => setStateList([]));

    if (country.callingCodes.length) {
      setPhoneCode(`+${country.callingCodes[0]}`);
    }
  }, [country]);

  // dedupe phone options
  const phoneOptions = useMemo(() => {
    const map = new Map<string, string>();
    countryList.forEach((c) =>
      c.callingCodes.forEach((code) => {
        if (!map.has(code)) map.set(code, c.iso2);
      })
    );
    return Array.from(map.entries()).map(([code, iso2]) => ({
      code: `+${code}`,
      iso2,
    }));
  }, [countryList]);

  // save handler: stitch back into your payload
  const onSave = async () => {
    setLoading(true);
    const payload = {
      name: `${firstName} ${lastName}`.trim(),
      email,
      phone: `${phoneCode}${phoneNumber}`,
      country: country?.name ?? "",
      state: stateVal,
      address,
    };
    try {
      const res = await fetch("/api/account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      setEditing(false);
    } catch {
      // TODO: show a toast
    } finally {
      setLoading(false);
    }
  };

  const displayOrDash = (val?: string) =>
    val?.trim() || "—";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Details</CardTitle>
      </CardHeader>
      <CardContent>
        {!editing ? (
          <div className="space-y-4">
            <p>
              <strong>First Name:</strong>{" "}
              {displayOrDash(firstName)}
            </p>
            <p>
              <strong>Last Name:</strong>{" "}
              {displayOrDash(lastName)}
            </p>
            <p>
              <strong>Email:</strong>{" "}
              {displayOrDash(email)}
            </p>
            <p>
              <strong>Phone:</strong>{" "}
              {displayOrDash(`${phoneCode}${phoneNumber}`)}
            </p>
            <p>
              <strong>Country:</strong>{" "}
              {displayOrDash(country?.name)}
            </p>
            <p>
              <strong>State/Region:</strong>{" "}
              {displayOrDash(stateVal)}
            </p>
            <p>
              <strong>Delivery Address:</strong>{" "}
              {displayOrDash(address)}
            </p>
            <Button onClick={() => setEditing(true)}>
              Edit Profile
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* First / Last */}
            <FormField label="First Name" htmlFor="firstName">
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) =>
                  setFirstName(e.target.value)
                }
                disabled={loading}
                className="mt-1"
              />
            </FormField>
            <FormField label="Last Name" htmlFor="lastName">
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) =>
                  setLastName(e.target.value)
                }
                disabled={loading}
                className="mt-1"
              />
            </FormField>

            {/* Country / State */}
            <FormField label="Country" htmlFor="country">
              <Select
                value={country?.name}
                onValueChange={(val) => {
                  const sel =
                    countryList.find(
                      (c) => c.name === val
                    ) ?? null;
                  setCountry(sel);
                }}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countryList.map((c) => (
                    <SelectItem
                      key={c.name}
                      value={c.name}
                    >
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="State / Region" htmlFor="state">
              <Select
                value={stateVal}
                onValueChange={setStateVal}
                disabled={loading}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {stateList.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            {/* Email / Phone */}
            <FormField label="Email Address" htmlFor="email">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="mt-1"
              />
            </FormField>
            <FormField label="Phone Number" htmlFor="phone">
              <div className="flex">
                <Select
                  value={phoneCode}
                  onValueChange={setPhoneCode}
                  disabled={loading}
                >
                  <SelectTrigger className="w-24 mr-2">
                    <SelectValue placeholder={phoneCode} />
                  </SelectTrigger>
                  <SelectContent>
                    {phoneOptions.map(({ code, iso2 }) => (
                      <SelectItem key={code} value={code}>
                        <span className="mr-1">
                          {flagEmoji(iso2)}
                        </span>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) =>
                    setPhoneNumber(e.target.value)
                  }
                  disabled={loading}
                  placeholder="800 000 0000"
                  className="mt-1"
                />
              </div>
            </FormField>

            {/* Delivery Address */}
            <FormField
              label="Delivery Address"
              htmlFor="address"
              span2
            >
              <Textarea
                id="address"
                value={address}
                onChange={(e) =>
                  setAddress(e.target.value)
                }
                disabled={loading}
                rows={4}
                className="mt-1"
              />
            </FormField>

            {/* Actions */}
            <div className="md:col-span-2 flex space-x-3">
              <Button
                onClick={onSave}
                disabled={loading}
              >
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
