import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'SacThatRook — Modern Chess Analytics',

  description:
    'Analyze chess profiles, opening trends, rating patterns, streaks, and game activity with fast client-side telemetry and beautifully designed insights.',

  keywords: [
    'chess analytics',
    'chess wrapped',
    'chess profile stats',
    'opening analysis',
    'chess dashboard',
    'Chess.com analytics',
    'Lichess analytics',
    'PGN analysis',
    'chess insights',
    'SacThatRook'
  ],

  icons: {
    icon: '/favicon.png',
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
      className={`${inter.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#06080d] text-[#f3f4f6]">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
