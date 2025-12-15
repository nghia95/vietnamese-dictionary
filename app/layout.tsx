import type { Metadata } from 'next';
import { Lexend } from 'next/font/google';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import Header from '@/components/Header';

const lexend = Lexend({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
  title: 'Từ Điển Việt - Vietnamese Dictionary',
  description: 'A modern Vietnamese dictionary for looking up words and learning Vietnamese',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={lexend.className}>
        <SessionProvider>
          <Header />
          <main style={{ minHeight: 'calc(100vh - 80px)' }}>
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
