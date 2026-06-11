import Link from "next/link";
import { Suspense } from "react";
import { AuthForm } from "@/features/auth/auth-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="grid w-full justify-items-center gap-6">
        <Link href="/" className="text-center">
          <p className="text-sm font-semibold text-accent">CrediOS by Sanvat</p>
          <h1 className="mt-1 text-2xl font-semibold">Gestion financiera clara</h1>
        </Link>
        <Suspense fallback={null}>
          <AuthForm mode="login" />
        </Suspense>
      </div>
    </main>
  );
}
