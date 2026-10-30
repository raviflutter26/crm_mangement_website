import type { Metadata } from "next";
import "./globals.css";
import "./tailwind.css";

import { AuthProvider } from "@/lib/auth";
import { DialogProvider } from "@/components/common/DialogProvider";

/**
 * Root layout of the RIVO platform console build (NEXT_PUBLIC_APP_SURFACE=console).
 * The company app's root layout is layout.tsx; each build sees only its own.
 */
export const metadata: Metadata = {
  title: "RIVO Console",
  description: "RIVO platform console for the RIVO team.",
  robots: { index: false, follow: false },
};

export default function ConsoleRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&amp;display=swap" rel="stylesheet" />
      </head>
      <body>
        <AuthProvider>
          <DialogProvider>
            {children}
          </DialogProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
