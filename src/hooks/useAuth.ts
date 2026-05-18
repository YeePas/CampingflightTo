'use client';

import { useState, useEffect, useCallback } from 'react';
import { Session, Group } from '@/lib/types';
import {
  findGroupByCode,
  addMemberToGroup, fetchGroup,
  migrateLegacyDataIfNeeded,
} from '@/lib/firestore';

const STORAGE_KEY = 'campingflight_session';
const LEGACY_USER_KEY = 'campingflight_user'; // pre-v2

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [mounted, setMounted] = useState(false);
  const [migrating, setMigrating] = useState(false);

  // On mount: run legacy migration once, restore session from localStorage, and
  // auto-upgrade pre-v2 sessions ("joep"/"sanne") to a group-based session.
  useEffect(() => {
    (async () => {
      setMigrating(true);
      try {
        // Step 1: ensure legacy data is migrated to groups/default (no-op if already done)
        await migrateLegacyDataIfNeeded().catch(() => null);

        // Step 2: read whatever the device knows about its identity
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Session;
            if (parsed?.groupId && parsed?.memberName) {
              const g = await fetchGroup(parsed.groupId);
              if (g) {
                setSession(parsed);
                setGroup(g);
                return;
              }
              // Group was deleted server-side — clear stale session
              localStorage.removeItem(STORAGE_KEY);
            }
          } catch { /* fall through */ }
        }

        // Step 3: pre-v2 compatibility — upgrade old single-user session
        const legacy = localStorage.getItem(LEGACY_USER_KEY);
        if (legacy === 'joep' || legacy === 'sanne') {
          const name = legacy === 'joep' ? 'Joep' : 'Sanne';
          const upgraded: Session = { groupId: 'default', memberName: name };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(upgraded));
          localStorage.removeItem(LEGACY_USER_KEY);
          const g = await fetchGroup('default');
          if (g) {
            setSession(upgraded);
            setGroup(g);
          }
        }
      } finally {
        setMigrating(false);
        setMounted(true);
      }
    })();
  }, []);

  /** Join an existing group via its invite code. Returns true on success. */
  const joinGroup = useCallback(async (inviteCode: string, memberName: string): Promise<boolean> => {
    const g = await findGroupByCode(inviteCode);
    if (!g) return false;
    const name = memberName.trim() || 'Anoniem';
    await addMemberToGroup(g.id, name);
    const next: Session = { groupId: g.id, memberName: name };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
    setGroup({ ...g, members: [...new Set([...g.members, name])] });
    return true;
  }, []);

  /** Create a fresh group via the admin API. Requires the admin PIN. */
  const createGroup = useCallback(async (
    groupName: string,
    memberName: string,
    adminPin: string,
  ): Promise<Group> => {
    const name = memberName.trim() || 'Anoniem';
    const res = await fetch('/api/admin/create-group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPin, groupName, memberName: name }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `Aanvraag mislukt (${res.status})`);
    }
    const data = await res.json() as { group: Group };
    const g = data.group;
    const next: Session = { groupId: g.id, memberName: name };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
    setGroup(g);
    return g;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setGroup(null);
  }, []);

  return { session, group, joinGroup, createGroup, logout, mounted, migrating };
}
