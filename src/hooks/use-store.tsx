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
  logout: () => void;
  toggleCharger: (chargerId: string) => void;
  updateChargerStatus: (chargerId: string, status: Charger['status']) => void;
  addStation: (data: { name: string, email: string, address: string, chargingCost: number }) => void;
  removeStation: (stationId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [stations, setStations] = useState<Station[]>(MOCK_STATIONS);
  const [chargers, setChargers] = useState<Charger[]>(MOCK_CHARGERS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);

  // Persistence simulation
  useEffect(() => {
    const storedUser = localStorage.getItem('volta_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse stored user session", e);
      }
    }
  }, []);

  const login = (email: string) => {
    const found = users.find(u => u.email === email);
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

  const addStation = (data: { name: string, email: string, address: string, chargingCost: number }) => {
    const newStationId = `st-${Date.now()}`;
    
    const newStation: Station = {
      station_id: newStationId,
      name: data.name,
      location: data.address,
      lat: 40.7128 + (Math.random() * 0.1),
      lng: -74.0060 + (Math.random() * 0.1),
      status: 'active',
      operator_id: `op-${newStationId}`,
      total_power: 150,
      charger_count: 2,
    };

    const newOperator: User = {
      uid: `op-${newStationId}`,
      email: data.email,
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
    // Note: In a real app we'd also disable the associated operator user
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      stations, 
      chargers, 
      transactions, 
      users,
      login, 
      logout, 
      toggleCharger, 
      updateChargerStatus,
      addStation,
      removeStation
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