import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createInvoice } from '../invoices';
import { updateOrder, getOrderItems } from '../orders';
import { updateTable } from '../tables';
import type { Table, Order } from '../types';

export const useCheckoutMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (selectedTable: Table) => {
      if (!selectedTable || !selectedTable.id) return;
      
      const orders = queryClient.getQueryData<Order[]>(['orders']) || [];
      const activeOrder = orders.find(o => o.table_id === selectedTable.id && o.status !== 'served' && o.status !== 'cancelled');
      if (!activeOrder || !activeOrder.id) return;

      const items = await getOrderItems(activeOrder.id);
      const activeOrderTotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0;


      await createInvoice({
        order_id: activeOrder.id,
        payment_method: 'card',
        payment_status: 'paid',
        total_amount: activeOrderTotal
      });

      await updateOrder(activeOrder.id, {
        ...activeOrder,
        status: 'served'
      });

      await updateTable(selectedTable.id, {
        ...selectedTable,
        status: 'vacant'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    }
  });
};
