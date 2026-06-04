import { useMutation, useQueryClient } from '@tanstack/react-query';
import { checkInBooking, cancelBooking, updateMinEntryTime, createBooking } from '../bookings';

export const useCheckInBookingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => checkInBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    }
  });
};

export const useCancelBookingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: string) => cancelBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    }
  });
};

export const useUpdateMinEntryTimeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, val }: { bookingId: string; val: string }) => updateMinEntryTime(bookingId, val),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    }
  });
};

export const useCreateBookingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingData: any) => createBooking(bookingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    }
  });
};
