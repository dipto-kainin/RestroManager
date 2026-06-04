import { request } from './client';
import type { Table } from './types';

export async function getTables(startTime?: string, endTime?: string): Promise<Table[]> {
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
}

export async function createTable(table: Table): Promise<Table> {
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
    capacity: t.table?.capacity || t.capacity || 2,
    number_of_guests: t.table?.number_of_guests || t.table?.capacity || t.number_of_guests || t.capacity || 2,
    seats_reserved: t.table?.seats_reserved || t.seats_reserved || 0,
    status: t.table?.status || t.status || (t.table?.is_available || t.is_available ? 'vacant' : 'occupied')
  };
}

export async function updateTable(id: string, table: Table): Promise<void> {
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
}
