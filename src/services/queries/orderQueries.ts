import { useQuery } from '@tanstack/react-query';
import { getOrders, getOrdersWithActiveItems, getOrderItems } from '../orders';

export const useOrdersQuery = (refetchInterval?: number) => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => getOrders(),
    refetchInterval
  });
};

export const useOrdersWithActiveItemsQuery = (refetchInterval?: number) => {
  return useQuery({
    queryKey: ['orders-with-active-items'],
    queryFn: () => getOrdersWithActiveItems(),
    refetchInterval
  });
};

export const useOrderItemsQuery = (orderId: string) => {
  return useQuery({
    queryKey: ['order-items', orderId],
    queryFn: () => getOrderItems(orderId),
    enabled: !!orderId
  });
};

