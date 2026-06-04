import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createOrder, createOrderItem, updateOrder } from '../orders';
import { updateTable } from '../tables';
import type { Table, Order, Food } from '../types';

export const usePlaceOrderMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tableId, cartItems }: { tableId: string; cartItems: { food: Food; quantity: number }[] }) => {
      const orders = queryClient.getQueryData<Order[]>(['orders']) || [];
      const tables = queryClient.getQueryData<Table[]>(['tables']) || [];
      
      const activeOrder = orders.find(o => o.table_id === tableId && o.status !== 'served' && o.status !== 'cancelled');
      let orderId = '';
      
      if (activeOrder && activeOrder.id) {
        orderId = activeOrder.id;
      } else {
        const orderPayload: Order = {
          table_id: tableId,
          order_date: new Date().toISOString(),
          status: 'pending'
        };
        const createdOrder = await createOrder(orderPayload, []);
        orderId = createdOrder.id || '';
      }

      if (!orderId) {
        throw new Error('Failed to identify or create active order.');
      }

      for (const item of cartItems) {
        await createOrderItem({
          order_id: orderId,
          food_id: item.food.id || '',
          quantity: item.quantity,
          unit_price: item.food.price
        });
      }

      const table = tables.find(t => t.id === tableId);
      if (table && table.id) {
        await updateTable(table.id, {
          ...table,
          status: 'occupied'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    }
  });
};

export const useUpdateOrderStatusMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ order, newStatus }: { order: Order; newStatus: Order['status'] }) => {
      if (!order.id) return;
      await updateOrder(order.id, {
        ...order,
        status: newStatus
      });
      
      if (newStatus === 'served' || newStatus === 'cancelled') {
        const tables = queryClient.getQueryData<Table[]>(['tables']) || [];
        const table = tables.find(t => t.id === order.table_id);
        if (table && table.id) {
          await updateTable(table.id, {
            ...table,
            status: 'vacant'
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    }
  });
};
