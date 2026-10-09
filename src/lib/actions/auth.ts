"use server";

import { createAdminClient } from "@/lib/supabase/admin";

const MIN_PASSWORD_LENGTH = 8;

export type SignUpResult = { ok: true } | { ok: false; error: string };

/**
 * Creates a new account without Supabase's email-confirmation step. We go
 * through the admin API (not the client-side `supabase.auth.signUp`) and set
 * `email_confirm: true` directly, so the account is usable the instant it's
 * created — no "check your email" detour, and no dependency on Supabase's
 * confirmation-email redirect (which needs dashboard config we don't control
 * from the app). The signup page calls `signInWithPassword` right after this
 * resolves successfully to establish the real browser session.
 *
 * Also handles the case where the email already has an unconfirmed account
 * (most commonly: invited to a workspace but the invite email's link was
 * broken, so they never completed it) by finishing setup on that existing
 * account with the password they just chose, instead of failing with
 * "already registered" and leaving them stuck.
 */
export async function signUpAction(input: {
  name: string;
  email: string;
  password: string;
}): Promise<SignUpResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!name || !email) return { ok: false, error: "Name and email are required." };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
  }

  const admin = createAdminClient();

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });

  if (!createError) return { ok: true };

  const alreadyExists =
    /already.*(registered|exists)/i.test(createError.message) || createError.code === "email_exists";
  if (!alreadyExists) {
    return { ok: false, error: createError.message };
  }

  // No admin "get user by email" endpoint exists — page through listUsers to
  // find the existing account. Fine at this app's scale (mirrors the same
  // lookup in workspace-members.ts's invite flow).
  let existingUserId: string | null = null;
  let existingConfirmed = false;
  for (let page = 1; page <= 25; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return { ok: false, error: error.message };
    const match = data.users.find((u) => u.email?.toLowerCase() === email);
    if (match) {
      existingUserId = match.id;
      existingConfirmed = !!match.email_confirmed_at;
      break;
    }
    if (data.users.length < 200) break;
  }

  if (!existingUserId) {
    return { ok: false, error: "This email is already registered." };
  }
  if (existingConfirmed) {
    return { ok: false, error: "This email is already registered. Please log in instead." };
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(existingUserId, {
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (updateError) return { ok: false, error: updateError.message };

  return { ok: true };
}
