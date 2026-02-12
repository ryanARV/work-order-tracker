import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Work Order Tracker',
  description: 'Technician time tracking and work order management',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
