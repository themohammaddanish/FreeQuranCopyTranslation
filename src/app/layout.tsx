import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Free Quran Copy Translation",
  description: "Read the Quran in Arabic, English, Nepali, and Urdu.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
