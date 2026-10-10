import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Free Quran Copy Translation",
  description:
    "A welcoming Quran reader for curious readers, with Arabic text, English and Nepali translations, simple word meanings, and chapter-by-chapter study.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
