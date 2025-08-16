import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  title: "Mediearn - Web3 Content Platform",
  description:
    "A decentralized content platform where creators can monetize their articles with EVM wallets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className='font-sans antialiased'>
        <Providers>
          <div className='min-h-screen flex flex-col'>
            <Navbar />
            <main className='flex-1 pt-16'>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
