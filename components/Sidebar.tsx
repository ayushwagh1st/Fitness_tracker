'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, LayoutDashboard, LineChart, User, LogOut, Map, Apple, Users, Trophy } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useStore } from '@/lib/store';
import { ThemeToggle } from '@/components/ThemeToggle';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Workouts', href: '/workouts', icon: Activity },
  { name: 'GPS Tracking', href: '/activities', icon: Map },
  { name: 'Nutrition', href: '/nutrition', icon: Apple },
  { name: 'Social', href: '/social', icon: Users },
  { name: 'Progress', href: '/progress', icon: LineChart },
  { name: 'Profile', href: '/profile', icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, profile } = useStore();

  if (!user || pathname === '/login' || pathname === '/onboarding') {
    return null;
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-screen w-64 flex-col bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 transition-colors">
        <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center">
            <Activity className="h-6 w-6 text-emerald-500 mr-2" />
            <span className="text-lg font-bold tracking-tight">FitQuest</span>
          </div>
          <ThemeToggle />
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400'
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                      isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300'
                    }`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
          <div className="flex items-center mb-4">
            <div className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-emerald-600 dark:text-emerald-500 font-bold border border-zinc-200 dark:border-zinc-700">
              {profile?.name?.charAt(0) || user.email?.charAt(0) || 'U'}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">{profile?.name || 'User'}</p>
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center">
                <Trophy className="h-3 w-3 mr-1 text-yellow-500" />
                Level {profile?.level || 0}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut(auth)}
            className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-zinc-400 dark:text-zinc-500" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 z-50 pb-safe">
        <nav className="flex justify-around items-center h-16 px-2">
          {navItems.slice(0, 5).map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 z-50 flex items-center justify-between px-4">
        <div className="flex items-center">
          <Activity className="h-5 w-5 text-emerald-500 mr-2" />
          <span className="text-lg font-bold tracking-tight">FitQuest</span>
        </div>
        <div className="flex items-center space-x-2">
          <ThemeToggle />
          <Link href="/profile" className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-emerald-600 dark:text-emerald-500 font-bold border border-zinc-200 dark:border-zinc-700">
            {profile?.name?.charAt(0) || user.email?.charAt(0) || 'U'}
          </Link>
        </div>
      </div>
    </>
  );
}
