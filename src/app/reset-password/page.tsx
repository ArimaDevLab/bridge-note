import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase-server";
import { ResetForm } from "./ResetForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "新しいパスワード", robots: { index: false } };

export default async function ResetPasswordPage() {
  const { user } = await getCurrentUser();
  if (!user) redirect("/forgot-password");
  return (
    <main className="container narrow">
      <h1 className="page-title">新しいパスワード</h1>
      <p className="page-lead">{user.email} の新しいパスワードを決めてください。</p>
      <ResetForm />
    </main>
  );
}
