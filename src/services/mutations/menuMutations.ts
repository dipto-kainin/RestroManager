import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createMenu, deleteMenu } from '../menus';

export const useCreateMenuMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (menuData: any) => createMenu(menuData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    }
  });
};

export const useDeleteMenuMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMenu(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menus'] });
    }
  });
};
