import type { Metadata } from "next";
import { Inter, Syne, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "sysdesign.fyi — Learn System Design by Breaking Things",
  description:
    "Make decisions. Watch systems fail. Learn why. Interactive system design learning with story mode and drag-and-drop canvas.",
  keywords: [
    "system design",
    "software engineering",
    "distributed systems",
    "learning",
    "interactive",
  ],
  authors: [{ name: "Niranjan", url: "https://twitter.com/nirxnjxn7" }],
  openGraph: {
    title: "sysdesign.fyi — Learn System Design by Breaking Things",
    description: "Make decisions. Watch systems fail. Learn why.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${syne.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
