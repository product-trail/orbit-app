import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { ThemeProvider } from "@/components/theme-provider";
import { PwaRegister } from "@/components/pwa-register";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { THEME_STORAGE_KEY } from "@/lib/theme-constants";
import "./globals.css";

// Runs before hydration so the correct theme class is on <html> for the
// very first paint — no flash of the wrong theme. Kept intentionally tiny
// and dependency-free.
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    var theme = stored === "system"
      ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : stored;
    if (theme !== "light" && theme !== "dark") theme = "dark";
    document.documentElement.classList.toggle("dark", theme === "dark");
  } catch (e) {}
})();
`;

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Orbits - Where product work comes together",
  description:
    "The operating layer for product teams to manage the work that doesn't fit cleanly into JIRA.",
  icons: {
    icon: "/icon-512.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    title: "Orbits",
    statusBarStyle: "black-translucent",
  },
};

// PWA installability (spec: Android/iOS "Add to Home Screen"): theme color
// drives the OS status bar / task-switcher chrome around the app once
// installed; kept in sync with the dark-theme background token since dark
// is the default theme (see themeInitScript above).
export const viewport: Viewport = {
  themeColor: "#0b1220",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Script
          id="orbit-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <ThemeProvider>
          <TooltipProvider delay={200}>{children}</TooltipProvider>
          <Toaster position="bottom-right" />
        </ThemeProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
