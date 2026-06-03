import {
  request,
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  getCurrentUser,
  setCurrentUser,
  type User
} from './client';

export {
  setAuthToken,
  getAuthToken,
  removeAuthToken,
  getCurrentUser,
  setCurrentUser,
  type User
};

// Interfaces based on Swagger spec
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

// API Service exports
export const api = {
  // Authentication
  async login(credentials: { email: string; password?: string }): Promise<{ token: string; user: any }> {
    const data = await request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    setAuthToken(data.token);
    const roleMap: Record<string, 'admin' | 'staff' | 'user'> = { ADMIN: 'admin', STAFF: 'staff', USER: 'user' };
    const userObj: User = {
      first_name: data.user?.first_name || 'Guest',
      last_name: data.user?.last_name || '',
      email: data.user?.email || data.email,
      phone: data.user?.phone,
      role: roleMap[data.user?.user_type] || 'user'
    };
    setCurrentUser(userObj);
    return { token: data.token, user: userObj };
  },

  async signup(user: { first_name: string; last_name: string; email: string; password?: string; phone: string; user_type: string }): Promise<{ token: string; user: any }> {
    const data = await request<any>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(user)
    });
    setAuthToken(data.token);
    const roleMap: Record<string, 'admin' | 'staff' | 'user'> = { ADMIN: 'admin', STAFF: 'staff', USER: 'user' };
    const userObj: User = {
      first_name: data.user?.first_name,
      last_name: data.user?.last_name,
      email: data.user?.email,
      phone: data.user?.phone,
      role: roleMap[data.user?.user_type] || 'user'
    };
    setCurrentUser(userObj);
    return { token: data.token, user: userObj };
  },

  async getCurrentUser(): Promise<any> {
    return request<any>('/auth/user');
  },

  // Menus
  async getMenus(): Promise<Menu[]> {
    return (await request<Menu[]>('/menus')) || [];
  },

  async createMenu(menu: Menu): Promise<Menu> {
    return request<Menu>('/menus', {
      method: 'POST',
      body: JSON.stringify(menu)
    });
  },

  async deleteMenu(id: string): Promise<void> {
    return request<void>(`/menus/${id}`, {
      method: 'DELETE'
    });
  },

  // Foods
  async getFoods(): Promise<Food[]> {
    const rawFoods = (await request<any[]>('/foods')) || [];
    return rawFoods.map((f: any) => ({
      id: f.id,
      name: f.name,
      price: f.price,
      image: f.food_image || f.image,
      menu_id: f.menu_id,
      description: f.description
    }));
  },

  async createFood(formData: FormData): Promise<Food> {
    const f = await request<any>('/foods', {
      method: 'POST',
      body: formData
    });
    return {
      id: f.id || f.food?.id,
      name: f.food?.name || f.name,
      price: f.food?.price || f.price,
      image: f.food?.food_image || f.food_image || f.image,
      menu_id: f.food?.menu_id || f.menu_id,
      description: f.food?.description || f.description
    };
  },

  async updateFood(id: string, formData: FormData): Promise<void> {
    return request<void>(`/foods/${id}`, {
      method: 'PUT',
      body: formData
    });
  },

  async deleteFood(id: string): Promise<void> {
    return request<void>(`/foods/${id}`, {
      method: 'DELETE'
    });
  },

  // Tables
  async getTables(startTime?: string, endTime?: string): Promise<Table[]> {
    const query = startTime && endTime ? `?start_time=${encodeURIComponent(startTime)}&end_time=${encodeURIComponent(endTime)}` : '';
    const rawTables = (await request<any[]>(`/tables${query}`)) || [];
    return rawTables.map((t: any) => ({
      id: t.id,
      table_number: t.table_number,
      capacity: t.capacity || t.number_of_guests || 2,
      number_of_guests: t.number_of_guests || t.capacity || 2,
      seats_reserved: t.seats_reserved || 0,
      status: t.status || (t.is_available ? 'vacant' : 'occupied')
    }));
  },

  async createTable(table: Table): Promise<Table> {
    const payload = {
      table_number: table.table_number,
      capacity: table.number_of_guests,
      number_of_guests: table.number_of_guests,
      status: table.status,
      is_available: table.status === 'vacant'
    };
    const t = await request<any>('/tables', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return {
      id: t.id || t.table?.id,
      table_number: t.table?.table_number || t.table_number,
      number_of_guests: t.table?.number_of_guests || t.table?.capacity || t.number_of_guests || t.capacity || 2,
      status: t.table?.status || t.status || (t.table?.is_available || t.is_available ? 'vacant' : 'occupied')
    };
  },

  async updateTable(id: string, table: Table): Promise<void> {
    const payload = {
      table_number: table.table_number,
      capacity: table.number_of_guests,
      number_of_guests: table.number_of_guests,
      status: table.status,
      is_available: table.status === 'vacant'
    };
    return request<void>(`/tables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },

  // Orders & Order Items
  async getOrders(): Promise<Order[]> {
    const orders = (await request<Order[]>('/orders')) || [];
    for (const order of orders) {
      if (order.id) {
        order.items = await this.getOrderItems(order.id);
      }
    }
    return orders;
  },

  async createOrder(order: Order, items: OrderItem[]): Promise<Order> {
    const createdOrder = await request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify({
        table_id: order.table_id,
        status: order.status || 'pending'
      })
    });

    const createdItems: OrderItem[] = [];
    for (const item of items) {
      if (createdOrder.id) {
        const createdItem = await request<OrderItem>('/order-items', {
          method: 'POST',
          body: JSON.stringify({
            order_id: createdOrder.id,
            food_id: item.food_id,
            quantity: item.quantity,
            unit_price: item.unit_price
          })
        });
        createdItems.push(createdItem);
      }
    }

    createdOrder.items = createdItems;
    return createdOrder;
  },

  async updateOrder(id: string, order: Order): Promise<void> {
    return request<void>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        table_id: order.table_id,
        status: order.status
      })
    });
  },

  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return (await request<OrderItem[]>(`/order-items?order_id=${orderId}`)) || [];
  },

  // Invoices
  async getInvoices(): Promise<Invoice[]> {
    return (await request<Invoice[]>('/invoices')) || [];
  },

  async createInvoice(invoice: Invoice): Promise<Invoice> {
    return request<Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoice)
    });
  },

  // Bookings
  async getBookings(): Promise<Booking[]> {
    return (await request<Booking[]>('/bookings')) || [];
  },

  async createBooking(booking: {
    table_id: string;
    party_size: number;
    is_shared: boolean;
    comfort_sharing: boolean;
    start_time: string;
    end_time: string;
    user_email?: string;
    user_name?: string;
  }): Promise<Booking> {
    const data = await request<any>('/bookings', {
      method: 'POST',
      body: JSON.stringify(booking)
    });
    return data.booking || data;
  },

  async checkInBooking(id: string): Promise<void> {
    return request<void>(`/bookings/${id}/check-in`, {
      method: 'PUT'
    });
  },

  async cancelBooking(id: string): Promise<void> {
    return request<void>(`/bookings/${id}/cancel`, {
      method: 'PUT'
    });
  },

  async updateMinEntryTime(id: string, minEntryTime: string): Promise<void> {
    return request<void>(`/bookings/${id}/min-entry-time`, {
      method: 'PUT',
      body: JSON.stringify({ min_entry_time: minEntryTime })
    });
  },

  async createOrderItem(item: { order_id: string; food_id: string; quantity: number; unit_price: number }): Promise<OrderItem> {
    return request<OrderItem>('/order-items', {
      method: 'POST',
      body: JSON.stringify(item)
    });
  }
};
