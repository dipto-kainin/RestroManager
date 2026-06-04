import { useQuery } from '@tanstack/react-query';
import { getMenus } from '../menus';

export const useMenusQuery = () => {
  return useQuery({
    queryKey: ['menus'],
    queryFn: () => getMenus()
  });
};
