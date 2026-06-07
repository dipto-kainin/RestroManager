import { useQuery } from '@tanstack/react-query';
import { getInvoices } from '../invoices';

export const useInvoicesQuery = (refetchInterval?: number) => {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: () => getInvoices(),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    refetchInterval
  });
};
