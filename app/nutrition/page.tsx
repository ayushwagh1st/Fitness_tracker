'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Apple, Plus, Droplets, Flame } from 'lucide-react';

interface NutritionEntry {
  id: string;
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  type: 'meal' | 'snack';
  date: string;
}

export default function NutritionPage() {
  const { user } = useStore();
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [type, setType] = useState<'meal' | 'snack'>('meal');

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    const fetchNutrition = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'nutrition'),
          where('userId', '==', user.uid),
          where('date', '==', today),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedEntries: NutritionEntry[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.foodName) {
            fetchedEntries.push({ id: doc.id, ...data } as NutritionEntry);
          }
        });
        setEntries(fetchedEntries);

        // Fetch water
        const waterDocRef = doc(db, 'nutrition', `${user.uid}_water_${today}`);
        const waterDoc = await getDoc(waterDocRef);
        if (waterDoc.exists()) {
          setWaterGlasses(waterDoc.data().water || 0);
        }
      } catch (error) {
        console.error("Error fetching nutrition:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNutrition();
  }, [user, today]);

  const updateWater = async (newAmount: number) => {
    if (!user) return;
    setWaterGlasses(newAmount);
    try {
      const waterDocRef = doc(db, 'nutrition', `${user.uid}_water_${today}`);
      await setDoc(waterDocRef, {
        userId: user.uid,
        water: newAmount,
        date: today,
        createdAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error updating water:", error);
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !foodName || !calories) return;

    try {
      const parsedCalories = Number(calories);
      if (isNaN(parsedCalories) || parsedCalories < 0) {
        alert("Please enter a valid number for calories.");
        return;
      }

      const newEntry = {
        userId: user.uid,
        foodName,
        calories: parsedCalories,
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        type,
        date: today,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'nutrition'), newEntry);
      
      setEntries([{ id: docRef.id, ...newEntry } as NutritionEntry, ...entries]);
      setShowAddModal(false);
      setFoodName('');
      setCalories('');
      setProtein('');
      setCarbs('');
      setFat('');
    } catch (error) {
      console.error("Error adding nutrition entry:", error);
    }
  };

  const totalCalories = entries.reduce((sum, entry) => sum + entry.calories, 0);
  const totalProtein = entries.reduce((sum, entry) => sum + entry.protein, 0);
  const totalCarbs = entries.reduce((sum, entry) => sum + entry.carbs, 0);
  const totalFat = entries.reduce((sum, entry) => sum + entry.fat, 0);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Nutrition</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Track your daily food and water intake.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Food
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center">
          <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mr-4">
            <Flame className="h-6 w-6 text-orange-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Calories</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{totalCalories} <span className="text-sm font-normal text-zinc-500">kcal</span></p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center">
          <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mr-4">
            <div className="text-blue-500 font-bold">P</div>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Protein</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{totalProtein} <span className="text-sm font-normal text-zinc-500">g</span></p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center">
          <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mr-4">
            <div className="text-green-500 font-bold">C</div>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Carbs</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{totalCarbs} <span className="text-sm font-normal text-zinc-500">g</span></p>
          </div>
        </div>
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center">
          <div className="h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center mr-4">
            <div className="text-yellow-500 font-bold">F</div>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Fat</p>
            <p className="text-2xl font-bold text-zinc-900 dark:text-white">{totalFat} <span className="text-sm font-normal text-zinc-500">g</span></p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Today&apos;s Log</h2>
            </div>
            {loading ? (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">Loading...</div>
            ) : entries.length === 0 ? (
              <div className="p-12 text-center">
                <Apple className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 dark:text-zinc-400">No food logged today.</p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {entries.map((entry) => (
                  <li key={entry.id} className="p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-white">{entry.foodName}</p>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 capitalize">{entry.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-zinc-900 dark:text-white">{entry.calories} kcal</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {entry.protein}g P • {entry.carbs}g C • {entry.fat}g F
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 text-center">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-6">Water Intake</h2>
            <div className="flex justify-center mb-6">
              <Droplets className="h-16 w-16 text-blue-500" />
            </div>
            <p className="text-4xl font-bold text-zinc-900 dark:text-white mb-2">{waterGlasses} / 8</p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8">Glasses today</p>
            
            <div className="flex justify-center space-x-4">
              <button 
                onClick={() => updateWater(Math.max(0, waterGlasses - 1))}
                className="w-12 h-12 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                -
              </button>
              <button 
                onClick={() => updateWater(waterGlasses + 1)}
                className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 transition-colors shadow-sm shadow-blue-500/20"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Food Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-md shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Add Food</h2>
              <button onClick={() => setShowAddModal(false)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                ✕
              </button>
            </div>
            <form onSubmit={handleAddEntry} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Food Name</label>
                <input
                  type="text"
                  required
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="e.g., Oatmeal with Berries"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'meal' | 'snack')}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  >
                    <option value="meal">Meal</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Protein (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Fat (g)</label>
                  <input
                    type="number"
                    min="0"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
