// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import TanStackProvider from "@/components/providers/TanStackProvider";
import UserSync from "@/components/UserSync";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Ora - Modern Dental Care for a Radiant Smile",
  description: "Experience modern dental care with Smilify — advanced cosmetic dentistry, expert doctors, and a relaxing atmosphere designed for your brightest smile.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <TanStackProvider>
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#e78a53",
          colorBackground: "#f3f4f6",
          colorText: "#111827",
          colorTextSecondary: "#6b7280",
          colorInputBackground: "#f3f4f6",
        },
      }}
    >
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased dark`}>
          <UserSync />
          {children}
        </body>
      </html>
    </ClerkProvider>
    </TanStackProvider>
  );
}
