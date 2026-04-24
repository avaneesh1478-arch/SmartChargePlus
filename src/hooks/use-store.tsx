
"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Station, Charger, Transaction, Booking, Review } from '@/types';
import { MOCK_USERS, MOCK_STATIONS, MOCK_CHARGERS, MOCK_TRANSACTIONS } from '@/lib/mock-data';
import { translations, Language } from '@/lib/translations';
import { useAuth } from '@/firebase';

interface AppContextType {
  user: User | null;
  stations: Station[];
  chargers: Charger[];
  transactions: Transaction[];
  users: User[];
  bookings: Booking[];
  reviews: Review[];
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  allTranslations: typeof translations;
  updateTranslations: (lang: Language, newContent: any) => void;
  t: any;
  login: (email: string) => void;
  signup: (email: string, fullName: string) => void;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
  toggleCharger: (chargerId: string) => void;
  updateChargerStatus: (chargerId: string, status: Charger['status']) => void;
  updateStationRate: (stationId: string, rate: number) => void;
  addStation: (data: { name: string, email: string, address: string, chargingCost: number, lat: number, lng: number }) => void;
  removeStation: (stationId: string) => void;
  updateStation: (stationId: string, data: Partial<Station>) => void;
  addSlot: (stationId: string, count?: number) => void;
  removeSlot: (chargerId: string) => void;
  addBooking: (booking: Booking) => void;
  updateBookingStatus: (bookingId: string, status: Booking['status']) => void;
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [stations, setStations] = useState<Station[]>(() => {
    return MOCK_STATIONS.map(s => ({ ...s, base_rate: s.base_rate || 0.45 }));
  });
  const [chargers, setChargers] = useState<Charger[]>(MOCK_CHARGERS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [language, setLanguageState] = useState<Language>('en');
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark');
  const [allTranslations, setAllTranslations] = useState<typeof translations>(translations);
  const [isLoaded, setIsLoaded] = useState(false);

  const auth = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedUser = localStorage.getItem('volta_user');
    const storedUsers = localStorage.getItem('volta_all_users');
    const storedStations = localStorage.getItem('volta_stations');
    const storedChargers = localStorage.getItem('volta_chargers');
    const storedBookings = localStorage.getItem('volta_bookings');
    const storedReviews = localStorage.getItem('volta_reviews');
    const storedLang = localStorage.getItem('volta_lang') as Language;
    const storedTheme = localStorage.getItem('volta_theme') as 'dark' | 'light';
    const storedTranslations = localStorage.getItem('volta_translations');
    
    if (storedLang && ['en', 'kn', 'hi'].includes(storedLang)) {
      setLanguageState(storedLang);
    }

    if (storedTheme && ['dark', 'light'].includes(storedTheme)) {
      setThemeState(storedTheme);
    }

    if (storedTranslations) {
      try {
        const parsed = JSON.parse(storedTranslations);
        const mergedTranslations = { ...translations };
        Object.keys(parsed).forEach((lang) => {
          const l = lang as Language;
          if (mergedTranslations[l]) {
            mergedTranslations[l] = {
              ...mergedTranslations[l],
              ...parsed[l],
              hero: {
                ...mergedTranslations[l].hero,
                // Fallback to default background if stored one is missing or stale
                backgroundImage: parsed[l]?.hero?.backgroundImage || translations[l].hero.backgroundImage,
                ...(parsed[l]?.hero || {}),
              },
              howItWorks: {
                ...mergedTranslations[l].howItWorks,
                ...(parsed[l]?.howItWorks || {}),
              }
            };
          }
        });
        setAllTranslations(mergedTranslations);
      } catch (e) {
        console.error("Failed to parse stored translations", e);
      }
    }

    if (storedBookings) {
      try {
        setBookings(JSON.parse(storedBookings));
      } catch (e) {
        console.error("Failed to parse stored bookings", e);
      }
    }

    if (storedReviews) {
      try {
        setReviews(JSON.parse(storedReviews));
      } catch (e) {
        console.error("Failed to parse stored reviews", e);
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

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('volta_theme', theme);
  }, [theme]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('volta_lang', lang);
    } catch (e) {
      console.warn("Could not save language preference", e);
    }
  };

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
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
    try {
      localStorage.setItem('volta_all_users', JSON.stringify(users));
      localStorage.setItem('volta_stations', JSON.stringify(stations));
      localStorage.setItem('volta_chargers', JSON.stringify(chargers));
      localStorage.setItem('volta_bookings', JSON.stringify(bookings));
      localStorage.setItem('volta_reviews', JSON.stringify(reviews));
      localStorage.setItem('volta_translations', JSON.stringify(allTranslations));
    } catch (e) {
      console.warn("Storage quota exceeded", e);
    }
  }, [users, stations, chargers, bookings, reviews, allTranslations, isLoaded]);

  const login = (email: string) => {
    const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (found) {
      setUser(found);
      try {
        localStorage.setItem('volta_user', JSON.stringify(found));
      } catch (e) {
        console.warn("Could not save user session", e);
      }
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
      wallet_balance: 0.00,
    };
    
    setUsers(prev => {
      const exists = prev.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) return prev;
      return [...prev, newUser];
    });
    
    setUser(newUser);
    try {
      localStorage.setItem('volta_user', JSON.stringify(newUser));
    } catch (e) {
      console.warn("Could not save user session", e);
    }
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
    try {
      localStorage.setItem('volta_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.warn("Could not update user session", e);
    }
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

  const updateStationRate = (stationId: string, rate: number) => {
    setStations(prev => prev.map(s => s.station_id === stationId ? { ...s, base_rate: rate } : s));
    setChargers(prev => prev.map(c => c.station_id === stationId ? { ...c, rate_per_kwh: rate } : c));
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
      base_rate: data.chargingCost
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
        rate_per_kwh: data.chargingCost
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
    const station = stations.find(s => s.station_id === stationId);
    const rate = station?.base_rate || 0.45;
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
        rate_per_kwh: rate,
      });
    }

    setChargers(prev => [...prev, ...newChargers]);
  };

  const removeSlot = (chargerId: string) => {
    setChargers(prev => prev.filter(c => c.charger_id !== chargerId));
  };

  const addBooking = (booking: Booking) => {
    const bookingAmount = booking.amount || 0;
    const currentUser = users.find(u => u.uid === booking.userId);
    
    if (currentUser) {
      const currentBalance = currentUser.wallet_balance || 0;
      if (currentBalance >= bookingAmount) {
        const updatedUser = { ...currentUser, wallet_balance: currentBalance - bookingAmount };
        setUsers(prev => prev.map(u => u.uid === currentUser.uid ? updatedUser : u));
        
        if (user && user.uid === currentUser.uid) {
           setUser(updatedUser);
        }

        setBookings(prev => [...prev, { ...booking, status: 'pending' }]);
      }
    }
  };

  const updateBookingStatus = (bookingId: string, status: Booking['status']) => {
    setBookings(prev => {
      const booking = prev.find(b => b.id === bookingId);
      
      if (booking && booking.status === 'pending' && status === 'rejected') {
        const targetUser = users.find(u => u.uid === booking.userId);
        if (targetUser) {
          const refundAmount = booking.amount || 0;
          const updatedUser = { ...targetUser, wallet_balance: (targetUser.wallet_balance || 0) + refundAmount };
          setUsers(allUsers => allUsers.map(u => u.uid === targetUser.uid ? updatedUser : u));
          if (user && user.uid === targetUser.uid) {
             setUser(updatedUser);
          }
        }
      }

      if (booking && status === 'confirmed' && booking.chargerId) {
        setChargers(allChargers => allChargers.map(c => 
          c.charger_id === booking.chargerId 
            ? { ...c, status: 'occupied' as const, current_usage: (c.type === 'DCFC' ? 50 : 7) } 
            : c
        ));
      }
      
      return prev.map(b => b.id === bookingId ? { ...b, status } : b);
    });
  };

  const addReview = (review: Omit<Review, 'id' | 'createdAt'>) => {
    const newReview: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      createdAt: Date.now()
    };
    setReviews(prev => [newReview, ...prev]);
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      stations, 
      chargers, 
      transactions, 
      users,
      bookings,
      reviews,
      language,
      setLanguage,
      theme,
      toggleTheme,
      allTranslations,
      updateTranslations,
      t,
      login, 
      signup,
      logout, 
      updateProfile,
      toggleCharger, 
      updateChargerStatus,
      updateStationRate,
      updateStation,
      addStation,
      removeStation,
      addSlot,
      removeSlot,
      addBooking,
      updateBookingStatus,
      addReview
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
