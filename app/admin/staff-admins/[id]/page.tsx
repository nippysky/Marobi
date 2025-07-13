
import React from 'react';
import { generateDummyStaffs } from '@/lib/staff';
import StaffDetail from '@/components/admin/StaffDetail';

interface PageProps {
  params: { id: string };
}

export default function StaffDetailPage({ params }: PageProps) {
  const { id } = params;
  const all = generateDummyStaffs(8);
  let staff = all.find((s) => s.id === id);
  if (!staff) {
    // fall back to the first dummy
    staff = all[0];
  }

  return (
    <div className="p-6">
      <StaffDetail staff={staff} />
    </div>
  );
}
