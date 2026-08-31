"use client";

import { Suspense, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { OrbitLogo } from "@/components/brand/orbit-logo";
import { GoogleIcon } from "@/components/auth/google-icon";
import { AuthLoadingOverlay } from "@/components/auth/auth-loading-overlay";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<"password" | "google" | null>(null);

  const canSubmit = EMAIL_RE.test(email.trim()) && password.length > 0 && !submitting;
  const nextPath = searchParams.get("next");

  const signInWithGoogle = async () => {
    setSubmitting(true);
    setPendingAction("google");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath || "/app")}`,
      },
    });
    if (error) {
      setSubmitting(false);
      setPendingAction(null);
      toast.error("Google sign-in failed", { description: error.message });
    }
    // On success the browser navigates away to Google, so nothing else to do here.
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setPendingAction("password");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setSubmitting(false);
      setPendingAction(null);
      toast.error("Couldn't sign in", { description: error.message });
      return;
    }

    toast.success("Signed in");
    router.push(nextPath || "/app");
    router.refresh();
    // Deliberately not clearing `submitting`/`pendingAction` here — the
    // overlay should stay up through the redirect + destination page's own
    // data fetch, rather than flashing back to the form for a moment.
  };

  return (
    <div className="flex flex-col gap-6">
      {submitting && (
        <AuthLoadingOverlay
          title={pendingAction === "google" ? "Redirecting to Google…" : "Signing you in…"}
          description="Just a moment while we get your workspace ready."
        />
      )}

      <div className="flex flex-col items-center gap-4 text-center">
        <OrbitLogo />
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue to your workspace.</p>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={submitting}
        onClick={signInWithGoogle}
      >
        <GoogleIcon className="size-4" />
        Continue with Google
      </Button>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-[11px] font-medium tracking-wide text-muted-foreground">
          OR CONTINUE WITH EMAIL
        </span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <button
              type="button"
              onClick={async () => {
                const trimmed = email.trim();
                if (!EMAIL_RE.test(trimmed)) {
                  toast.info("Enter your email above first, then click this again.");
                  return;
                }
                const supabase = createClient();
                const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
                  redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
                });
                if (error) {
                  toast.error("Couldn't send reset email", { description: error.message });
                  return;
                }
                toast.success("Check your email", {
                  description: `If an account exists for ${trimmed}, we've sent a reset link.`,
                });
              }}
              className="text-xs font-medium text-brand-indigo hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pr-9"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={remember} onCheckedChange={(c) => setRemember(!!c)} />
          Remember me
        </label>

        <Button type="submit" className="w-full" disabled={!canSubmit}>
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-brand-indigo hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
