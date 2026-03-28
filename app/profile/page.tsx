'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { User, Target, Scale, Calendar, Trophy, Save, Flame, Medal } from 'lucide-react';

export default function Profile() {
  const { user, profile } = useStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    age: profile?.age || '',
    weight: profile?.weight || '',
    goal: profile?.goal || 'Maintain',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    setSuccess(false);

    try {
      const updateData: any = {
        name: formData.name,
        goal: formData.goal,
      };
      
      const parsedAge = parseInt(formData.age as string);
      const parsedWeight = parseFloat(formData.weight as string);
      
      if (!isNaN(parsedAge)) updateData.age = parsedAge;
      if (!isNaN(parsedWeight)) updateData.weight = parsedWeight;

      await updateDoc(doc(db, 'users', user.uid), updateData);
      setSuccess(true);
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!user || !profile) return null;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center">
          <User className="mr-3 text-emerald-500" />
          Profile Settings
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">Manage your personal information and goals.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm flex flex-col items-center text-center">
            <div className="h-24 w-24 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-500 text-3xl font-bold mb-4">
              {profile.name?.charAt(0) || user.email?.charAt(0) || 'U'}
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">{profile.name || 'Athlete'}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{user.email}</p>
            
            <div className="mt-6 w-full pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Level</span>
                <span className="text-zinc-900 dark:text-white font-bold">{profile.level}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Total XP</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center">
                  <Trophy className="h-4 w-4 mr-1" /> {profile.xp}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Streak</span>
                <span className="text-orange-500 dark:text-orange-400 font-bold flex items-center">
                  <Flame className="h-4 w-4 mr-1" /> {profile.streak || 0} Days
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h3 className="font-bold text-zinc-900 dark:text-white mb-4 flex items-center">
              <Medal className="h-5 w-5 mr-2 text-purple-500" />
              Achievements
            </h3>
            
            {(!profile.achievements || profile.achievements.length === 0) ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">No achievements yet. Keep training!</p>
            ) : (
              <ul className="space-y-3">
                {profile.achievements.map((achievement, idx) => (
                  <li key={idx} className="flex items-center p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center mr-3">
                      <Medal className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">{achievement}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Edit Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              {success && (
                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  Profile updated successfully!
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Display Name</label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="age" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Age</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Calendar className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                      </div>
                      <input
                        type="number"
                        name="age"
                        id="age"
                        min="1"
                        max="120"
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        value={formData.age}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="weight" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Weight (kg)</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Scale className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                      </div>
                      <input
                        type="number"
                        name="weight"
                        id="weight"
                        step="0.1"
                        min="20"
                        max="300"
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                        value={formData.weight}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="goal" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Fitness Goal</label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Target className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    <select
                      id="goal"
                      name="goal"
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all appearance-none"
                      value={formData.goal}
                      onChange={handleChange}
                    >
                      <option value="Weight Loss">Weight Loss</option>
                      <option value="Muscle Gain">Muscle Gain</option>
                      <option value="Maintain">Maintain</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
