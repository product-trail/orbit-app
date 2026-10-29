import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

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
  title: "Orbits",
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
// installed; kept in sync with the (only) light-theme background token.
export const viewport: Viewport = {
  themeColor: "#f8fafc",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TooltipProvider delay={200}>{children}</TooltipProvider>
        <Toaster position="bottom-right" />
        <PwaRegister />
      </body>
    </html>
  );
}
