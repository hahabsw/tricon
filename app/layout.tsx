import './globals.css';
import type { ReactNode } from 'react';
import type { Viewport } from 'next';
import { AppChrome } from '../components/AppChrome';

export const metadata = {
  title: 'Tricon',
  description: 'Triangle territory game in space',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#050510',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-dvh w-full bg-space-900 text-white">
        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
