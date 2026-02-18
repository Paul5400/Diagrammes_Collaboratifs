import type { Metadata } from 'next';
import './globals.css';
import React, { ReactNode } from 'react';
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
});

export const metadata: Metadata = {
  title: 'Diagrammer',
  description: 'Collaborative diagram editor for engineering teams',
  icons: {
    icon: '/favicon.ico',
  },
};

import { AuthProvider } from '@/context/AuthContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href={process.env.NEXT_PUBLIC_BACKEND_URL} />
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_BACKEND_URL} />
        {process.env.NEXT_PUBLIC_WS_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_WS_URL} />
        )}
      </head>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
