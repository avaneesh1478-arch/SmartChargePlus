export type UserRole = 'ADMIN' | 'OPERATOR' | 'USER';

export interface User {
  uid: string;
  email: string;
  fullName?: string;
  address?: string;
  contactNumber?: string;
  profileImage?: string;
  role: UserRole;
  associated_station_id?: string;
  created_at: number;
  wallet_balance?: number;
}

export interface Station {
  station_id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  status: 'active' | 'offline';
  operator_id: string;
  total_power: number;
  charger_count: number;
}

export interface Charger {
  charger_id: string;
  station_id: string;
  type: 'Level 2' | 'DCFC';
  current_usage: number; // in kW
  status: 'available' | 'occupied' | 'offline';
  rate_per_kwh: number;
}

export interface Transaction {
  transaction_id: string;
  user_id: string;
  station_id: string;
  station_name: string;
  duration: number; // in minutes
  cost: number;
  energy_delivered: number; // in kWh
  timestamp: number;
}
