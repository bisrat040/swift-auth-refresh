import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { User, SubscriptionTier } from '../types';
import { supabase, signOutUser } from '../lib/supabase';
import { users as mockUsers } from '../data/mockData';

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  availableUsers: User[];
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isBuildingOwner: boolean;
  isEmployee: boolean;
  isInitializing: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateUserSubscription: (userId: string, tier: SubscriptionTier) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<User[]>(mockUsers);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        // Fallback to mock user if email matches and DB lookup fails
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const mockUser = mockUsers.find(u => u.email === user.email);
          if (mockUser) return { ...mockUser, id: user.id };
        }
        return null;
      }

      if (profile) {
        const user: User = {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          role: profile.role,
          subscriptionTier: profile.subscription_tier || 'BASIC',
          avatarUrl: profile.avatar_url,
          isActive: profile.is_active,
          isGranted: profile.is_granted,
          phone: profile.phone,
          bio: profile.bio,
          location: profile.location,
          department: profile.department,
          joinedAt: profile.created_at
        };
        return user;
      }
    } catch (err) {
      console.error("Catch error fetching profile:", err);
    }
    return null;
  };

  const fetchAllProfiles = async () => {
    try {
      const { data: allProfiles } = await supabase.from('profiles').select('*');
      if (allProfiles && allProfiles.length > 0) {
        const dbUsers: User[] = allProfiles.map(p => ({
          id: p.id,
          name: p.name,
          email: p.email,
          role: p.role,
          subscriptionTier: p.subscription_tier || 'BASIC',
          avatarUrl: p.avatar_url,
          isActive: p.is_active,
          isGranted: p.is_granted,
          phone: p.phone,
          bio: p.bio,
          location: p.location,
          department: p.department,
          joinedAt: p.created_at
        }));
        
        // Merge DB users with mock users, prioritizing DB users by email
        const merged: User[] = [...dbUsers];
        mockUsers.forEach(mu => {
          if (!merged.find(u => u.email === mu.email)) {
            merged.push({ ...mu, subscriptionTier: 'BASIC' });
          }
        });
        setAvailableUsers(merged);
      } else {
        setAvailableUsers(mockUsers.map(u => ({ ...u, subscriptionTier: 'BASIC' })));
      }
    } catch (err) {
      console.error("Error fetching all profiles:", err);
      setAvailableUsers(mockUsers.map(u => ({ ...u, subscriptionTier: 'BASIC' })));
    }
  };

  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await fetchProfile(session.user.id);
      if (profile) {
        setCurrentUser(profile);
      }
    }
    await fetchAllProfiles();
  }, []);

  const updateUserSubscription = async (userId: string, tier: SubscriptionTier) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ subscription_tier: tier })
        .eq('id', userId);
      
      if (error) throw error;
      
      if (currentUser?.id === userId) {
        setCurrentUser(prev => prev ? { ...prev, subscriptionTier: tier } : null);
      }
      await fetchAllProfiles();
    } catch (err) {
      console.error("Error updating subscription:", err);
      throw err;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && session.user) {
          const profile = await fetchProfile(session.user.id);
          if (profile) {
            if (mounted) setCurrentUser(profile);
          } else {
            // Check if it's our target user to auto-login for testing if no real profile exists
            const mockUser = mockUsers.find(u => u.email === session.user.email);
            if (mockUser && mounted) {
              setCurrentUser({ ...mockUser, id: session.user.id, subscriptionTier: 'BASIC' });
            }
          }
        }

        if (mounted) {
          await fetchAllProfiles();
        }

      } catch (error) {
        console.error("Failed to initialize Supabase session/profile", error);
        if (mounted) setError("Authentication initialization failed.");
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        let profile = await fetchProfile(session.user.id);
        
        if (!profile) {
          // Check mock users
          const mockUser = mockUsers.find(u => u.email === session.user.email);
          if (mockUser) {
            profile = { ...mockUser, id: session.user.id, subscriptionTier: 'BASIC' };
          } else {
            await new Promise(resolve => setTimeout(resolve, 1500));
            profile = await fetchProfile(session.user.id);
          }
        }

        if (profile && mounted) {
          setCurrentUser(profile);
          setError(null);
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          setCurrentUser(null);
          setError(null);
        }
      }
    });

    return () => { 
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = useCallback(async () => {
    // Immediate state update for fast UI response
    setCurrentUser(null);
    setError(null);
    
    try {
      // Background sign out
      await signOutUser();
    } catch (err) {
      console.error("Sign out error:", err);
      // Even if signout fails, we keep the user signed out locally for the best UX
    }
  }, []);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = currentUser?.role === 'ADMIN';
  const isBuildingOwner = currentUser?.role === 'BUILDING_OWNER';
  const isEmployee = currentUser?.role === 'EMPLOYEE';

  return (
    <UserContext.Provider value={{ 
      currentUser, 
      setCurrentUser, 
      availableUsers,
      isSuperAdmin,
      isAdmin,
      isBuildingOwner,
      isEmployee,
      isInitializing,
      error,
      signOut,
      refreshProfile,
      updateUserSubscription
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};