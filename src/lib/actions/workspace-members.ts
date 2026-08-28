"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Server Actions for inviting/removing workspace members. These need the
 * service-role key (to create/look up auth.users by email — the admin API
 * has no direct "get user by email" lookup) so they can't run as plain
 * client-side Supabase calls the way most other mutations do.
 *
 * Every action re-derives identity from the session and re-checks the
 * caller is a workspace owner server-side — never trust the client, even
 * though the workspace_members RLS policies (0002_rls_policies.sql) enforce
 * the same rule at the DB layer.
 */

export type InviteMemberResult =
  | { ok: true; memberId: string; userId: string; name: string; role: "owner" | "member"; mode: "invited" | "added_existing" }
  | { ok: false; error: string };

export async function inviteMemberAction(
  workspaceId: string,
  input: { name: string; email: string; role: "owner" | "member" },
): Promise<InviteMemberResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name || !email) return { ok: false, error: "Name and email are required." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: callerMembership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!callerMembership || callerMembership.role !== "owner") {
    return { ok: false, error: "Only workspace owners can invite members." };
  }

  const admin = createAdminClient();
  let targetUserId: string | null = null;
  let mode: "invited" | "added_existing" = "invited";

  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { name },
  });

  if (inviteData?.user) {
    targetUserId = inviteData.user.id;
    mode = "invited";
  } else {
    const alreadyExists =
      inviteError &&
      (/already.*(registered|exists)/i.test(inviteError.message) ||
        inviteError.code === "email_exists");
    if (!alreadyExists) {
      return { ok: false, error: inviteError?.message ?? "Couldn't send invite." };
    }

    // No admin "get user by email" endpoint exists — page through listUsers
    // to find the existing account. Fine at this app's scale; would need a
    // smarter lookup (or a profiles.email column) at very large user counts.
    for (let page = 1; page <= 25; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) return { ok: false, error: error.message };
      const match = data.users.find((u) => u.email?.toLowerCase() === email);
      if (match) {
        targetUserId = match.id;
        break;
      }
      if (data.users.length < 200) break;
    }
    if (!targetUserId) {
      return { ok: false, error: "Couldn't find an existing account for that email." };
    }
    mode = "added_existing";
  }

  const { data: existingMembership } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("user_id", targetUserId)
    .maybeSingle();
  if (existingMembership) {
    return { ok: false, error: "This person is already in the workspace." };
  }

  // Runs as the caller (not the admin client) so the workspace_members_insert
  // RLS policy's "caller is an owner" check applies normally.
  const { data: memberRow, error: memberError } = await supabase
    .from("workspace_members")
    .insert({ workspace_id: workspaceId, user_id: targetUserId, role: input.role })
    .select()
    .single();
  if (memberError || !memberRow) {
    return { ok: false, error: memberError?.message ?? "Couldn't add member." };
  }

  return { ok: true, memberId: memberRow.id, userId: targetUserId, name, role: input.role, mode };
}

export type RemoveMemberResult = { ok: true } | { ok: false; error: string };

export async function removeMemberAction(
  workspaceId: string,
  userId: string,
): Promise<RemoveMemberResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  if (userId === user.id) {
    return { ok: false, error: "You can't remove yourself from the workspace." };
  }

  const { data: callerMembership } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!callerMembership || callerMembership.role !== "owner") {
    return { ok: false, error: "Only workspace owners can remove members." };
  }

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
