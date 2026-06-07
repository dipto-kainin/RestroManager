import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createRazorpayOrder, verifyRazorpayPayment, confirmCashPayment } from '../index';
import { loadRazorpayScript } from '../../utils/razorpay';
import type { Table, Order } from '../types';

export const useCheckoutMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (selectedTable: Table) => {
      if (!selectedTable || !selectedTable.id) return;
      
      const orders = queryClient.getQueryData<Order[]>(['orders']) || [];
      const activeOrder = orders.find(o => o.table_id === selectedTable.id && o.status !== 'completed' && o.status !== 'cancelled');
      if (!activeOrder || !activeOrder.id) return;

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        throw new Error("Failed to load Razorpay payment gateway script");
      }

      const rpOrder = await createRazorpayOrder(activeOrder.id);

      return new Promise<void>((resolve, reject) => {
        const options = {
          key: rpOrder.key,
          amount: rpOrder.amount,
          currency: rpOrder.currency,
          name: "Citrus Sunlit Bistro",
          description: `Checkout Table T-${selectedTable.table_number}`,
          order_id: rpOrder.id,
          handler: async (response: any) => {
            try {
              await verifyRazorpayPayment({
                order_id: activeOrder.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              });
              resolve();
            } catch (err: any) {
              reject(new Error(err.message || "Payment verification failed"));
            }
          },
          prefill: {
            name: "Staff Terminal",
            email: "staff@bistro.com",
            contact: "",
          },
          theme: {
            color: "#E28B00",
          },
          modal: {
            ondismiss: () => {
              reject(new Error("Payment window closed"));
            }
          }
        };

        const rz = new window.Razorpay(options);
        rz.open();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    }
  });
};

export const useConfirmCashPaymentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      await confirmCashPayment(orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    }
  });
};
