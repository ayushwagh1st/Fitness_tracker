'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import { Target, Scale, Calendar } from 'lucide-react';

export default function Onboarding() {
  const { user, profile } = useStore();
  const router = useRouter();
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState<'Weight Loss' | 'Muscle Gain' | 'Maintain'>('Maintain');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setError('');

    try {
      const updateData: any = { goal };
      const parsedAge = parseInt(age);
      const parsedWeight = parseFloat(weight);
      
      if (!isNaN(parsedAge)) updateData.age = parsedAge;
      if (!isNaN(parsedWeight)) updateData.weight = parsedWeight;

      await updateDoc(doc(db, 'users', user.uid), updateData);
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
        <div>
          <h2 className="text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-500 dark:text-zinc-400">
            We need a few details to personalize your experience.
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="age" className="block text-sm font-medium leading-6 text-zinc-700 dark:text-zinc-300">
                Age
              </label>
              <div className="relative mt-2 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Calendar className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                </div>
                <input
                  type="number"
                  name="age"
                  id="age"
                  required
                  min="1"
                  max="120"
                  className="block w-full rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 pl-10 text-zinc-900 dark:text-white focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 outline-none"
                  placeholder="25"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="weight" className="block text-sm font-medium leading-6 text-zinc-700 dark:text-zinc-300">
                Weight (kg)
              </label>
              <div className="relative mt-2 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Scale className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                </div>
                <input
                  type="number"
                  name="weight"
                  id="weight"
                  required
                  min="20"
                  max="300"
                  step="0.1"
                  className="block w-full rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 pl-10 text-zinc-900 dark:text-white focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 outline-none"
                  placeholder="70.5"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="goal" className="block text-sm font-medium leading-6 text-zinc-700 dark:text-zinc-300">
                Fitness Goal
              </label>
              <div className="relative mt-2 rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Target className="h-5 w-5 text-zinc-400 dark:text-zinc-500" />
                </div>
                <select
                  id="goal"
                  name="goal"
                  required
                  className="block w-full rounded-md border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 pl-10 text-zinc-900 dark:text-white focus:ring-2 focus:ring-inset focus:ring-emerald-500 sm:text-sm sm:leading-6 outline-none appearance-none"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as any)}
                >
                  <option value="Weight Loss">Weight Loss</option>
                  <option value="Muscle Gain">Muscle Gain</option>
                  <option value="Maintain">Maintain</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full justify-center rounded-md bg-emerald-500 px-3 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Start Your Journey'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
