'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, getDocs, orderBy, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { Activity, Plus, Clock, Dumbbell, Flame, Timer, Square, Play, Trophy } from 'lucide-react';

interface Workout {
  id: string;
  type: string;
  duration: number;
  calories: number;
  date: string;
  sets?: number;
  reps?: number;
}

const WORKOUT_TYPES = [
  { id: 'running', name: 'Running', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30', calPerMin: 11 },
  { id: 'cycling', name: 'Cycling', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30', calPerMin: 8 },
  { id: 'strength', name: 'Strength Training', icon: Dumbbell, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30', calPerMin: 6 },
  { id: 'yoga', name: 'Yoga', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30', calPerMin: 4 },
  { id: 'swimming', name: 'Swimming', icon: Activity, color: 'text-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30', calPerMin: 8 },
  { id: 'cardio', name: 'Cardio', icon: Flame, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30', calPerMin: 10 },
  { id: 'flexibility', name: 'Flexibility', icon: Activity, color: 'text-pink-500', bg: 'bg-pink-100 dark:bg-pink-900/30', calPerMin: 3 },
];

export default function WorkoutsPage() {
  const { user, profile, addXp } = useStore();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Timer state
  const [isWorkingOut, setIsWorkingOut] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [selectedWorkout, setSelectedWorkout] = useState(WORKOUT_TYPES[0].id);
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [saving, setSaving] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchWorkouts = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'workouts'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const fetchedWorkouts: Workout[] = [];
        querySnapshot.forEach((doc) => {
          fetchedWorkouts.push({ id: doc.id, ...doc.data() } as Workout);
        });
        setWorkouts(fetchedWorkouts);
      } catch (error) {
        console.error("Error fetching workouts:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, [user]);

  useEffect(() => {
    if (isWorkingOut) {
      timerRef.current = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isWorkingOut]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startWorkout = () => {
    setIsWorkingOut(true);
    setTimeElapsed(0);
  };

  const stopWorkout = async () => {
    setIsWorkingOut(false);
    if (timeElapsed < 10) {
      alert("Workout too short to record!");
      setTimeElapsed(0);
      return;
    }
    
    setSaving(true);
    
    const minutes = timeElapsed / 60;
    const typeObj = WORKOUT_TYPES.find(t => t.id === selectedWorkout);
    const calPerMin = typeObj ? typeObj.calPerMin : 5;
    const caloriesBurned = Math.round(minutes * calPerMin);
    const xpEarned = Math.round(minutes * 0.5) + 10; // Base 10 XP + 1 XP per 2 mins
    
    try {
      if (user && profile) {
        const parsedSets = Number(sets);
        const parsedReps = Number(reps);

        const newWorkout = {
          userId: user.uid,
          type: selectedWorkout,
          duration: Math.round(minutes),
          calories: caloriesBurned,
          date: format(new Date(), 'yyyy-MM-dd'),
          createdAt: serverTimestamp(),
          ...(selectedWorkout === 'strength' && !isNaN(parsedSets) && parsedSets > 0 ? { sets: parsedSets } : {}),
          ...(selectedWorkout === 'strength' && !isNaN(parsedReps) && parsedReps > 0 ? { reps: parsedReps } : {})
        };

        const docRef = await addDoc(collection(db, 'workouts'), newWorkout);
        setWorkouts([{ id: docRef.id, ...newWorkout } as Workout, ...workouts]);
        
        // Update user XP
        const newXp = (profile.xp || 0) + xpEarned;
        const newLevel = Math.floor(newXp / 100);
        
        await updateDoc(doc(db, 'users', user.uid), {
          xp: newXp,
          level: newLevel
        });
        
        addXp(xpEarned);
        
        if (Notification.permission === 'granted') {
          new Notification('Workout Complete!', {
            body: `You burned ${caloriesBurned} kcal and earned +${xpEarned} XP!`,
            icon: '/favicon.ico'
          });
        }
        
        alert(`Workout saved! Burned ${caloriesBurned} kcal. Earned +${xpEarned} XP.`);
      }
    } catch (error) {
      console.error("Error saving workout:", error);
      alert("Failed to save workout.");
    } finally {
      setSaving(false);
      setTimeElapsed(0);
      setSets('');
      setReps('');
    }
  };

  const getWorkoutIcon = (typeId: string) => {
    const type = WORKOUT_TYPES.find(t => t.id === typeId);
    if (!type) return <Activity className="h-6 w-6 text-zinc-500" />;
    const Icon = type.icon;
    return (
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${type.bg}`}>
        <Icon className={`h-6 w-6 ${type.color}`} />
      </div>
    );
  };

  const getWorkoutName = (typeId: string) => {
    return WORKOUT_TYPES.find(t => t.id === typeId)?.name || typeId;
  };

  const currentTypeObj = WORKOUT_TYPES.find(t => t.id === selectedWorkout);

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center">
          <Activity className="mr-3 text-emerald-500" />
          Workouts
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-2">Track your sessions and earn XP.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Workout Tracker */}
        <div className="space-y-8">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Select Workout</h2>
            
            <div className="grid grid-cols-2 gap-3 mb-6">
              {WORKOUT_TYPES.map((type) => (
                <button
                  key={type.id}
                  disabled={isWorkingOut}
                  onClick={() => setSelectedWorkout(type.id)}
                  className={`flex items-center p-3 rounded-xl border text-left transition-all ${
                    selectedWorkout === type.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-1 ring-emerald-500'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800 disabled:opacity-50'
                  }`}
                >
                  <type.icon className={`h-5 w-5 mr-2 ${selectedWorkout === type.id ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}`} />
                  <span className={`text-sm font-medium ${selectedWorkout === type.id ? 'text-emerald-900 dark:text-emerald-100' : 'text-zinc-700 dark:text-zinc-300'}`}>
                    {type.name}
                  </span>
                </button>
              ))}
            </div>

            {selectedWorkout === 'strength' && (
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Sets (optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={isWorkingOut}
                    value={sets}
                    onChange={(e) => setSets(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                    placeholder="e.g. 3"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Reps (optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={isWorkingOut}
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                    placeholder="e.g. 10"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
            <div className="text-center space-y-8 w-full">
              <div className="inline-flex items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 rounded-full border border-zinc-200 dark:border-zinc-800 mb-4">
                <Timer className="h-8 w-8 text-emerald-500 mr-3" />
                <span className="text-5xl font-mono font-bold text-zinc-900 dark:text-white tracking-wider">
                  {formatTime(timeElapsed)}
                </span>
              </div>
              
              <div className="text-zinc-500 dark:text-zinc-400 font-medium text-lg">
                {isWorkingOut ? `${getWorkoutName(selectedWorkout)} in progress...` : `Ready for ${getWorkoutName(selectedWorkout)}?`}
              </div>

              <div className="flex justify-center space-x-4">
                {!isWorkingOut ? (
                  <button
                    onClick={startWorkout}
                    disabled={saving}
                    className="flex items-center px-8 py-4 rounded-full bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/30"
                  >
                    <Play className="h-5 w-5 mr-2 fill-current" />
                    Start Session
                  </button>
                ) : (
                  <button
                    onClick={stopWorkout}
                    className="flex items-center px-8 py-4 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                  >
                    <Square className="h-5 w-5 mr-2 fill-current" />
                    Finish & Save
                  </button>
                )}
              </div>
              
              <div className="flex justify-center items-center space-x-6 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                <div className="text-center">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Current XP Rate</p>
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center">
                    <Trophy className="h-4 w-4 mr-1" /> Base 10 XP
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Est. Calories</p>
                  <p className="text-orange-500 dark:text-orange-400 font-bold flex items-center justify-center">
                    <Flame className="h-4 w-4 mr-1" /> 
                    {Math.round((timeElapsed / 60) * (currentTypeObj?.calPerMin || 5))} kcal
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Workout History */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)]">
          <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Recent Workouts</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-12 text-center text-zinc-500 dark:text-zinc-400">Loading workouts...</div>
            ) : workouts.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Dumbbell className="h-10 w-10 text-zinc-400 dark:text-zinc-500" />
                </div>
                <h3 className="text-lg font-medium text-zinc-900 dark:text-white mb-2">No workouts yet</h3>
                <p className="text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
                  Start a session to track your progress and earn XP.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {workouts.map((workout) => (
                  <div key={workout.id} className="p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="flex items-center">
                      {getWorkoutIcon(workout.type)}
                      <div className="ml-4">
                        <h3 className="font-semibold text-zinc-900 dark:text-white">{getWorkoutName(workout.type)}</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400 flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {workout.duration} min • {format(new Date(workout.date), 'MMM d, yyyy')}
                          {workout.sets && workout.reps && ` • ${workout.sets} sets x ${workout.reps} reps`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-zinc-900 dark:text-white">{workout.calories}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">kcal</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
