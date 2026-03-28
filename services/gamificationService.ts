import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/lib/store';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';

export const ACHIEVEMENTS = {
  FIRST_WORKOUT: 'First Workout',
  STREAK_7_DAYS: '7-Day Streak',
  STEPS_10K: '10,000 Steps Completed',
};

export async function checkAndAwardAchievements(userId: string, profile: UserProfile, newAchievement: string) {
  const currentAchievements = profile.achievements || [];
  if (!currentAchievements.includes(newAchievement)) {
    const updatedAchievements = [...currentAchievements, newAchievement];
    await updateDoc(doc(db, 'users', userId), {
      achievements: updatedAchievements
    });
    
    if (typeof window !== 'undefined' && Notification.permission === 'granted') {
      new Notification('Achievement Unlocked!', {
        body: `You earned the "${newAchievement}" badge!`,
        icon: '/favicon.ico'
      });
    }
    return updatedAchievements;
  }
  return currentAchievements;
}

export async function updateStreak(userId: string, profile: UserProfile, lastActivityDateStr: string) {
  const today = startOfDay(new Date());
  const lastActivityDate = startOfDay(parseISO(lastActivityDateStr));
  const diff = differenceInDays(today, lastActivityDate);
  
  let newStreak = profile.streak || 0;
  
  if (diff === 1) {
    // Consecutive day
    newStreak += 1;
  } else if (diff > 1) {
    // Streak broken
    newStreak = 1;
  } else if (diff === 0 && newStreak === 0) {
    // First activity today
    newStreak = 1;
  }
  
  if (newStreak !== profile.streak) {
    await updateDoc(doc(db, 'users', userId), {
      streak: newStreak
    });
    
    if (newStreak === 7) {
      await checkAndAwardAchievements(userId, { ...profile, streak: newStreak }, ACHIEVEMENTS.STREAK_7_DAYS);
    }
  }
  
  return newStreak;
}
