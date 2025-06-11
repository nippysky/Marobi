"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FaArrowLeftLong, FaEye, FaEyeSlash } from "react-icons/fa6";

interface CountryData {
  name: string;
  iso2: string;
  callingCodes: string[];
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

const flagEmoji = (iso2: string) =>
  iso2
    .toUpperCase()
    .replace(/./g, (c) =>
      String.fromCodePoint(127397 + c.charCodeAt(0))
    );

export default function RegisterPage() {
  const router = useRouter();

  // personal info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");

  // phone
  const [phoneCode, setPhoneCode] = useState("+234");
  const [phoneNumber, setPhoneNumber] = useState("");

  // country / state
  const [countryList, setCountryList] = useState<CountryData[]>([]);
  const [country, setCountry] = useState<CountryData | null>(null);
  const [stateList, setStateList] = useState<string[]>([]);
  const [stateVal, setStateVal] = useState("");

  // address
  const [address, setAddress] = useState("");

  // passwords
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // loading
  const [loading, setLoading] = useState(false);

  // 1️⃣ load countries + merge ISO2 & callingCodes
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
        const rc = (rcJson as any[]).find(
          (r) => r.name === c.country
        );
        return {
          name: c.country,
          iso2: rc?.alpha2Code ?? "",
          callingCodes: rc?.callingCodes ?? [],
        };
      });
      setCountryList(merged);

      // default to Nigeria
      const ng =
        merged.find((c) => c.name === "Nigeria") ?? null;
      setCountry(ng);
      if (ng?.callingCodes.length) {
        setPhoneCode(`+${ng.callingCodes[0]}`);
      }
    });
  }, []);

  // 2️⃣ on country change: fetch its states + update phone code
  useEffect(() => {
    if (!country) {
      setStateList([]);
      setStateVal("");
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
        const names =
          json.data?.states?.map((s: any) => s.name) ?? [];
        setStateList(names);
      })
      .catch(() => {
        setStateList([]);
      });

    if (country.callingCodes.length) {
      setPhoneCode(`+${country.callingCodes[0]}`);
    }
  }, [country]);

  // dedupe phone options with flags
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      alert("Passwords must match");
      return;
    }
    setLoading(true);
    const payload = {
      name: `${firstName} ${lastName}`.trim(),
      email,
      phone: `${phoneCode}${phoneNumber}`,
      country: country?.name ?? "",
      state: stateVal,
      address,
      password,
    };
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Registration failed");
      router.push("/auth/login");
    } catch {
      // TODO: show toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <Link
        href="/auth/login"
        className="mb-4 inline-flex items-center gap-1 hover:underline"
      >
        <FaArrowLeftLong /> Back to Login
      </Link>
      <h1 className="mb-6 text-2xl font-semibold">Register</h1>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <FormField label="First Name" htmlFor="firstName">
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            disabled={loading}
          />
        </FormField>

        <FormField label="Last Name" htmlFor="lastName">
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            disabled={loading}
          />
        </FormField>

        
        <FormField label="Country" htmlFor="country">
          <Select
            value={country?.name}
            onValueChange={(val) => {
              const sel =
                countryList.find((c) => c.name === val) ?? null;
              setCountry(sel);
            }}
            disabled={loading}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              {countryList.map((c) => (
                <SelectItem key={c.name} value={c.name}>
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

        <FormField label="Email Address" htmlFor="email">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
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
                    <span className="mr-1">{flagEmoji(iso2)}</span>
                    {code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="phone"
              type="tel"
              placeholder="8012345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </FormField>


        <FormField
          label="Delivery Address"
          htmlFor="address"
          span2
        >
          <Textarea
            id="address"
            rows={3}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            disabled={loading}
          />
        </FormField>

        <FormField label="Password" htmlFor="password">
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
              aria-label={
                showPassword ? "Hide password" : "Show password"
              }
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </FormField>

        <FormField label="Confirm Password" htmlFor="confirm">
          <div className="relative">
            <Input
              id="confirm"
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
              aria-label={
                showConfirm
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            >
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
        </FormField>

        <div className="md:col-span-2">
          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? "Registering…" : "Register"}
          </Button>
        </div>

        <p className="md:col-span-2 text-center text-sm">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-semibold hover:underline"
          >
            Login
          </Link>
        </p>
      </form>
    </div>
);
}
