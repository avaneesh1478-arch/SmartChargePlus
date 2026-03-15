"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Station, Charger, Transaction } from '@/types';
import { MOCK_USERS, MOCK_STATIONS, MOCK_CHARGERS, MOCK_TRANSACTIONS } from '@/lib/mock-data';

interface AppContextType {
  user: User | null;
  stations: Station[];
  chargers: Charger[];
  transactions: Transaction[];
  login: (email: string) => void;
  logout: () => void;
  toggleCharger: (chargerId: string) => void;
  updateChargerStatus: (chargerId: string, status: Charger['status']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [stations] = useState<Station[]>(MOCK_STATIONS);
  const [chargers, setChargers] = useState<Charger[]>(MOCK_CHARGERS);
  const [transactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);

  // Persistence simulation
  useEffect(() => {
    const storedUser = localStorage.getItem('volta_user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const login = (email: string) => {
    const found = MOCK_USERS.find(u => u.email === email);
    if (found) {
      setUser(found);
      localStorage.setItem('volta_user', JSON.stringify(found));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('volta_user');
  };

  const toggleCharger = (chargerId: string) => {
    setChargers(prev => prev.map(c => {
      if (c.charger_id === chargerId) {
        return {
          ...c,
          status: c.status === 'available' ? 'occupied' : 'available',
          current_usage: c.status === 'available' ? (c.type === 'DCFC' ? 50 : 7) : 0
        };
      }
      return c;
    }));
  };

  const updateChargerStatus = (chargerId: string, status: Charger['status']) => {
    setChargers(prev => prev.map(c => c.charger_id === chargerId ? { ...c, status } : c));
  };

  return (
    <AppContext.Provider value={{ user, stations, chargers, transactions, login, logout, toggleCharger, updateChargerStatus }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}