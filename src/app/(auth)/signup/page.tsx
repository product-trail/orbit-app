"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { OrbitLogo } from "@/components/brand/orbit-logo";
import { GoogleIcon } from "@/components/auth/google-icon";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const emailValid = EMAIL_RE.test(email.trim());
  const passwordValid = password.length >= MIN_PASSWORD_LENGTH;
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit =
    !!name.trim() && emailValid && passwordValid && passwordsMatch && agreed && !submitting;

  const signUpWithGoogle = async () => {
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/app`,
      },
    });
    if (error) {
      setSubmitting(false);
      toast.error("Google sign-up failed", { description: error.message });
    }
    // On success the browser navigates away to Google, so nothing else to do here.
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { name: name.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/app`,
      },
    });

    if (error) {
      setSubmitting(false);
      toast.error("Couldn't create account", { description: error.message });
      return;
    }

    // If email confirmations are enabled in the Supabase project, signUp
    // returns a user but no session — the account exists but isn't usable
    // until they click the confirmation link (which lands on /auth/callback
    // and then /app). If confirmations are disabled, a session comes back
    // immediately and we can route straight into onboarding.
    if (!data.session) {
      toast.success("Check your email", {
        description: `We've sent a confirmation link to ${email.trim()}.`,
      });
      setSubmitting(false);
      router.push("/login");
      return;
    }

    toast.success("Account created");
    router.push("/app");
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <OrbitLogo />
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground">
            Set up Orbits for your product team in minutes.
          </p>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={submitting}
        onClick={signUpWithGoogle}
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
          <Label htmlFor="signup-name">Full name</Label>
          <Input
            id="signup-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Priya Sharma"
            autoComplete="name"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
          {email.trim().length > 0 && !emailValid && (
            <p className="text-xs text-danger">Enter a valid email address.</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="signup-password">Password</Label>
          <div className="relative">
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
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
          {password.length > 0 && !passwordValid && (
            <p className="text-xs text-danger">
              Use at least {MIN_PASSWORD_LENGTH} characters.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="signup-confirm-password">Confirm password</Label>
          <Input
            id="signup-confirm-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-xs text-danger">Passwords don&apos;t match.</p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox checked={agreed} onCheckedChange={(c) => setAgreed(!!c)} />
          I agree to the Terms of Service and Privacy Policy
        </label>

        <Button type="submit" className="w-full" disabled={!canSubmit}>
          {submitting ? "Creating…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-brand-indigo hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
