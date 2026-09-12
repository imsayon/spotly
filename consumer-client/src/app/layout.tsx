import { IBM_Plex_Sans, IBM_Plex_Serif } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["400", "500", "600"],
});
const plexSerif = IBM_Plex_Serif({
  subsets: ["latin"],
  variable: "--font-editorial",
  display: "swap",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Spotly Consumer",
  description:
    "Find a local business, request a spot, and follow your confirmed queue state.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-spotly-role="consumer" data-theme="light">
      <body className={`${plexSans.variable} ${plexSerif.variable} spotly-app`}>
        <ErrorBoundary>
          <AuthProvider>{children}</AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
