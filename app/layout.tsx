import type { Metadata } from 'next';
import { Lexend } from 'next/font/google';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import Header from '@/components/Header';

const lexend = Lexend({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
  title: 'Từ điển tiếng Việt - Vietnamese Dictionary',
  description: 'A modern Vietnamese dictionary for looking up words and learning Vietnamese',
};

import { UserProvider } from '@/context/UserContext';

// ... imports

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={lexend.className} suppressHydrationWarning>
        <SessionProvider>
          <UserProvider>
            <Header />
            <main style={{ minHeight: 'calc(100vh - 80px)', paddingTop: '80px' }}>
              {children}
            </main>
          </UserProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
