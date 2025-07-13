
import React from 'react';
import { Staff } from '@/lib/staff';
import BackButton from '@/components/BackButton';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';

interface Props {
  staff: Staff;
}

export default function StaffDetail({ staff }: Props) {
  // derive fullName from first/middle/last
  const fullName = [staff.firstName, staff.middleName, staff.lastName]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="space-y-6">
      <BackButton />

      <Card>
        <CardHeader>
          <CardTitle>Staff Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Personal */}
          <div className="space-y-1">
            <p><strong>First Name:</strong> {staff.firstName}</p>
            <p><strong>Middle Name:</strong> {staff.middleName}</p>
            <p><strong>Last Name:</strong> {staff.lastName}</p>
            <p><strong>Full Name:</strong> {fullName}</p>
            <p><strong>Date of Birth:</strong> {new Date(staff.dateOfBirth).toLocaleDateString()}</p>
          </div>

          {/* Employment */}
          <div className="space-y-1">
            <p><strong>Job Role:</strong> {staff.jobRole}</p>
            <p><strong>User Role:</strong> {staff.userRole}</p>
            <p><strong>Date of Employment:</strong> {new Date(staff.dateOfEmployment).toLocaleDateString()}</p>
            {staff.dateOfResignation && (
              <p><strong>Date of Resignation:</strong> {new Date(staff.dateOfResignation).toLocaleDateString()}</p>
            )}
          </div>

          {/* Contact */}
          <div className="space-y-1">
            <p><strong>Address:</strong> {staff.address}</p>
            <p><strong>Phone Number:</strong> {staff.phone}</p>
            <p><strong>Personal Email:</strong> {staff.emailPersonal}</p>
            <p><strong>Official Email:</strong> {staff.emailOfficial}</p>
          </div>

          {/* Guarantor */}
          <div className="space-y-1">
            <p><strong>Guarantor Name:</strong> {staff.guarantorName}</p>
            <p><strong>Guarantor Address:</strong> {staff.guarantorAddress}</p>
            <p><strong>Guarantor Phone:</strong> {staff.guarantorPhone}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
