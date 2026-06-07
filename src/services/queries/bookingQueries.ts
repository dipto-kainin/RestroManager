import { useQuery } from '@tanstack/react-query';
import { getBookings } from '../bookings';

export const useBookingsQuery = (refetchInterval?: number) => {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: () => getBookings(),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    refetchInterval
  });
};
