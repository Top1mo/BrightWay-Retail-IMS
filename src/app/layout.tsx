import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BrightWay Retail — Sales & Inventory System',
  description: 'Centralized Sales & Inventory Management System for BrightWay Retail Group',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
