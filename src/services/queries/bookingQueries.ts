import { useQuery } from '@tanstack/react-query';
import { getBookings } from '../bookings';

export const useBookingsQuery = () => {
  return useQuery({
    queryKey: ['bookings'],
    queryFn: () => getBookings()
  });
};
