import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  username: string;
  full_name: string;
  email: string;
  phone?: string;
  bio?: string;
  city?: string;
  state?: string;
  photo_url?: string;
  id_front_url?: string;
  id_back_url?: string;
  id_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  seller_id: string;
  lot_number: number;
  title: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  vin?: string;
  mileage: number;
  transmission: string;
  condition: string;
  description: string;
  reserve_price?: number;
  starting_bid: number;
  current_bid: number;
  buy_now_price?: number;
  auction_end: string;
  location_city: string;
  location_state: string;
  status: string;
  created_at: string;
  seller?: Profile;
  photos?: Photo[];
}

export interface Bid {
  id: string;
  listing_id: string;
  bidder_id: string;
  amount: number;
  created_at: string;
  bidder?: Profile;
}

export interface Photo {
  id: string;
  listing_id: string;
  url: string;
  position: number;
  created_at: string;
}

export interface SearchAlert {
  id: string;
  user_id: string;
  name: string;
  filters: Record<string, unknown>;
  email_notifications: boolean;
  created_at: string;
}
