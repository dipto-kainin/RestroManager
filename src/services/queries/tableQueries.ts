import { useQuery } from '@tanstack/react-query';
import { getTables } from '../tables';

export const useTablesQuery = (start?: string, end?: string, refetchInterval?: number) => {
  return useQuery({
    queryKey: ['tables', { start, end }],
    queryFn: () => getTables(start, end),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    refetchInterval
  });
};
