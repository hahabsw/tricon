import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'Stellar Conquest',
  description: 'Triangle territory game in space',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="h-screen w-screen bg-[#050510] text-white overflow-hidden">
        {children}
      </body>
    </html>
  );
}
