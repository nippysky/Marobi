"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { JobRole, UserRole } from "@/lib/generated/prisma-client";
import { Clipboard, RefreshCw } from "lucide-react";
import clsx from "clsx";

const JOB_ROLE_OPTIONS: JobRole[] = [
  "SystemAdministrator",
  "DispatchCoordinator",
  "OrderProcessingSpecialist",
  "ProductCatalogManager",
  "CustomerSupportRep",
];

const USER_ROLE_OPTIONS: UserRole[] = [
  "SuperAdmin",
  "ProductAdmin",
  "OrderAdmin",
  "DispatchUser",
  "SupportUser",
];

interface EditInitial {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  emailPersonal: string;
  phone: string;
  address: string;
  jobRoles: JobRole[];
  access: UserRole;
  dateOfBirth: string;
  dateOfEmployment: string;
  dateOfResignation: string;
  guarantorName: string;
  guarantorAddress: string;
  guarantorPhone: string;
}

interface Props {
  mode?: "create" | "edit";
  staffId?: string;
  initialData?: Partial<EditInitial>;
}

function genPassword(len = 12) {
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  return Array.from({ length: len }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export default function StaffForm({
  mode = "create",
  staffId,
  initialData = {},
}: Props) {
  const router = useRouter();
  const isEdit = mode === "edit";

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    firstName: initialData.firstName || "",
    middleName: initialData.middleName || "",
    lastName: initialData.lastName || "",
    email: initialData.email || "",
    emailPersonal: initialData.emailPersonal || "",
    phone: initialData.phone || "",
    address: initialData.address || "",
    jobRoles: (initialData.jobRoles as JobRole[]) || [],
    access: (initialData.access as UserRole) || ("" as any),
    dateOfBirth: initialData.dateOfBirth || "",
    dateOfEmployment: initialData.dateOfEmployment || "",
    dateOfResignation: initialData.dateOfResignation || "",
    guarantorName: initialData.guarantorName || "",
    guarantorAddress: initialData.guarantorAddress || "",
    guarantorPhone: initialData.guarantorPhone || "",
    generatePassword: !isEdit, // only default on create
    password: "",
    confirmPassword: "",
    generatedVisible: !isEdit, // show generated box if create
  });

  function update<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function toggleJobRole(role: JobRole) {
    setForm(f => ({
      ...f,
      jobRoles: f.jobRoles.includes(role)
        ? f.jobRoles.filter(r => r !== role)
        : [...f.jobRoles, role],
    }));
  }

  function validate(): string | null {
    if (!form.firstName.trim()) return "First name required";
    if (!form.lastName.trim()) return "Last name required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return "Valid official email required";
    if (!form.phone.trim()) return "Phone required";
    if (!form.access) return "User role required";
    if (form.jobRoles.length === 0) return "Select at least one job role";

    if (!isEdit || !form.generatePassword) {
      if (!form.generatePassword && form.password.length < 6)
        return "Password must be ≥ 6 characters.";
      if (!form.generatePassword && form.password !== form.confirmPassword)
        return "Passwords do not match.";
    }
    return null;
  }

  function ensureGenerated() {
    if (form.generatePassword && !form.password) {
      const pw = genPassword();
      update("password", pw);
      update("confirmPassword", pw);
    }
  }

  function regenPassword() {
    const pw = genPassword();
    update("password", pw);
    update("confirmPassword", pw);
    update("generatedVisible", true);
  }

  function copyPassword() {
    if (form.password) {
      navigator.clipboard.writeText(form.password);
      toast.success("Password copied");
    }
  }

  async function handleSubmit() {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    ensureGenerated();
    setSubmitting(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        middleName: form.middleName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        emailPersonal: form.emailPersonal.trim() || null,
        phone: form.phone.trim(),
        address: form.address.trim() || null,
        jobRoles: form.jobRoles,
        access: form.access,
        dateOfBirth: form.dateOfBirth || null,
        dateOfEmployment: form.dateOfEmployment || null,
        dateOfResignation: form.dateOfResignation || null,
        guarantorName: form.guarantorName.trim() || null,
        guarantorAddress: form.guarantorAddress.trim() || null,
        guarantorPhone: form.guarantorPhone.trim() || null,
        generatePassword: form.generatePassword,
        password: form.generatePassword ? form.password : form.password || undefined,
      };

      const url = isEdit ? `/api/staff/${staffId}` : "/api/staff";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");

      if (!isEdit && json.generatedPassword) {
        // Show final copy toast
        toast.success("Staff created. Password visible – copy it now.");
      } else {
        toast.success(isEdit ? "Staff updated." : "Staff created.");
      }

      router.push("/admin/staff-admins");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        {/* Basic Identity */}
        <div className="flex flex-col space-y-2">
          <Label>First Name *</Label>
          <Input
            value={form.firstName}
            onChange={e => update("firstName", e.target.value)}
          />
        </div>
        <div className="flex flex-col space-y-2">
          <Label>Middle Name</Label>
          <Input
            value={form.middleName}
            onChange={e => update("middleName", e.target.value)}
          />
        </div>
        <div className="flex flex-col space-y-2">
          <Label>Last Name *</Label>
          <Input
            value={form.lastName}
            onChange={e => update("lastName", e.target.value)}
          />
        </div>

        {/* Emails & Phone */}
        <div className="flex flex-col space-y-2">
          <Label>Official Email *</Label>
          <Input
            type="email"
            value={form.email}
            onChange={e => update("email", e.target.value)}
          />
        </div>
        <div className="flex flex-col space-y-2">
          <Label>Personal Email</Label>
          <Input
            type="email"
            value={form.emailPersonal}
            onChange={e => update("emailPersonal", e.target.value)}
          />
        </div>
        <div className="flex flex-col space-y-2">
          <Label>Phone *</Label>
            <Input
            value={form.phone}
            onChange={e => update("phone", e.target.value)}
          />
        </div>

        {/* Address */}
        <div className="flex flex-col space-y-2">
          <Label>Address</Label>
          <Input
            value={form.address}
            onChange={e => update("address", e.target.value)}
          />
        </div>

        {/* Dates */}
        <div className="flex flex-col space-y-2">
          <Label>Date of Birth</Label>
          <Input
            type="date"
            value={form.dateOfBirth}
            onChange={e => update("dateOfBirth", e.target.value)}
          />
        </div>
        <div className="flex flex-col space-y-2">
          <Label>Date of Employment</Label>
          <Input
            type="date"
            value={form.dateOfEmployment}
            onChange={e => update("dateOfEmployment", e.target.value)}
          />
        </div>
        <div className="flex flex-col space-y-2">
          <Label>Date of Resignation</Label>
          <Input
            type="date"
            value={form.dateOfResignation}
            onChange={e => update("dateOfResignation", e.target.value)}
          />
        </div>

        {/* User Role */}
        <div className="flex flex-col space-y-2">
          <Label>User Role *</Label>
          <Select
            value={form.access}
            onValueChange={v => update("access", v as UserRole)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {USER_ROLE_OPTIONS.map(r => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Job Roles multi-select (pill buttons) */}
        <div className="md:col-span-2 flex flex-col space-y-2">
          <Label>Job Roles *</Label>
          <div className="flex flex-wrap gap-2">
            {JOB_ROLE_OPTIONS.map(r => {
              const active = form.jobRoles.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => toggleJobRole(r)}
                  className={clsx(
                    "px-3 py-1 text-sm rounded border transition",
                    active
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "hover:bg-gray-50"
                  )}
                >
                  {r}
                </button>
              );
            })}
          </div>
          {form.jobRoles.length === 0 && (
            <p className="text-xs text-red-500">Select at least one job role.</p>
          )}
        </div>

        {/* Guarantor Section */}
        <div className="md:col-span-3 border-t pt-4">
          <p className="font-medium mb-2">Guarantor Information</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col space-y-2">
              <Label>Guarantor Name</Label>
              <Input
                value={form.guarantorName}
                onChange={e => update("guarantorName", e.target.value)}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Label>Guarantor Address</Label>
              <Input
                value={form.guarantorAddress}
                onChange={e => update("guarantorAddress", e.target.value)}
              />
            </div>
            <div className="flex flex-col space-y-2">
              <Label>Guarantor Phone</Label>
              <Input
                value={form.guarantorPhone}
                onChange={e => update("guarantorPhone", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Password Section */}
        <div className="md:col-span-3 border-t pt-4 space-y-4">
          <div className="flex items-center space-x-3">
            <Switch
              checked={form.generatePassword}
              onCheckedChange={v => {
                update("generatePassword", v);
                if (v) {
                  const pw = genPassword();
                  update("password", pw);
                  update("confirmPassword", pw);
                  update("generatedVisible", true);
                } else {
                  update("password", "");
                  update("confirmPassword", "");
                }
              }}
              disabled={isEdit && !form.generatePassword && form.password === ""}
            />
            <Label>
              {isEdit
                ? "Auto-generate new password?"
                : "Auto-generate password?"}
            </Label>
          </div>

          {form.generatePassword && form.generatedVisible && (
            <div className="flex items-center gap-2">
              <Input value={form.password} readOnly className="font-mono" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={regenPassword}
                title="Regenerate"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={copyPassword}
                title="Copy"
              >
                <Clipboard className="h-4 w-4" />
              </Button>
            </div>
          )}

          {!form.generatePassword && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col space-y-2">
                <Label>Password {isEdit ? "(leave blank to keep)" : "*"}</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={e => update("password", e.target.value)}
                />
              </div>
              <div className="flex flex-col space-y-2">
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  value={form.confirmPassword}
                  onChange={e => update("confirmPassword", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-end space-x-4">
        <Button
          variant="destructive"
          type="button"
          disabled={submitting}
          onClick={() => history.back()}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting
            ? isEdit
              ? "Updating..."
              : "Creating..."
            : isEdit
            ? "Save Changes"
            : "Create Staff"}
        </Button>
      </CardFooter>
    </Card>
  );
}
