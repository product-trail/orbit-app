// Deliberately its own module (no "use client") so it can be safely
// imported from both the root layout (Server Component, for the blocking
// inline theme-init script) and the client-side ThemeProvider, without
// crossing a "use client" boundary for a plain constant.
export const THEME_STORAGE_KEY = "orbit-theme";
