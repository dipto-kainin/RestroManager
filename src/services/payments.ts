import { request } from './client';

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  key: string;
}

export interface VerificationPayload {
  order_id: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export async function createRazorpayOrder(orderId: string): Promise<RazorpayOrder> {
  return request<RazorpayOrder>('/payments/create-order', {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId })
  });
}

export async function verifyRazorpayPayment(payload: VerificationPayload): Promise<{ message: string }> {
  return request<{ message: string }>('/payments/verify', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function requestCashPayment(orderId: string): Promise<void> {
  return request<void>('/payments/request-cash', {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId })
  });
}

export async function confirmCashPayment(orderId: string): Promise<void> {
  return request<void>('/payments/confirm-cash', {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId })
  });
}
