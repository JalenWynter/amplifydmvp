import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import Header from '@/components/shared/header';
import Footer from '@/components/shared/footer';
import { Inter, Source_Code_Pro } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-source-code-pro',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Amplifyd - Get Your Music Heard',
  description: 'Submit your music for review by industry professionals. Amplify your sound and get guaranteed feedback from verified A&Rs, producers, and music journalists.',
};

import AuthDebugger from '@/components/shared/AuthDebugger';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${sourceCodePro.variable}`}>
      <body className="font-body antialiased bg-background text-foreground">
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </main>
            <Footer />
          </div>
          <Toaster />
          <AuthDebugger />
        </AuthProvider>
      </body>
    </html>
  );
}
