import { useQuery } from '@tanstack/react-query';
import { getFoods } from '../foods';

export const useFoodsQuery = () => {
  return useQuery({
    queryKey: ['foods'],
    queryFn: () => getFoods()
  });
};
