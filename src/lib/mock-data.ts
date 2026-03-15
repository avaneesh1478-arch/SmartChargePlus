import { User, Station, Charger, Transaction } from '@/types';

export const MOCK_USERS: User[] = [
  {
    uid: 'admin-1',
    email: 'admin@gmail.com',
    role: 'ADMIN',
    created_at: Date.now(),
  },
  {
    uid: 'operator-1',
    email: 'operator@gmail.com',
    role: 'OPERATOR',
    associated_station_id: 'st-1',
    created_at: Date.now(),
  },
  {
    uid: 'user-1',
    email: 'user@gmail.com',
    role: 'USER',
    created_at: Date.now(),
    wallet_balance: 150.00,
  },
];

export const MOCK_STATIONS: Station[] = [
  {
    station_id: 'st-1',
    name: 'Downtown Hub',
    location: '123 Main St, Tech City',
    lat: 40.7128,
    lng: -74.0060,
    status: 'active',
    operator_id: 'operator-1',
    total_power: 350,
    charger_count: 4,
  },
  {
    station_id: 'st-2',
    name: 'Harbor Gateway',
    location: '456 Shoreline Dr, Tech City',
    lat: 40.7589,
    lng: -73.9851,
    status: 'active',
    operator_id: 'admin-1',
    total_power: 150,
    charger_count: 2,
  },
  {
    station_id: 'st-3',
    name: 'Airport QuickCharge',
    location: 'Terminal 4, Tech City Intl',
    lat: 40.6413,
    lng: -73.7781,
    status: 'offline',
    operator_id: 'admin-1',
    total_power: 500,
    charger_count: 8,
  },
];

export const MOCK_CHARGERS: Charger[] = [
  { charger_id: 'ch-1', station_id: 'st-1', type: 'DCFC', current_usage: 50, status: 'occupied', rate_per_kwh: 0.45 },
  { charger_id: 'ch-2', station_id: 'st-1', type: 'DCFC', current_usage: 0, status: 'available', rate_per_kwh: 0.45 },
  { charger_id: 'ch-3', station_id: 'st-1', type: 'Level 2', current_usage: 0, status: 'available', rate_per_kwh: 0.25 },
  { charger_id: 'ch-4', station_id: 'st-1', type: 'Level 2', current_usage: 7, status: 'occupied', rate_per_kwh: 0.25 },
  { charger_id: 'ch-5', station_id: 'st-2', type: 'DCFC', current_usage: 120, status: 'occupied', rate_per_kwh: 0.55 },
  { charger_id: 'ch-6', station_id: 'st-2', type: 'Level 2', current_usage: 0, status: 'available', rate_per_kwh: 0.30 },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    transaction_id: 'tx-1',
    user_id: 'user-1',
    station_id: 'st-1',
    station_name: 'Downtown Hub',
    duration: 45,
    cost: 22.50,
    energy_delivered: 50,
    timestamp: Date.now() - 86400000,
  },
  {
    transaction_id: 'tx-2',
    user_id: 'user-1',
    station_id: 'st-2',
    station_name: 'Harbor Gateway',
    duration: 120,
    cost: 15.00,
    energy_delivered: 30,
    timestamp: Date.now() - 172800000,
  },
];