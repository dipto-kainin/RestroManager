import React, { useEffect, useState } from 'react';
import { 
  useMenusQuery,
  useFoodsQuery,
  useCreateMenuMutation,
  useDeleteMenuMutation,
  useSaveFoodMutation,
  useDeleteFoodMutation,
  type Food, 
  type User 
} from '../../services';
import { Plus, PencilSimple, Trash, List } from '@phosphor-icons/react';
import { CustomSelect } from '../../components/CustomSelect';
import { FoodFormModal, parseMarkdown } from './FoodFormModal';
import { CategoryFormModal } from './CategoryFormModal';
import { stripHtml, getFirstParagraph } from '../../utils/text';

interface MenuScreenProps {
  currentUser: User | null;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ currentUser }) => {
  const [activeMenuId, setActiveMenuId] = useState<string>('');
  const [activeCategoryName, setActiveCategoryName] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  // Queries
  const { data: menus = [], isLoading: loadingMenus } = useMenusQuery();
  const { data: foods = [], isLoading: loadingFoods } = useFoodsQuery();

  const loading = loadingMenus || loadingFoods;

  // Sync active categories on load
  useEffect(() => {
    if (menus.length > 0) {
      if (!activeMenuId) {
        const firstMenu = menus[0];
        setActiveMenuId(firstMenu.id || '');
        setActiveCategoryName(firstMenu.name);
      } else {
        const activeMenu = menus.find(m => m.id === activeMenuId);
        if (activeMenu) {
          setActiveCategoryName(activeMenu.name);
        } else {
          const firstMenu = menus[0];
          setActiveMenuId(firstMenu.id || '');
          setActiveCategoryName(firstMenu.name);
        }
      }
    }
  }, [menus, activeMenuId]);

  // Mutations
  const createMenuMutation = useCreateMenuMutation();
  const deleteMenuMutation = useDeleteMenuMutation();
  const saveFoodMutation = useSaveFoodMutation();
  const deleteFoodMutation = useDeleteFoodMutation();

  const openAddModal = () => {
    setEditingFood(null);
    setShowModal(true);
  };

  const openAddCategoryModal = () => {
    setShowCategoryModal(true);
  };

  const handleCreateCategory = async (categoryName: string, categoryType: string) => {
    try {
      const newMenu = await createMenuMutation.mutateAsync({
        name: categoryName,
        category: categoryType,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      });
      if (newMenu && newMenu.id) {
        setActiveMenuId(newMenu.id);
      }
      setShowCategoryModal(false);
    } catch (err) {
      console.error('Error adding category:', err);
    }
  };

  const openEditModal = (food: Food) => {
    setEditingFood(food);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await deleteFoodMutation.mutateAsync(id);
    } catch (err) {
      console.error('Error deleting food item:', err);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!id) return;
    const activeMenu = menus.find(m => m.id === id);
    if (!activeMenu) return;

    if (!window.confirm(`Are you sure you want to delete the category "${activeMenu.name} (${activeMenu.category})"? Any food items belonging to this category will have their category cleared.`)) return;

    try {
      await deleteMenuMutation.mutateAsync(id);
      setActiveMenuId('');
      setActiveCategoryName('');
    } catch (err: any) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category: ' + err.message);
    }
  };

  const handleFoodFormSubmit = async (formData: FormData) => {
    try {
      await saveFoodMutation.mutateAsync({ id: editingFood?.id, formData });
      setShowModal(false);
    } catch (err) {
      console.error('Error saving food form:', err);
    }
  };

  const filteredFoods = foods.filter(f => f.menu_id === activeMenuId);
  const existingCategories = Array.from(new Set(menus.map(m => m.name)));

  if (loading && menus.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <p style={{ color: 'var(--muted)', fontWeight: 600 }}>Loading Citrus menus...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="view-header">
        <div>
          <h2 className="view-title">Menu Management</h2>
          <p className="view-subtitle">Browse recipes, customize menu segments, and configure ingredients details.</p>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={openAddCategoryModal}>
              <Plus size={16} /> Add Category
            </button>
            <button className="btn btn-primary" onClick={openAddModal}>
              <Plus size={16} /> Add Food Item
            </button>
          </div>
        )}
      </div>

      {/* Categories Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        padding: '0.375rem',
        borderRadius: '10px',
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--surface-border)',
        marginBottom: '1.25rem',
        overflowX: 'auto'
      }}>
        {Array.from(new Set(menus.map(m => m.name))).map(name => (
          <button
            key={name}
            onClick={() => {
              setActiveCategoryName(name);
              const firstSub = menus.find(m => m.name === name);
              if (firstSub) {
                setActiveMenuId(firstSub.id || '');
              }
            }}
            style={{
              padding: '0.625rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeCategoryName === name ? 'var(--primary)' : 'transparent',
              color: 'var(--ink)',
              fontWeight: activeCategoryName === name ? 700 : 500,
              fontSize: '0.9rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s var(--ease-out)'
            }}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Subcategory Selector Dropdown */}
      {menus.filter(m => m.name === activeCategoryName).length > 0 && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem', 
          marginBottom: '2rem', 
          padding: '0.75rem 1rem',
          borderRadius: '8px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--surface-border)',
          width: 'fit-content'
        }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)' }}>Subcategory:</span>
          <div style={{ width: '180px' }}>
            <CustomSelect
              options={menus.filter(m => m.name === activeCategoryName).map(sub => ({
                value: sub.id || '',
                label: sub.category
              }))}
              value={activeMenuId}
              onChange={(val) => setActiveMenuId(val)}
              placeholder="Select Type"
            />
          </div>
          {isAdmin && (
            <button
              className="btn btn-danger"
              style={{ padding: '0.5rem', borderRadius: '6px', marginLeft: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onClick={() => handleDeleteCategory(activeMenuId)}
              title="Delete this subcategory"
            >
              <Trash size={16} />
            </button>
          )}
        </div>
      )}

      {/* Foods Grid */}
      {filteredFoods.length === 0 ? (
        <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--muted)' }}>
          <List size={48} style={{ marginInline: 'auto', marginBottom: '1rem', color: 'var(--muted)' }} />
          <h3 style={{ margin: 0, fontWeight: 700 }}>No items in this category</h3>
          <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Select another menu or add the first culinary item.</p>
        </div>
      ) : (
        <div className="food-grid">
          {filteredFoods.map(food => (
            <div key={food.id} className="food-card">
              {food.image ? (
                <div style={{
                  backgroundImage: `url(${food.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  width: '100%',
                  height: '180px'
                }} />
              ) : (
                <div className="food-image-placeholder">
                  {food.name.charAt(0)}
                </div>
              )}
              <div className="food-card-body">
                <h4 className="food-card-title">{food.name}</h4>
                <div className="food-card-desc">
                  {stripHtml(parseMarkdown(getFirstParagraph(food.description || 'No description provided.')))}
                </div>
                <div className="food-card-footer">
                  <span className="food-card-price">₹{food.price.toFixed(2)}</span>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.375rem', borderRadius: '6px' }}
                        onClick={() => openEditModal(food)}
                      >
                        <PencilSimple size={16} />
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.375rem', borderRadius: '6px' }}
                        onClick={() => handleDelete(food.id || '')}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <FoodFormModal
          editingFood={editingFood}
          menus={menus}
          activeMenuId={activeMenuId}
          onClose={() => setShowModal(false)}
          onSubmit={handleFoodFormSubmit}
        />
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <CategoryFormModal
          existingCategories={existingCategories}
          onClose={() => setShowCategoryModal(false)}
          onSubmit={handleCreateCategory}
        />
      )}
    </div>
  );
};
