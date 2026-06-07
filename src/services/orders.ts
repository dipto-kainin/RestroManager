import { request } from './client';
import type { Order, OrderItem } from './types';

export async function getOrders(): Promise<Order[]> {
  const orders = (await request<Order[]>('/orders')) || [];
  return orders.map(order => {
    if (order.food_items) {
      order.items = order.food_items.map(fi => ({
        id: fi.id,
        order_id: order.id || '',
        food_id: fi.id,
        quantity: fi.amount,
        unit_price: fi.unit_price
      }));
    } else {
      order.items = [];
    }
    return order;
  });
}

export async function getOrdersWithActiveItems(): Promise<Order[]> {
  return getOrders();
}

export async function createOrder(order: Order, items: OrderItem[] = []): Promise<Order> {
  const foodItems = order.food_items || items.map(item => ({
    id: item.food_id,
    amount: item.quantity,
    unit_price: item.unit_price
  }));

  const createdOrder = await request<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify({
      table_id: order.table_id,
      status: order.status || 'pending',
      food_items: foodItems
    })
  });

  if (createdOrder.food_items) {
    createdOrder.items = createdOrder.food_items.map(fi => ({
      id: fi.id,
      order_id: createdOrder.id || '',
      food_id: fi.id,
      quantity: fi.amount,
      unit_price: fi.unit_price
    }));
  } else {
    createdOrder.items = [];
  }
  return createdOrder;
}

export async function updateOrder(id: string, order: Order): Promise<void> {
  const foodItems = order.food_items || order.items?.map(item => ({
    id: item.food_id,
    amount: item.quantity,
    unit_price: item.unit_price
  }));

  return request<void>(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      table_id: order.table_id,
      status: order.status,
      food_items: foodItems
    })
  });
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  if (!orderId) return [];
  try {
    const order = await request<Order>(`/orders/${orderId}`);
    if (order && order.food_items) {
      return order.food_items.map(fi => ({
        id: fi.id,
        order_id: order.id || '',
        food_id: fi.id,
        quantity: fi.amount,
        unit_price: fi.unit_price
      }));
    }
  } catch (err) {
    console.error('Error fetching order items:', err);
  }
  return [];
}

/** @deprecated */
export async function createOrderItem(item: { order_id: string; food_id: string; quantity: number; unit_price: number }): Promise<OrderItem> {
  return request<OrderItem>('/order-items', {
    method: 'POST',
    body: JSON.stringify(item)
  });
}
