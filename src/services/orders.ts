import { request } from './client';
import type { Order, OrderItem } from './types';

export async function getOrders(): Promise<Order[]> {
  return (await request<Order[]>('/orders')) || [];
}

export async function getOrdersWithActiveItems(): Promise<Order[]> {
  const orders = (await request<Order[]>('/orders')) || [];
  for (const order of orders) {
    if (order.id && order.status !== 'served' && order.status !== 'cancelled') {
      order.items = await getOrderItems(order.id);
    } else {
      order.items = [];
    }
  }
  return orders;
}


export async function createOrder(order: Order, items: OrderItem[]): Promise<Order> {
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
}

export async function updateOrder(id: string, order: Order): Promise<void> {
  return request<void>(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      table_id: order.table_id,
      status: order.status
    })
  });
}

export async function getOrderItems(orderId: string): Promise<OrderItem[]> {
  return (await request<OrderItem[]>(`/order-items?order_id=${orderId}`)) || [];
}

export async function createOrderItem(item: { order_id: string; food_id: string; quantity: number; unit_price: number }): Promise<OrderItem> {
  return request<OrderItem>('/order-items', {
    method: 'POST',
    body: JSON.stringify(item)
  });
}
