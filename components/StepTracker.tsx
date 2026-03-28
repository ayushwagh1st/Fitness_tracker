'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import { format } from 'date-fns';
import { Footprints, Flame, Plus, Minus } from 'lucide-react';

const DAILY_STEP_GOAL = 8000;
const CALORIES_PER_STEP = 0.04;

import { checkAndAwardAchievements, ACHIEVEMENTS, updateStreak } from '@/services/gamificationService';

export function StepTracker() {
  const { user, profile, addXp } = useStore();
  const [steps, setSteps] = useState(0);
  const [calories, setCalories] = useState(0);
  const [loading, setLoading] = useState(true);
  const [goalReached, setGoalReached] = useState(false);
  const [isTracking, setIsTracking] = useState(false);
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const stepDocId = user ? `${user.uid}_${today}` : null;

  const loadDailySteps = useCallback(async () => {
    if (!user || !stepDocId) return;
    
    try {
      const stepRef = doc(db, 'steps', stepDocId);
      const stepSnap = await getDoc(stepRef);
      
      if (stepSnap.exists()) {
        const data = stepSnap.data();
        setSteps(data.steps || 0);
        setCalories(data.calories || 0);
        if (data.steps >= DAILY_STEP_GOAL) {
          setGoalReached(true);
        }
      } else {
        await setDoc(stepRef, {
          userId: user.uid,
          date: today,
          steps: 0,
          calories: 0,
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error loading steps:", error);
    } finally {
      setLoading(false);
    }
  }, [user, stepDocId, today]);

  useEffect(() => {
    loadDailySteps();
  }, [loadDailySteps]);

  const updateStepsInDb = useCallback(async (newSteps: number) => {
    if (!user || !stepDocId || !profile) return;
    
    const newCalories = Math.round(newSteps * CALORIES_PER_STEP);
    
    try {
      await updateDoc(doc(db, 'steps', stepDocId), {
        steps: newSteps,
        calories: newCalories,
        updatedAt: new Date().toISOString()
      });
      
      // Update streak
      if (newSteps > 0) {
        // We pass today's date to updateStreak because they are active today
        await updateStreak(user.uid, profile, new Date().toISOString());
      }
      
      // Check for daily goal XP
      if (newSteps >= DAILY_STEP_GOAL && !goalReached) {
        setGoalReached(true);
        addXp(5); // +5 XP for completing daily step goal
        await updateDoc(doc(db, 'users', user.uid), {
          xp: (profile.xp || 0) + 5,
          level: Math.floor(((profile.xp || 0) + 5) / 100)
        });
        
        // Browser notification
        if (Notification.permission === 'granted') {
          new Notification('Goal Reached!', {
            body: 'You completed your daily step goal! +5 XP',
            icon: '/favicon.ico'
          });
        }
      }

      // Check for 10k steps achievement
      if (newSteps >= 10000) {
        await checkAndAwardAchievements(user.uid, profile, ACHIEVEMENTS.STEPS_10K);
      }
    } catch (error) {
      console.error("Error updating steps:", error);
    }
  }, [user, stepDocId, goalReached, addXp, profile]);

  const handleManualAdd = (amount: number) => {
    const newSteps = Math.max(0, steps + amount);
    setSteps(newSteps);
    setCalories(Math.round(newSteps * CALORIES_PER_STEP));
    updateStepsInDb(newSteps);
  };

  // Device Motion API for realistic step tracking
  useEffect(() => {
    if (!isTracking) return;

    let lastY = 0;
    let lastTime = 0;
    const threshold = 1.5; // Acceleration threshold

    const handleMotion = (event: DeviceMotionEvent) => {
      const currentY = event.accelerationIncludingGravity?.y || 0;
      const currentTime = new Date().getTime();
      
      // Simple step detection algorithm
      if (Math.abs(currentY - lastY) > threshold && (currentTime - lastTime) > 300) {
        setSteps(prev => {
          const newSteps = prev + 1;
          setCalories(Math.round(newSteps * CALORIES_PER_STEP));
          // Debounce DB updates in a real app, but for now we update every 10 steps
          if (newSteps % 10 === 0) {
            updateStepsInDb(newSteps);
          }
          return newSteps;
        });
        lastTime = currentTime;
      }
      lastY = currentY;
    };

    if (typeof window !== 'undefined' && window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      if (typeof window !== 'undefined' && window.DeviceMotionEvent) {
        window.removeEventListener('devicemotion', handleMotion);
      }
    };
  }, [isTracking, updateStepsInDb]);

  const toggleTracking = async () => {
    if (!isTracking) {
      // Request permission for iOS 13+ devices
      if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
        try {
          const permissionState = await (DeviceMotionEvent as any).requestPermission();
          if (permissionState === 'granted') {
            setIsTracking(true);
          } else {
            alert('Permission to access device motion was denied.');
          }
        } catch (error) {
          console.error(error);
        }
      } else {
        // Non-iOS 13+ devices
        setIsTracking(true);
      }
      
      // Request notification permission
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    } else {
      setIsTracking(false);
      // Final sync when stopping
      updateStepsInDb(steps);
    }
  };

  if (loading) return <div className="animate-pulse h-64 bg-zinc-100 dark:bg-zinc-900 rounded-2xl"></div>;

  const progressPercentage = Math.min(100, (steps / DAILY_STEP_GOAL) * 100);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center">
          <Footprints className="mr-2 text-emerald-500" />
          Today&apos;s Activity
        </h2>
        <button
          onClick={toggleTracking}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            isTracking 
              ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30' 
              : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-500/30'
          }`}
        >
          {isTracking ? 'Stop Tracking' : 'Start Pedometer'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center">
          <Footprints className="h-8 w-8 text-emerald-500 mb-2" />
          <span className="text-3xl font-bold text-zinc-900 dark:text-white">{steps.toLocaleString()}</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Steps</span>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-950 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center">
          <Flame className="h-8 w-8 text-orange-500 mb-2" />
          <span className="text-3xl font-bold text-zinc-900 dark:text-white">{calories.toLocaleString()}</span>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">Calories (kcal)</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-zinc-500 dark:text-zinc-400">Daily Goal</span>
          <span className="text-zinc-900 dark:text-white font-medium">{steps.toLocaleString()} / {DAILY_STEP_GOAL.toLocaleString()}</span>
        </div>
        <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 text-center">Manual Entry (Fallback)</p>
        <div className="flex justify-center gap-4">
          <button 
            onClick={() => handleManualAdd(-500)}
            className="flex items-center justify-center h-10 w-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <Minus className="h-5 w-5" />
          </button>
          <button 
            onClick={() => handleManualAdd(500)}
            className="flex items-center justify-center px-4 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" /> 500
          </button>
          <button 
            onClick={() => handleManualAdd(1000)}
            className="flex items-center justify-center px-4 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" /> 1000
          </button>
        </div>
      </div>
    </div>
  );
}
