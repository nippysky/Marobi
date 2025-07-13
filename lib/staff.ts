// Mirror exactly your Prisma enums:
export type JobRole =
  | "DispatchCoordinator"
  | "OrderProcessingSpecialist"
  | "ProductCatalogManager"
  | "CustomerSupportRep";

export type UserRole =
  | "SuperAdmin"
  | "ProductAdmin"
  | "OrderAdmin"
  | "DispatchUser"
  | "SupportUser";

export interface Staff {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  emailPersonal: string;
  emailOfficial: string;
  phone: string;
  address: string;
  jobRole: JobRole;
  userRole: UserRole;
  guarantorName: string;
  guarantorAddress: string;
  guarantorPhone: string;
  dateOfEmployment: string;    // ISO string
  dateOfResignation?: string;  // ISO string or undefined
  dateOfBirth: string;         // ISO string
}

// Simple helper to pick a random element
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateDummyStaffs(count: number): Staff[] {
  const firstNames = ["Alice", "Bob", "Carol", "David", "Eve", "Frank"];
  const middleNames = ["K.", "J.", "M.", "N.", "O.", "P."];
  const lastNames = ["Johnson", "Smith", "Lee", "Brown", "Davis", "Miller"];
  const streets = [
    "12 Marina Road, Lagos",
    "45 Ajose Adeogun, Lagos",
    "78 Lekki Phase 1, Lagos",
  ];
  const jobRoles: JobRole[] = [
    "DispatchCoordinator",
    "OrderProcessingSpecialist",
    "ProductCatalogManager",
    "CustomerSupportRep",
  ];
  const userRoles: UserRole[] = [
    "SuperAdmin",
    "ProductAdmin",
    "OrderAdmin",
    "DispatchUser",
    "SupportUser",
  ];

  const staffs: Staff[] = [];
  for (let i = 0; i < count; i++) {
    const first = pick(firstNames);
    const middle = pick(middleNames);
    const last = pick(lastNames);
    const dob = new Date(
      1970 + Math.floor(Math.random() * 30),
      Math.floor(Math.random() * 12),
      1 + Math.floor(Math.random() * 28)
    ).toISOString();
    const doe = new Date(
      2018 + Math.floor(Math.random() * 5),
      Math.floor(Math.random() * 12),
      1 + Math.floor(Math.random() * 28)
    ).toISOString();
    // 50% chance they resigned
    const dor =
      Math.random() < 0.5
        ? new Date(
            2021 + Math.floor(Math.random() * 3),
            Math.floor(Math.random() * 12),
            1 + Math.floor(Math.random() * 28)
          ).toISOString()
        : undefined;

    staffs.push({
      id: `STAFF${(1000 + i).toString().padStart(4, "0")}`,
      firstName: first,
      middleName: middle,
      lastName: last,
      emailPersonal: `${first.toLowerCase()}.${last.toLowerCase()}@personal.com`,
      emailOfficial: `${first.toLowerCase()}.${last.toLowerCase()}@marobi.com`,
      phone: `+23480${Math.floor(10000000 + Math.random() * 90000000)}`,
      address: pick(streets),
      jobRole: pick(jobRoles),
      userRole: pick(userRoles),
      guarantorName: `${pick(firstNames)} ${pick(lastNames)}`,
      guarantorAddress: pick(streets),
      guarantorPhone: `+23480${Math.floor(10000000 + Math.random() * 90000000)}`,
      dateOfBirth: dob,
      dateOfEmployment: doe,
      dateOfResignation: dor,
    });
  }
  return staffs;
}
