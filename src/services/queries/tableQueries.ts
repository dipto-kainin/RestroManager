import { useQuery } from '@tanstack/react-query';
import { getTables } from '../tables';

export const useTablesQuery = (start?: string, end?: string) => {
  return useQuery({
    queryKey: ['tables', { start, end }],
    queryFn: () => getTables(start, end)
  });
};
