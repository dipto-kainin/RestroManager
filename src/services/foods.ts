import { request } from './client';
import type { Food } from './types';

export async function getFoods(): Promise<Food[]> {
  const rawFoods = (await request<any[]>('/foods')) || [];
  return rawFoods.map((f: any) => ({
    id: f.id,
    name: f.name,
    price: f.price,
    image: f.food_image || f.image,
    menu_id: f.menu_id,
    description: f.description
  }));
}

export async function createFood(formData: FormData): Promise<Food> {
  const f = await request<any>('/foods', {
    method: 'POST',
    body: formData
  });
  return {
    id: f.id || f.food?.id,
    name: f.food?.name || f.name,
    price: f.food?.price || f.price,
    image: f.food?.food_image || f.food_image || f.image,
    menu_id: f.food?.menu_id || f.menu_id,
    description: f.food?.description || f.description
  };
}

export async function updateFood(id: string, formData: FormData): Promise<void> {
  return request<void>(`/foods/${id}`, {
    method: 'PUT',
    body: formData
  });
}

export async function deleteFood(id: string): Promise<void> {
  return request<void>(`/foods/${id}`, {
    method: 'DELETE'
  });
}
