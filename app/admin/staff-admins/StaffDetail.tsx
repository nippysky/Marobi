import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { JobRole, UserRole } from "@/lib/generated/prisma-client";


interface StaffDetailProps {
  staff: {
    id: string;
    firstName: string;
    middleName: string | null;
    lastName: string;
    email: string;
    emailPersonal: string | null;
    phone: string;
    address: string | null;
    jobRoles: JobRole[];
    access: UserRole;
    dateOfBirth: Date | null;
    dateOfEmployment: Date | null;
    dateOfResignation: Date | null;
    guarantorName: string | null;
    guarantorAddress: string | null;
    guarantorPhone: string | null;
    createdAt: Date;
  };
}

function fmt(d: Date | null | undefined) {
  return d ? new Date(d).toLocaleDateString() : "—";
}

export default function StaffDetail({ staff }: StaffDetailProps) {
  const fullName = [staff.firstName, staff.middleName, staff.lastName]
    .filter(Boolean)
    .join(" ");
  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Details</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
        <div className="space-y-2">
          <p><strong>First Name:</strong> {staff.firstName}</p>
          <p><strong>Middle Name:</strong> {staff.middleName || "—"}</p>
          <p><strong>Last Name:</strong> {staff.lastName}</p>
          <p><strong>Full Name:</strong> {fullName}</p>
          <p><strong>Date of Birth:</strong> {fmt(staff.dateOfBirth)}</p>
          <p><strong>Address:</strong> {staff.address || "—"}</p>
          <p><strong>Phone Number:</strong> {staff.phone}</p>
          <p><strong>Personal Email:</strong> {staff.emailPersonal || "—"}</p>
          <p><strong>Official Email:</strong> {staff.email}</p>
        </div>
        <div className="space-y-2">
          <p>
            <strong>Job Role(s):</strong>{" "}
            {staff.jobRoles.length ? staff.jobRoles.join(", ") : "—"}
          </p>
            <p><strong>User Role:</strong> {staff.access}</p>
          <p><strong>Date of Employment:</strong> {fmt(staff.dateOfEmployment)}</p>
          <p><strong>Date of Resignation:</strong> {fmt(staff.dateOfResignation)}</p>
          <p><strong>Guarantor Name:</strong> {staff.guarantorName || "—"}</p>
          <p><strong>Guarantor Address:</strong> {staff.guarantorAddress || "—"}</p>
          <p><strong>Guarantor Phone:</strong> {staff.guarantorPhone || "—"}</p>
        </div>
      </CardContent>
    </Card>
  );
}
