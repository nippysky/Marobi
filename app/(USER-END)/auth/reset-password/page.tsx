import ResetPasswordClient from "@/components/auth/ResetPasswordClient";


export default function Page({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = searchParams.email || "";
  return <ResetPasswordClient email={email} />;
}
