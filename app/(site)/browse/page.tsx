import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";

export default async function AuthPage() {
  // Server-side check: if cookie exists, redirect to home immediately
  const token = (await cookies()).get("cookbook_token")?.value;
  if (token) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center px-4 py-12">
      <AuthForm />
    </div>
  );
} 