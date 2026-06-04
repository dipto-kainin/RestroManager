import { useQuery } from '@tanstack/react-query';
import { getInvoices } from '../invoices';

export const useInvoicesQuery = () => {
  return useQuery({
    queryKey: ['invoices'],
    queryFn: () => getInvoices()
  });
};
