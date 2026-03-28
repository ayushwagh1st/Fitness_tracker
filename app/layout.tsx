import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { Sidebar } from '@/components/Sidebar';
import { ThemeProvider } from '@/components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FitQuest - Gamified Fitness Tracker',
  description: 'Track steps, workouts, and level up your fitness.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 min-h-screen flex antialiased`} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthProvider>
            <Sidebar />
            <main className="flex-1 overflow-y-auto pt-14 pb-16 md:pt-0 md:pb-0">
              {children}
            </main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
