// Shared type interfaces based on Swagger spec

export interface User {
  id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: 'admin' | 'staff' | 'user';
}

export interface Menu {
  id?: string;
  name: string;
  category: string;
  start_date?: string;
  end_date?: string;
}

export interface Food {
  id?: string;
  name: string;
  price: number;
  image?: string;
  menu_id: string;
  description?: string;
}

export interface Table {
  id?: string;
  table_number: number;
  capacity: number;
  number_of_guests: number;
  seats_reserved: number;
  status: 'vacant' | 'occupied' | 'reserved';
}

export interface Booking {
  id?: string;
  table_id: string;
  user_email: string;
  user_name: string;
  user_phone?: string;
  party_size: number;
  is_shared: boolean;
  comfort_sharing: boolean;
  status: 'pending' | 'checked_in' | 'cancelled' | 'completed';
  start_time: string;
  end_time: string;
  min_entry_time?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id?: string;
  order_id: string;
  food_id: string;
  quantity: number;
  unit_price: number;
}

export interface Order {
  id?: string;
  order_date: string;
  table_id: string;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
  items?: OrderItem[];
}

export interface Invoice {
  id?: string;
  order_id: string;
  payment_method: 'cash' | 'card' | 'upi';
  payment_status: 'pending' | 'paid';
  payment_due_date?: string;
  table_number?: number;
  total_amount: number;
}
