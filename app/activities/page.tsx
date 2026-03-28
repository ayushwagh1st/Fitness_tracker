'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Play, Square, Map as MapIcon } from 'lucide-react';

export default function ActivitiesPage() {
  const { user, profile, addXp } = useStore();
  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState(0); // in meters
  const [duration, setDuration] = useState(0); // in seconds
  const [positions, setPositions] = useState<GeolocationPosition[]>([]);
  
  const watchIdRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const lastPositionRef = useRef<GeolocationPosition | null>(null);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsTracking(true);
    setDistance(0);
    setDuration(0);
    setPositions([]);
    lastPositionRef.current = null;

    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const lastPos = lastPositionRef.current;
        if (lastPos) {
          const dist = calculateDistance(
            lastPos.coords.latitude,
            lastPos.coords.longitude,
            position.coords.latitude,
            position.coords.longitude
          );
          // Only add distance if accuracy is decent and distance is reasonable (e.g., > 1m, < 100m per update)
          if (position.coords.accuracy < 50 && dist > 1 && dist < 100) {
            setDistance((d) => d + dist);
          }
        }
        lastPositionRef.current = position;
        setPositions((prev) => [...prev, position]);
      },
      (error) => {
        console.error('Error watching position:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000
      }
    );
  };

  const stopTracking = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTracking(false);

    if (distance > 50 && user) { // Only save if distance > 50m
      try {
        const activityData = {
          userId: user.uid,
          type: 'run', // Defaulting to run for now
          distance: distance,
          duration: duration,
          date: new Date().toISOString(),
          createdAt: serverTimestamp(),
          // Store a simplified path for rendering later
          path: positions.map(p => ({
            lat: p.coords.latitude,
            lng: p.coords.longitude
          }))
        };
        
        await addDoc(collection(db, 'activities'), activityData);
        
        // Award XP based on distance (e.g., 10 XP per km)
        const xpEarned = Math.floor((distance / 1000) * 10);
        if (xpEarned > 0) {
          addXp(xpEarned);
          if (Notification.permission === 'granted') {
            new Notification('Activity Saved!', {
              body: `You ran ${(distance / 1000).toFixed(2)}km and earned ${xpEarned} XP!`,
              icon: '/favicon.ico'
            });
          }
        } else {
            alert('Activity saved!');
        }
      } catch (error) {
        console.error('Error saving activity:', error);
        alert('Failed to save activity.');
      }
    } else if (distance <= 50) {
      alert('Distance too short to save.');
    }
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">GPS Tracking</h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Track your outdoor runs and walks.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-8 text-center">
        
        <div className="grid grid-cols-2 gap-8 mb-12">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Distance</p>
            <p className="text-5xl font-bold text-zinc-900 dark:text-white">
              {(distance / 1000).toFixed(2)} <span className="text-2xl text-zinc-400">km</span>
            </p>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">Duration</p>
            <p className="text-5xl font-bold text-zinc-900 dark:text-white font-mono">
              {formatDuration(duration)}
            </p>
          </div>
        </div>

        <div className="flex justify-center">
          {!isTracking ? (
            <button
              onClick={startTracking}
              className="flex items-center justify-center w-32 h-32 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
            >
              <Play className="h-12 w-12 ml-2" />
            </button>
          ) : (
            <button
              onClick={stopTracking}
              className="flex items-center justify-center w-32 h-32 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 transition-all hover:scale-105 active:scale-95 animate-pulse"
            >
              <Square className="h-10 w-10" />
            </button>
          )}
        </div>
        
        <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">
          {isTracking ? 'Tracking your activity...' : 'Press play to start tracking'}
        </p>
      </div>
    </div>
  );
}
