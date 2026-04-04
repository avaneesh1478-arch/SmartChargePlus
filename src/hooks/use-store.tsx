"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Station, Charger, Transaction } from '@/types';
import { MOCK_USERS, MOCK_STATIONS, MOCK_CHARGERS, MOCK_TRANSACTIONS } from '@/lib/mock-data';
import { translations, Language } from '@/lib/translations';
import { useAuth, useUser } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';

interface AppContextType {
  user: User | null;
  stations: Station[];
  chargers: Charger[];
  transactions: Transaction[];
  users: User[];
  language: Language;
  setLanguage: (lang: Language) => void;
  allTranslations: typeof translations;
  updateTranslations: (lang: Language, newContent: any) => void;
  t: any;
  login: (email: string) => void;
  signup: (email: string, fullName: string) => void;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  toggleCharger: (chargerId: string) => void;
  updateChargerStatus: (chargerId: string, status: Charger['status']) => void;
  addStation: (data: { name: string, email: string, address: string, chargingCost: number, lat: number, lng: number }) => void;
  removeStation: (stationId: string) => void;
  updateStation: (stationId: string, data: Partial<Station>) => void;
  addSlot: (stationId: string, count?: number) => void;
  removeSlot: (chargerId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [stations, setStations] = useState<Station[]>(MOCK_STATIONS);
  const [chargers, setChargers] = useState<Charger[]>(MOCK_CHARGERS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [language, setLanguageState] = useState<Language>('en');
  const [allTranslations, setAllTranslations] = useState<typeof translations>(translations);
  const [isLoaded, setIsLoaded] = useState(false);

  // Firebase Auth hooks
  const auth = useAuth();
  const { user: firebaseUser } = useUser();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedUser = localStorage.getItem('volta_user');
    const storedUsers = localStorage.getItem('volta_all_users');
    const storedStations = localStorage.getItem('volta_stations');
    const storedChargers = localStorage.getItem('volta_chargers');
    const storedLang = localStorage.getItem('volta_lang') as Language;
    const storedTranslations = localStorage.getItem('volta_translations');
    
    if (storedLang && ['en', 'kn', 'hi'].includes(storedLang)) {
      setLanguageState(storedLang);
    }

    if (storedTranslations) {
      try {
        setAllTranslations(JSON.parse(storedTranslations));
      } catch (e) {
        console.error("Failed to parse stored translations", e);
      }
    }

    if (storedUsers) {
      try {
        const parsedUsers = JSON.parse(storedUsers);
        if (Array.isArray(parsedUsers)) {
          const mergedUsers = [...MOCK_USERS];
          parsedUsers.forEach((u: User) => {
            if (!mergedUsers.find(mu => mu.uid === u.uid || mu.email === u.email)) {
              mergedUsers.push(u);
            }
          });
          setUsers(mergedUsers);
        }
      } catch (e) {
        console.error("Failed to parse stored users", e);
      }
    }

    if (storedStations) {
      try {
        const parsedStations = JSON.parse(storedStations);
        if (Array.isArray(parsedStations)) setStations(parsedStations);
      } catch (e) {
        console.error("Failed to parse stored stations", e);
      }
    }

    if (storedChargers) {
      try {
        const parsedChargers = JSON.parse(storedChargers);
        if (Array.isArray(parsedChargers)) setChargers(parsedChargers);
      } catch (e) {
        console.error("Failed to parse stored chargers", e);
      }
    }

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        console.error("Failed to parse stored user session", e);
      }
    }
    
    setIsLoaded(true);
  }, []);

  // Synchronize local user with Firebase Auth session
  useEffect(() => {
    if (isLoaded && user && !firebaseUser && auth) {
      // For MVP, bridge local login to Firebase using anonymous auth
      signInAnonymously(auth).catch(err => console.error("Firebase Sync Error:", err));
    }
  }, [user, firebaseUser, auth, isLoaded]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('volta_lang', lang);
  };

  const updateTranslations = (lang: Language, newContent: any) => {
    setAllTranslations(prev => ({
      ...prev,
      [lang]: newContent
    }));
  };

  const t = allTranslations[language];

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('volta_all_users', JSON.stringify(users));
  }, [users, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('volta_stations', JSON.stringify(stations));
  }, [stations, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('volta_chargers', JSON.stringify(chargers));
  }, [chargers, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('volta_translations', JSON.stringify(allTranslations));
  }, [allTranslations, isLoaded]);

  const login = (email: string) => {
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setUser(found);
      localStorage.setItem('volta_user', JSON.stringify(found));
    }
    return found;
  };

  const signup = (email: string, fullName: string) => {
    const newUser: User = {
      uid: `u-${Date.now()}`,
      email: email.toLowerCase(),
      fullName: fullName,
      role: 'USER',
      created_at: Date.now(),
      wallet_balance: 100.00,
    };
    
    setUsers(prev => {
      const exists = prev.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) return prev;
      return [...prev, newUser];
    });
    
    setUser(newUser);
    localStorage.setItem('volta_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('volta_user');
    if (auth) auth.signOut();
  };

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    setUsers(prev => prev.map(u => u.uid === user.uid ? updatedUser : u));
    localStorage.setItem('volta_user', JSON.stringify(updatedUser));
  };

  const toggleCharger = (chargerId: string) => {
    setChargers(prev => prev.map(c => {
      if (c.charger_id === chargerId) {
        const isCurrentlyAvailable = c.status === 'available';
        return {
          ...c,
          status: isCurrentlyAvailable ? 'occupied' : 'available' as const,
          current_usage: isCurrentlyAvailable ? (c.type === 'DCFC' ? 50 : 7) : 0
        };
      }
      return c;
    }));
  };

  const updateChargerStatus = (chargerId: string, status: Charger['status']) => {
    setChargers(prev => prev.map(c => c.charger_id === chargerId ? { ...c, status } : c));
  };

  const updateStation = (stationId: string, data: Partial<Station>) => {
    setStations(prev => prev.map(s => s.station_id === stationId ? { ...s, ...data } : s));
  };

  const addStation = (data: { name: string, email: string, address: string, chargingCost: number, lat: number, lng: number }) => {
    const newStationId = `st-${Date.now()}`;
    const opUid = `op-${newStationId}`;
    
    const newStation: Station = {
      station_id: newStationId,
      name: data.name,
      location: data.address,
      lat: data.lat,
      lng: data.lng,
      status: 'active',
      operator_id: opUid,
      total_power: 150,
      charger_count: 2,
    };

    const newOperator: User = {
      uid: opUid,
      email: data.email.toLowerCase(),
      role: 'OPERATOR',
      associated_station_id: newStationId,
      created_at: Date.now(),
    };

    const newChargers: Charger[] = [
      { 
        charger_id: `ch-${newStationId}-1`, 
        station_id: newStationId, 
        type: 'DCFC', 
        current_usage: 0, 
        status: 'available', 
        rate_per_kwh: data.chargingCost 
      },
      { 
        charger_id: `ch-${newStationId}-2`, 
        station_id: newStationId, 
        type: 'Level 2', 
        current_usage: 0, 
        status: 'available', 
        rate_per_kwh: data.chargingCost * 0.6 
      },
    ];

    setStations(prev => [...prev, newStation]);
    setUsers(prev => {
      const filtered = prev.filter(u => u.email.toLowerCase() !== data.email.toLowerCase());
      return [...filtered, newOperator];
    });
    setChargers(prev => [...prev, ...newChargers]);
  };

  const removeStation = (stationId: string) => {
    setStations(prev => prev.filter(s => s.station_id !== stationId));
    setChargers(prev => prev.filter(c => c.station_id !== stationId));
  };

  const addSlot = (stationId: string, count: number = 1) => {
    const newChargers: Charger[] = [];
    const timestamp = Date.now();
    
    for (let i = 0; i < count; i++) {
      const newSlotId = `ch-${stationId}-${timestamp}-${i}`;
      newChargers.push({
        charger_id: newSlotId,
        station_id: stationId,
        type: 'Level 2',
        current_usage: 0,
        status: 'available',
        rate_per_kwh: 0.35,
      });
    }

    setChargers(prev => [...prev, ...newChargers]);
    setStations(prev => prev.map(s => 
      s.station_id === stationId 
        ? { ...s, charger_count: s.charger_count + count } 
        : s
    ));
  };

  const removeSlot = (chargerId: string) => {
    const chargerToRemove = chargers.find(c => c.charger_id === chargerId);
    if (!chargerToRemove) return;

    setChargers(prev => prev.filter(c => c.charger_id !== chargerId));
    setStations(prev => prev.map(s => 
      s.station_id === chargerToRemove.station_id 
        ? { ...s, charger_count: Math.max(0, s.charger_count - 1) } 
        : s
    ));
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      stations, 
      chargers, 
      transactions, 
      users,
      language,
      setLanguage,
      allTranslations,
      updateTranslations,
      t,
      login, 
      signup,
      logout, 
      updateProfile,
      toggleCharger, 
      updateChargerStatus,
      updateStation,
      addStation,
      removeStation,
      addSlot,
      removeSlot
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}