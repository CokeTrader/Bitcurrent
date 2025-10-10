import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BitCurrent Exchange - UK Cryptocurrency Trading Platform",
  description: "Trade Bitcoin, Ethereum, and other cryptocurrencies with GBP on the UK's premier crypto exchange. FCA regulated, secure, and easy to use.",
  keywords: ["cryptocurrency", "bitcoin", "ethereum", "trading", "exchange", "GBP", "UK", "FCA"],
  authors: [{ name: "BitCurrent Exchange" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}



