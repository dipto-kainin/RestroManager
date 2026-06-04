import { request } from './client';
import type { Menu } from './types';

export async function getMenus(): Promise<Menu[]> {
  return (await request<Menu[]>('/menus')) || [];
}

export async function createMenu(menu: Menu): Promise<Menu> {
  return request<Menu>('/menus', {
    method: 'POST',
    body: JSON.stringify(menu)
  });
}

export async function deleteMenu(id: string): Promise<void> {
  return request<void>(`/menus/${id}`, {
    method: 'DELETE'
  });
}
