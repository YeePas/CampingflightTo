'use client';

import { useState, useEffect } from 'react';

export type User = 'joep' | 'sanne';

const STORAGE_KEY = 'campingflight_user';

const PINS: Record<User, string> = {
  joep: process.env.NEXT_PUBLIC_PIN_JOEP ?? '',
  sanne: process.env.NEXT_PUBLIC_PIN_SANNE ?? '',
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as User | null;
    if (stored === 'joep' || stored === 'sanne') setUser(stored);
    setMounted(true);
  }, []);

  const login = (who: User, pin: string): boolean => {
    if (pin !== PINS[who]) return false;
    localStorage.setItem(STORAGE_KEY, who);
    setUser(who);
    return true;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return { user, login, logout, mounted };
}
