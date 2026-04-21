import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Tricon',
  description: 'Triangle territory game in space',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="h-screen w-screen bg-space-900 text-white overflow-hidden">
        {children}
      </body>
    </html>
  );
}
