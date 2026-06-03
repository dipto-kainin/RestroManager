import React, { useEffect, useState } from 'react';
import { api, type Menu, type Food, type User } from '../api';
import { Plus, PencilSimple, Trash, X, List, CurrencyInr } from '@phosphor-icons/react';
import { CustomSelect } from './CustomSelect';

// Simple Markdown parser supporting Headings, Bold, Italics, Inline Code, and Bullet Lists safely
const parseMarkdown = (text: string): string => {
  if (!text) return '';
  
  // Escape HTML to prevent XSS
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
    
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold (**text** or __text__)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Italics (*text* or _text_)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Inline Code (`code`)
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // Bullet lists (lines starting with - or * )
  const lines = html.split('\n');
  let inList = false;
  const processedLines = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const content = trimmed.substring(2);
      if (!inList) {
        inList = true;
        return '<ul><li>' + content + '</li>';
      }
      return '<li>' + content + '</li>';
    } else {
      if (inList) {
        inList = false;
        return '</ul>' + (trimmed ? `<p>${trimmed}</p>` : '');
      }
      return trimmed ? `<p>${trimmed}</p>` : '';
    }
  });
  
  if (inList) {
    processedLines.push('</ul>');
  }
  
  return processedLines.filter(Boolean).join('\n');
};

interface MenuViewProps {
  currentUser: User | null;
}

export const MenuView: React.FC<MenuViewProps> = ({ currentUser }) => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string>('');
  const [activeCategoryName, setActiveCategoryName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFood, setEditingFood] = useState<Food | null>(null);

  // Form states
  const [foodName, setFoodName] = useState('');
  const [foodPrice, setFoodPrice] = useState('');
  const [foodDesc, setFoodDesc] = useState('');
  const [foodImage, setFoodImage] = useState('');
  const [foodFile, setFoodFile] = useState<File | null>(null);
  const [foodMenuId, setFoodMenuId] = useState('');
  const [descTab, setDescTab] = useState<'write' | 'preview'>('write');

  // Category Form states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  const loadData = async () => {
    setLoading(true);
    try {
      const [allMenus, allFoods] = await Promise.all([
        api.getMenus(),
        api.getFoods()
      ]);
      setMenus(allMenus);
      setFoods(allFoods);
      
      if (allMenus.length > 0) {
        if (!activeMenuId) {
          const firstMenu = allMenus[0];
          setActiveMenuId(firstMenu.id || '');
          setActiveCategoryName(firstMenu.name);
        } else {
          const activeMenu = allMenus.find(m => m.id === activeMenuId);
          if (activeMenu) {
            setActiveCategoryName(activeMenu.name);
          } else {
            const firstMenu = allMenus[0];
            setActiveMenuId(firstMenu.id || '');
            setActiveCategoryName(firstMenu.name);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching menu/food data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingFood(null);
    setFoodName('');
    setFoodPrice('');
    setFoodDesc('');
    setFoodImage('');
    setFoodFile(null);
    setFoodMenuId(activeMenuId);
    setDescTab('write');
    setShowModal(true);
  };

  const openAddCategoryModal = () => {
    setCategoryName('');
    setCategoryType('');
    setCategoryError('');
    setShowCategoryModal(true);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName || !categoryType) return;
    setCategoryError('');
    setCreatingCategory(true);

    try {
      const newMenu = await api.createMenu({
        name: categoryName,
        category: categoryType,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      });
      setShowCategoryModal(false);
      setCategoryName('');
      setCategoryType('');
      const allMenus = await api.getMenus();
      setMenus(allMenus);
      if (newMenu && newMenu.id) {
        setActiveMenuId(newMenu.id);
      }
    } catch (err: any) {
      console.error('Error creating category:', err);
      setCategoryError(err.message || 'Failed to create category.');
    } finally {
      setCreatingCategory(false);
    }
  };

  const openEditModal = (food: Food) => {
    setEditingFood(food);
    setFoodName(food.name);
    setFoodPrice(food.price.toString());
    setFoodDesc(food.description || '');
    setFoodImage(food.image || '');
    setFoodFile(null);
    setFoodMenuId(food.menu_id);
    setDescTab('write');
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds the 5MB limit.');
      return;
    }

    setFoodFile(file);
    const previewUrl = URL.createObjectURL(file);
    setFoodImage(previewUrl);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this menu item?')) return;
    try {
      await api.deleteFood(id);
      loadData();
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
      await api.deleteMenu(id);
      setActiveMenuId('');
      setActiveCategoryName('');
      loadData();
    } catch (err: any) {
      console.error('Error deleting category:', err);
      alert('Failed to delete category: ' + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(foodPrice);
    if (isNaN(priceNum)) return;

    const formData = new FormData();
    formData.append('name', foodName);
    formData.append('price', priceNum.toString());
    formData.append('menu_id', foodMenuId);
    formData.append('description', foodDesc);

    if (foodFile) {
      formData.append('image', foodFile);
    } else if (editingFood && foodImage && !foodImage.startsWith('blob:')) {
      formData.append('food_image', foodImage);
    }

    try {
      if (editingFood && editingFood.id) {
        await api.updateFood(editingFood.id, formData);
      } else {
        await api.createFood(formData);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error('Error saving food item:', err);
    }
  };

  const filteredFoods = foods.filter(f => f.menu_id === activeMenuId);

  // Get unique existing category names for suggestions
  const existingCategories = Array.from(new Set(menus.map(m => m.name)));
  
  const getSuggestions = () => {
    const query = categoryName.trim().toLowerCase();
    if (query === '') {
      return existingCategories.slice(0, 3);
    }
    return existingCategories
      .filter(name => 
        name.toLowerCase().includes(query) &&
        name.toLowerCase() !== query
      )
      .slice(0, 3);
  };
  const categorySuggestions = getSuggestions();

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
                <div 
                  className="food-card-desc"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(food.description || 'No description provided.') }}
                />
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
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: '650px', width: '90%' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
              {editingFood ? 'Edit Culinary Item' : 'Add Culinary Item'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Dish Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Lemon Roasted Seabass"
                  value={foodName}
                  onChange={e => setFoodName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Price (₹)</label>
                  <div style={{ position: 'relative' }}>
                    <CurrencyInr size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="150.00"
                      value={foodPrice}
                      onChange={e => setFoodPrice(e.target.value)}
                      required
                      style={{ paddingLeft: '2.25rem' }}
                    />
                  </div>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Category Menu</label>
                  <CustomSelect
                    options={menus.map(menu => ({
                      value: menu.id || '',
                      label: `${menu.name} (${menu.category})`
                    }))}
                    value={foodMenuId}
                    onChange={setFoodMenuId}
                    placeholder="Select Category"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Dish Photo</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-input"
                    onChange={handleFileChange}
                    style={{ padding: '0.375rem' }}
                  />
                  
                  {foodImage && (
                    <div style={{ position: 'relative', display: 'inline-block', width: '120px' }}>
                      <img
                        src={foodImage}
                        alt="Dish Preview"
                        style={{
                          width: '120px',
                          height: '80px',
                          objectFit: 'cover',
                          borderRadius: '6px',
                          border: '1px solid var(--surface-border)'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFoodImage('');
                          setFoodFile(null);
                        }}
                        style={{
                          position: 'absolute',
                          top: '-0.375rem',
                          right: '-0.375rem',
                          backgroundColor: 'var(--danger, #e11d48)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '18px',
                          height: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>Description</label>
                  <div style={{ display: 'flex', gap: '0.25rem', backgroundColor: 'var(--bg)', padding: '2px', borderRadius: '6px', border: '1px solid var(--surface-border)' }}>
                    <button
                      type="button"
                      onClick={() => setDescTab('write')}
                      style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: descTab === 'write' ? 'var(--surface)' : 'transparent',
                        color: descTab === 'write' ? 'var(--ink)' : 'var(--muted)',
                        cursor: 'pointer',
                        boxShadow: descTab === 'write' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      Write
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescTab('preview')}
                      style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        border: 'none',
                        borderRadius: '4px',
                        backgroundColor: descTab === 'preview' ? 'var(--surface)' : 'transparent',
                        color: descTab === 'preview' ? 'var(--ink)' : 'var(--muted)',
                        cursor: 'pointer',
                        boxShadow: descTab === 'preview' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      Preview
                    </button>
                  </div>
                </div>
                
                {descTab === 'write' ? (
                  <textarea
                    className="form-textarea"
                    rows={6}
                    placeholder="Describe the flavors, ingredients, allergens, or presentation of the dish using Markdown..."
                    value={foodDesc}
                    onChange={e => setFoodDesc(e.target.value)}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}
                  />
                ) : (
                  <div
                    className="markdown-preview"
                    style={{
                      minHeight: '154px',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--surface-border)',
                      backgroundColor: 'var(--bg)',
                      overflowY: 'auto',
                      fontSize: '0.9rem',
                      lineHeight: 1.5
                    }}
                    dangerouslySetInnerHTML={{ __html: parseMarkdown(foodDesc) || '<p style="color: var(--muted); font-style: italic;">No description preview available.</p>' }}
                  />
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingFood ? 'Save Changes' : 'Create Dish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal-content" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCategoryModal(false)}>
              <X size={20} />
            </button>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
              Add Menu Category
            </h3>

            {categoryError && (
              <div className="form-error" style={{
                padding: '0.75rem',
                backgroundColor: 'oklch(0.95 0.05 20)',
                border: '1px solid oklch(0.85 0.10 20)',
                borderRadius: '8px',
                textAlign: 'center',
                marginBottom: '1.5rem',
                color: 'oklch(0.4 0.15 20)',
                fontSize: '0.9rem',
                fontWeight: 500
              }}>
                {categoryError}
              </div>
            )}

            <form onSubmit={handleCreateCategory}>
              <div className="form-group">
                <label className="form-label">Category Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Lunch, Dinner, Drinks"
                  value={categoryName}
                  onChange={e => setCategoryName(e.target.value)}
                  required
                />
                {categorySuggestions.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginTop: '0.5rem',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      Suggestions:
                    </span>
                    {categorySuggestions.map(name => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setCategoryName(name)}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          border: '1px solid var(--surface-border)',
                          backgroundColor: 'var(--bg)',
                          color: 'var(--ink)',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                          fontWeight: 600,
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-border)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--bg)'}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Category Type/Code</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. main-course, drinks, starters"
                  value={categoryType}
                  onChange={e => setCategoryType(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCategoryModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={creatingCategory}>
                  {creatingCategory ? 'Creating...' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
