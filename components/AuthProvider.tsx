'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, getDocFromServer } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useStore, UserProfile } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setAuthReady } = useStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Test connection
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      
      if (user) {
        // Listen to user profile
        const unsubscribeProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            setProfile(data);
            
            // Check if onboarding is complete
            if (!data.age || !data.weight || !data.goal) {
              if (pathname !== '/onboarding') {
                router.push('/onboarding');
              }
            } else if (pathname === '/login' || pathname === '/onboarding') {
              router.push('/');
            }
          } else {
            setProfile(null);
            if (pathname !== '/onboarding') {
              router.push('/onboarding');
            }
          }
          setAuthReady(true);
        }, (error) => {
          console.error("Error fetching profile:", error);
          setAuthReady(true);
        });
        
        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        setAuthReady(true);
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
    });

    return () => unsubscribeAuth();
  }, [pathname, router, setAuthReady, setProfile, setUser]);

  return <>{children}</>;
}
