'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { format, subDays } from 'date-fns';
import { Activity, Flame, Footprints, Dumbbell } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function Progress() {
  const { user } = useStore();
  const { theme } = useTheme();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#a1a1aa' : '#71717a';
  const tooltipBg = isDark ? '#18181b' : '#ffffff';
  const tooltipBorder = isDark ? '#27272a' : '#e4e4e7';
  const tooltipText = isDark ? '#ffffff' : '#18181b';

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user) return;

      setLoading(true);
      try {
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
          return format(subDays(new Date(), 6 - i), 'yyyy-MM-dd');
        });

        // Fetch Steps
        const stepsQuery = query(collection(db, 'steps'), where('userId', '==', user.uid));
        const stepsSnapshot = await getDocs(stepsQuery);
        const stepsMap = new Map();
        stepsSnapshot.forEach((doc) => {
          const d = doc.data();
          stepsMap.set(d.date, d);
        });

        // Fetch Workouts
        const workoutsQuery = query(collection(db, 'workouts'), where('userId', '==', user.uid));
        const workoutsSnapshot = await getDocs(workoutsQuery);
        const workoutsMap = new Map();
        workoutsSnapshot.forEach((doc) => {
          const d = doc.data();
          if (!workoutsMap.has(d.date)) {
            workoutsMap.set(d.date, { duration: 0, calories: 0 });
          }
          const current = workoutsMap.get(d.date);
          workoutsMap.set(d.date, {
            duration: current.duration + d.duration,
            calories: current.calories + d.calories
          });
        });

        const chartData = last7Days.map(date => {
          const stepRecord = stepsMap.get(date);
          const workoutRecord = workoutsMap.get(date);
          return {
            date: format(new Date(date), 'MMM dd'),
            steps: stepRecord?.steps || 0,
            calories: (stepRecord?.calories || 0) + (workoutRecord?.calories || 0),
            workoutDuration: workoutRecord?.duration || 0
          };
        });

        setData(chartData);
      } catch (error) {
        console.error("Error fetching progress:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user]);

  if (!user) return null;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center">
          <Activity className="mr-3 text-emerald-500" />
          Your Progress
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">Last 7 days of activity.</p>
      </header>

      {loading ? (
        <div className="animate-pulse space-y-8">
          <div className="h-72 bg-zinc-100 dark:bg-zinc-900 rounded-2xl"></div>
          <div className="h-72 bg-zinc-100 dark:bg-zinc-900 rounded-2xl"></div>
          <div className="h-72 bg-zinc-100 dark:bg-zinc-900 rounded-2xl"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Steps Chart */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm lg:col-span-2">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center mb-6">
              <Footprints className="mr-2 text-emerald-500" />
              Steps History
            </h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="date" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', color: tooltipText }}
                    itemStyle={{ color: '#10b981' }}
                    cursor={{ fill: isDark ? '#27272a' : '#f4f4f5' }}
                  />
                  <Bar dataKey="steps" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Calories Chart */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center mb-6">
              <Flame className="mr-2 text-orange-500" />
              Total Calories Burned
            </h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="date" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', color: tooltipText }}
                    itemStyle={{ color: '#f97316' }}
                  />
                  <Line type="monotone" dataKey="calories" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Workout Duration Chart */}
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center mb-6">
              <Dumbbell className="mr-2 text-purple-500" />
              Workout Duration (min)
            </h2>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="date" stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke={textColor} fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: tooltipBg, borderColor: tooltipBorder, borderRadius: '8px', color: tooltipText }}
                    itemStyle={{ color: '#a855f7' }}
                    cursor={{ fill: isDark ? '#27272a' : '#f4f4f5' }}
                  />
                  <Bar dataKey="workoutDuration" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
