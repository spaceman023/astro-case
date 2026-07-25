import type { Metadata } from "next";
import { DEFAULT_THEME, themeInitScript } from "@justice/ui/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Unified Justice Suite",
  description: "LE + Prosecution + Courts — shared canonical case management.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // SSR renders the dark-first default; the init script reconciles to the
    // user's persisted theme/density before first paint (no FOUC).
    <html lang="en" data-theme={DEFAULT_THEME} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
