import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import Navbar from "@/Component/Navbar/Navbar";
import Loader from "@/Component/Loader/Loader";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const body = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Brothers & Co. | Premium Wedding Cards",
  description:
    "Letterpress, gold foil and laser-cut wedding invitations, designed with you and delivered across India.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#0e1f1b] font-[family-name:var(--font-body)]">
        <Loader />
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
