import { request } from './client';
import type { Booking } from './types';

export async function getBookings(): Promise<Booking[]> {
  return (await request<Booking[]>('/bookings')) || [];
}

export async function createBooking(booking: {
  table_id: string;
  party_size: number;
  is_shared: boolean;
  comfort_sharing?: boolean;
  start_time: string;
  end_time: string;
  user_email?: string;
  user_name?: string;
  user_phone?: string;
}): Promise<Booking> {
  const data = await request<any>('/bookings', {
    method: 'POST',
    body: JSON.stringify(booking)
  });
  return data.booking || data;
}

export async function checkInBooking(id: string): Promise<void> {
  return request<void>(`/bookings/${id}/check-in`, {
    method: 'PUT'
  });
}

export async function cancelBooking(id: string): Promise<void> {
  return request<void>(`/bookings/${id}/cancel`, {
    method: 'PUT'
  });
}

export async function updateMinEntryTime(id: string, minEntryTime: string): Promise<void> {
  return request<void>(`/bookings/${id}/min-entry-time`, {
    method: 'PUT',
    body: JSON.stringify({ min_entry_time: minEntryTime })
  });
}
