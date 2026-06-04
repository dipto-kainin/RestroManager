import { request } from './client';
import type { Invoice } from './types';

export async function getInvoices(): Promise<Invoice[]> {
  return (await request<Invoice[]>('/invoices')) || [];
}

export async function createInvoice(invoice: Invoice): Promise<Invoice> {
  return request<Invoice>('/invoices', {
    method: 'POST',
    body: JSON.stringify(invoice)
  });
}
