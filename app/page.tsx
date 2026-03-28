'use client';

import { useStore } from '@/lib/store';
import { StepTracker } from '@/components/StepTracker';
import { Trophy, Star, Activity, LineChart, Map, Apple, Users, Flame } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { profile } = useStore();

  if (!profile) return null;

  const xpProgress = (profile.xp % 100) / 100 * 100;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Welcome back, {profile.name?.split(' ')[0] || 'Athlete'}!
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Let&apos;s crush your {profile.goal?.toLowerCase() || 'fitness'} goals today.</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-4 bg-white dark:bg-zinc-900 px-6 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Level {profile.level}</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white">{profile.xp} XP</p>
            </div>
          </div>
          <div className="flex items-center space-x-4 bg-white dark:bg-zinc-900 px-6 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400">
              <Flame className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Streak</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white">{profile.streak || 0} Days</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <StepTracker />
          
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center mb-6">
              <Star className="mr-2 text-yellow-500" />
              Level Progress
            </h2>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-zinc-500 dark:text-zinc-400 font-medium">Level {profile.level}</span>
              <span className="text-zinc-900 dark:text-white font-bold">{profile.xp % 100} / 100 XP</span>
            </div>
            <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-500 transition-all duration-1000 ease-out"
                style={{ width: `${xpProgress}%` }}
              />
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-4 text-center">
              Complete workouts and hit your daily step goal to earn XP!
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center mb-6">
              <Activity className="mr-2 text-blue-500" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Link href="/workouts" className="flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 transition-colors group">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-2 group-hover:scale-110 transition-transform">
                  <Activity className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Workout</span>
              </Link>
              
              <Link href="/activities" className="flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 transition-colors group">
                <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
                  <Map className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">GPS Track</span>
              </Link>

              <Link href="/nutrition" className="flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 transition-colors group">
                <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 mb-2 group-hover:scale-110 transition-transform">
                  <Apple className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Nutrition</span>
              </Link>

              <Link href="/social" className="flex flex-col items-center justify-center p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/50 transition-colors group">
                <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-2 group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Social</span>
              </Link>
            </div>
          </div>
          
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h3 className="font-bold text-zinc-900 dark:text-white mb-4">Your Profile</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400 text-sm">Age</span>
                <span className="text-zinc-900 dark:text-zinc-300 text-sm font-medium">{profile.age} yrs</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500 dark:text-zinc-400 text-sm">Weight</span>
                <span className="text-zinc-900 dark:text-zinc-300 text-sm font-medium">{profile.weight} kg</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-zinc-500 dark:text-zinc-400 text-sm">Goal</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-sm font-bold capitalize">{profile.goal}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
