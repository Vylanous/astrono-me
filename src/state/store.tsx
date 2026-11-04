/**
 * ASTRONO-ME app state.
 *
 * Everything lives on the device: the birth profile, the saved-readings
 * archive, and (in preview builds) the simulated entitlement are stored
 * with AsyncStorage. There is no account and no server in v1.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BirthProfile, NatalChart, natalChart } from '../engine/ephemeris';
import { ACCESS_CODE_KEY, billing, Entitlement } from '../billing/subscription';

const PROFILE_KEY = 'astrocan.profile.v1';
const ARCHIVE_KEY = 'astrocan.archive.v1';
const PARTNER_KEY = 'astrocan.partner.v1';

export interface SavedReading {
  id: string;
  savedAt: string; // ISO
  kind: 'daily' | 'weekly' | 'compatibility';
  title: string;
  body: string;
}

export interface PartnerProfile {
  name: string;
  birthDate: string;
  birthTime: string | null;
  birthplace: string;
}

interface AppState {
  loading: boolean;
  profile: BirthProfile | null;
  chart: NatalChart | null;
  entitlement: Entitlement;
  archive: SavedReading[];
  partner: PartnerProfile | null;
  saveProfile(p: BirthProfile): Promise<void>;
  refreshEntitlement(): Promise<void>;
  saveReading(r: Omit<SavedReading, 'id' | 'savedAt'>): Promise<void>;
  removeReading(id: string): Promise<void>;
  setPartner(p: PartnerProfile | null): Promise<void>;
  exportData(): Promise<string>;
  deleteAllData(): Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<BirthProfile | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlement>({ active: false, source: 'preview' });
  const [archive, setArchive] = useState<SavedReading[]>([]);
  const [partner, setPartnerState] = useState<PartnerProfile | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, a, ent, partnerRaw] = await Promise.all([
          AsyncStorage.getItem(PROFILE_KEY),
          AsyncStorage.getItem(ARCHIVE_KEY),
          billing.getEntitlement(),
          AsyncStorage.getItem(PARTNER_KEY),
        ]);
        if (p) setProfile(JSON.parse(p) as BirthProfile);
        if (a) setArchive(JSON.parse(a) as SavedReading[]);
        if (partnerRaw) setPartnerState(JSON.parse(partnerRaw) as PartnerProfile);
        setEntitlement(ent);
      } catch {
        // Corrupt local state should never block the app; start clean.
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const chart = useMemo(() => (profile ? natalChart(profile) : null), [profile]);

  const saveProfile = useCallback(async (p: BirthProfile) => {
    setProfile(p);
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(p));
  }, []);

  const refreshEntitlement = useCallback(async () => {
    setEntitlement(await billing.getEntitlement());
  }, []);

  const saveReading = useCallback(async (r: Omit<SavedReading, 'id' | 'savedAt'>) => {
    const entry: SavedReading = {
      ...r,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      savedAt: new Date().toISOString(),
    };
    setArchive((prev) => {
      const next = [entry, ...prev].slice(0, 100);
      AsyncStorage.setItem(ARCHIVE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const removeReading = useCallback(async (id: string) => {
    setArchive((prev) => {
      const next = prev.filter((x) => x.id !== id);
      AsyncStorage.setItem(ARCHIVE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const setPartner = useCallback(async (p: PartnerProfile | null) => {
    setPartnerState(p);
    if (p) await AsyncStorage.setItem(PARTNER_KEY, JSON.stringify(p));
    else await AsyncStorage.removeItem(PARTNER_KEY);
  }, []);

  const exportData = useCallback(async (): Promise<string> => {
    const keys = [PROFILE_KEY, ARCHIVE_KEY, PARTNER_KEY];
    const out: Record<string, unknown> = { exportedAt: new Date().toISOString(), app: 'ASTRONO-ME' };
    for (const k of keys) {
      const raw = await AsyncStorage.getItem(k);
      out[k] = raw ? JSON.parse(raw) : null;
    }
    return JSON.stringify(out, null, 2);
  }, []);

  const deleteAllData = useCallback(async () => {
    await AsyncStorage.multiRemove([
      PROFILE_KEY,
      ARCHIVE_KEY,
      PARTNER_KEY,
      'astrocan.preview.entitlement.v1',
      ACCESS_CODE_KEY,
    ]);
    setProfile(null);
    setArchive([]);
    setPartnerState(null);
    setEntitlement({ active: false, source: 'preview' });
  }, []);

  const value: AppState = {
    loading,
    profile,
    chart,
    entitlement,
    archive,
    partner,
    saveProfile,
    refreshEntitlement,
    saveReading,
    removeReading,
    setPartner,
    exportData,
    deleteAllData,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
