import ResetPasswordClient from "@/components/auth/ResetPasswordClient";

export default function Page({
  params,       
  searchParams,  
}: {
  params: Record<string, any>;           
  searchParams: { email?: string };     
}) {
  const email = searchParams.email ?? "";
  return <ResetPasswordClient email={email} />;
}
