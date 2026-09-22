'use client';

import { createContext, useContext, useState } from 'react';
import { Profile } from '@/types';

type ProfileCtx = {
  profile: Profile;
  updateProfile: (update: Partial<Profile>) => void;
};

const ProfileContext = createContext<ProfileCtx | null>(null);

export function ProfileProvider({
  initial,
  children,
}: {
  initial: Profile;
  children: React.ReactNode;
}) {
  const [profile, setProfile] = useState<Profile>(initial);

  function updateProfile(update: Partial<Profile>) {
    setProfile(prev => ({ ...prev, ...update }));
  }

  return (
    <ProfileContext.Provider value={{ profile, updateProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): ProfileCtx {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
