import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createFood, updateFood, deleteFood } from '../foods';

export const useSaveFoodMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, formData }: { id?: string; formData: FormData }) => {
      if (id) {
        await updateFood(id, formData);
      } else {
        await createFood(formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods'] });
    }
  });
};

export const useDeleteFoodMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFood(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foods'] });
    }
  });
};
