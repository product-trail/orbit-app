/**
 * Placeholder Supabase database types.
 *
 * This will be replaced in Phase 3 (Workspace + memberships + RLS) by
 * running `supabase gen types typescript` against the real schema, once
 * migrations exist. Keeping a minimal, well-formed shape here now so the
 * typed Supabase clients compile ahead of that.
 */
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
