import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Free Quran Copy Translation",
  description: "Read the Quran in Arabic and translations in English, Nepali, Urdu, and 10 more languages.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
