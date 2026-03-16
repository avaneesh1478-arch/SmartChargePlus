"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Station, Charger, Transaction } from '@/types';
import { MOCK_USERS, MOCK_STATIONS, MOCK_CHARGERS, MOCK_TRANSACTIONS } from '@/lib/mock-data';

interface AppContextType {
  user: User | null;
  stations: Station[];
  chargers: Charger[];
  transactions: Transaction[];
  users: User[];
  login: (email: string) => void;
  signup: (email: string, fullName: string) => void;
  logout: () => void;
  toggleCharger: (chargerId: string) => void;
  updateChargerStatus: (chargerId: string, status: Charger['status']) => void;
  addStation: (data: { name: string, email: string, address: string, chargingCost: number, lat: number, lng: number }) => void;
  removeStation: (stationId: string) => void;
  addSlot: (stationId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [stations, setStations] = useState<Station[]>(MOCK_STATIONS);
  const [chargers, setChargers] = useState<Charger[]>(MOCK_CHARGERS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Persistence simulation
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedUser = localStorage.getItem('volta_user');
    const storedUsers = localStorage.getItem('volta_all_users');
    const storedStations = localStorage.getItem('volta_stations');
    const storedChargers = localStorage.getItem('volta_chargers');
    
    if (storedUsers) {
      try {
        setUsers(JSON.parse(storedUsers));
      } catch (e) {
        console.error("Failed to parse stored users", e);
      }
    }

    if (storedStations) {
      try {
        setStations(JSON.parse(storedStations));
      } catch (e) {
        console.error("Failed to parse stored stations", e);
      }
    }

    if (storedChargers) {
      try {
        setChargers(JSON.parse(storedChargers));
      } catch (e) {
        console.error("Failed to parse stored chargers", e);
      }
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user session", e);
      }
    }
    
    setIsLoaded(true);
  }, []);

  // Save state to localStorage whenever it changes, but only after initial load
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

  const addStation = (data: { name: string, email: string, address: string, chargingCost: number, lat: number, lng: number }) => {
    const newStationId = `st-${Date.now()}`;
    
    const newStation: Station = {
      station_id: newStationId,
      name: data.name,
      location: data.address,
      lat: data.lat,
      lng: data.lng,
      status: 'active',
      operator_id: `op-${newStationId}`,
      total_power: 150,
      charger_count: 2,
    };

    const newOperator: User = {
      uid: `op-${newStationId}`,
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
    setUsers(prev => [...prev, newOperator]);
    setChargers(prev => [...prev, ...newChargers]);
  };

  const removeStation = (stationId: string) => {
    setStations(prev => prev.filter(s => s.station_id !== stationId));
    setChargers(prev => prev.filter(c => c.station_id !== stationId));
  };

  const addSlot = (stationId: string) => {
    const newSlotId = `ch-${stationId}-${Date.now()}`;
    
    const newCharger: Charger = {
      charger_id: newSlotId,
      station_id: stationId,
      type: 'Level 2',
      current_usage: 0,
      status: 'available',
      rate_per_kwh: 0.35, 
    };

    setChargers(prev => [...prev, newCharger]);
    setStations(prev => prev.map(s => 
      s.station_id === stationId 
        ? { ...s, charger_count: s.charger_count + 1 } 
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
      login, 
      signup,
      logout, 
      toggleCharger, 
      updateChargerStatus,
      addStation,
      removeStation,
      addSlot
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
