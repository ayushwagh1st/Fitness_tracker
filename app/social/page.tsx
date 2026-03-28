'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, limit, where, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { Users, Trophy, Search, UserPlus, Check } from 'lucide-react';

interface LeaderboardUser {
  id: string;
  name: string;
  xp: number;
  level: number;
  streak: number;
}

interface Friend {
  id: string;
  friendId: string;
  friendName: string;
  status: 'pending' | 'accepted';
}

export default function SocialPage() {
  const { user, profile } = useStore();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSocialData = async () => {
      if (!user) return;
      try {
        // Fetch Leaderboard (Top 10 by XP)
        const lbQuery = query(collection(db, 'users'), orderBy('xp', 'desc'), limit(10));
        const lbSnapshot = await getDocs(lbQuery);
        const lbData: LeaderboardUser[] = [];
        lbSnapshot.forEach(doc => {
          const data = doc.data();
          lbData.push({
            id: doc.id,
            name: data.name || 'Anonymous',
            xp: data.xp || 0,
            level: data.level || 0,
            streak: data.streak || 0
          });
        });
        setLeaderboard(lbData);

        // Fetch Friends
        const friendsQuery = query(collection(db, 'friends'), where('userId', '==', user.uid));
        const friendsSnapshot = await getDocs(friendsQuery);
        const friendsData: Friend[] = [];
        friendsSnapshot.forEach(doc => {
          friendsData.push({ id: doc.id, ...doc.data() } as Friend);
        });
        setFriends(friendsData);

      } catch (error) {
        console.error("Error fetching social data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSocialData();
  }, [user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      // Simple search by exact name (Firestore doesn't support full-text search natively without extensions)
      const q = query(collection(db, 'users'), where('name', '==', searchQuery.trim()), limit(5));
      const snapshot = await getDocs(q);
      const results: LeaderboardUser[] = [];
      snapshot.forEach(doc => {
        if (doc.id !== user?.uid) { // Don't show self
          const data = doc.data();
          results.push({
            id: doc.id,
            name: data.name || 'Anonymous',
            xp: data.xp || 0,
            level: data.level || 0,
            streak: data.streak || 0
          });
        }
      });
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  const handleAddFriend = async (friendId: string, friendName: string) => {
    if (!user) return;
    try {
      // Check if already friends
      if (friends.some(f => f.friendId === friendId)) {
        alert("Already friends or request pending.");
        return;
      }

      const newFriend = {
        userId: user.uid,
        friendId,
        friendName,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'friends'), newFriend);
      setFriends([...friends, { id: docRef.id, ...newFriend } as Friend]);
      alert("Friend request sent!");
    } catch (error) {
      console.error("Error adding friend:", error);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">Social</h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Connect with friends and climb the leaderboard.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leaderboard */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center">
              <Trophy className="h-6 w-6 text-yellow-500 mr-3" />
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Global Leaderboard</h2>
            </div>
            
            {loading ? (
              <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">Loading leaderboard...</div>
            ) : (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {leaderboard.map((lbUser, index) => (
                  <li 
                    key={lbUser.id} 
                    className={`p-4 flex items-center justify-between transition-colors ${
                      lbUser.id === user?.uid 
                        ? 'bg-emerald-50 dark:bg-emerald-900/10 border-l-4 border-emerald-500' 
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold mr-4 ${
                        index === 0 ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-500' :
                        index === 1 ? 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' :
                        index === 2 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-500' :
                        'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 font-bold mr-3">
                        {lbUser.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-white">
                          {lbUser.name} {lbUser.id === user?.uid && '(You)'}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Level {lbUser.level} • {lbUser.streak} Day Streak</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">{lbUser.xp} XP</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Friends & Search */}
        <div className="space-y-8">
          {/* Search Users */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center">
              <Search className="h-5 w-5 mr-2 text-zinc-400" />
              Find Friends
            </h2>
            <form onSubmit={handleSearch} className="flex mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Exact username..."
                className="flex-1 px-4 py-2 rounded-l-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border border-l-0 border-zinc-300 dark:border-zinc-700 rounded-r-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                Search
              </button>
            </form>

            {searchResults.length > 0 && (
              <ul className="space-y-3 mt-4">
                {searchResults.map(result => {
                  const isFriend = friends.some(f => f.friendId === result.id);
                  return (
                    <li key={result.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-white text-sm">{result.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">Level {result.level}</p>
                      </div>
                      {isFriend ? (
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center">
                          <Check className="h-3 w-3 mr-1" /> Added
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddFriend(result.id, result.name)}
                          className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-full transition-colors"
                          title="Add Friend"
                        >
                          <UserPlus className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Friends List */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2 text-zinc-400" />
              My Friends
            </h2>
            
            {friends.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">You haven&apos;t added any friends yet.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {friends.map(friend => (
                  <li key={friend.id} className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 font-bold mr-3 text-xs">
                        {friend.friendName.charAt(0)}
                      </div>
                      <p className="font-medium text-zinc-900 dark:text-white text-sm">{friend.friendName}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 capitalize">
                      {friend.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
