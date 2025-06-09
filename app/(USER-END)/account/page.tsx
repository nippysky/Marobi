import Link from "next/link";
import { getCurrentUser, type User } from "@/lib/session";
import ProfileSection from "@/components/account/ProfileSection";

export default async function AccountPage() {
  const user: User = (await getCurrentUser())!; // layout already guards

  return (
    <>
      {/* Breadcrumbs */}
      <nav className="text-sm mb-6">
        <Link
          href="/"
          className="text-gray-700 dark:text-gray-300 hover:underline"
        >
          Home
        </Link>
        <span className="mx-2 text-gray-500">/</span>
        <span className="text-gray-700 dark:text-gray-300">Account</span>
      </nav>

      <ProfileSection user={user} />
    </>
  );
}
