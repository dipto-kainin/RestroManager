import React, { useState } from 'react';
import { X, CurrencyInr } from '@phosphor-icons/react';
import type { Menu, Food } from '../../services/types';
import { CustomSelect } from '../../components/CustomSelect';

// Simple Markdown parser supporting Headings, Bold, Italics, Inline Code, and Bullet Lists safely
export const parseMarkdown = (text: string): string => {
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

interface FoodFormModalProps {
  editingFood: Food | null;
  menus: Menu[];
  activeMenuId: string;
  onClose: () => void;
  onSubmit: (formData: FormData) => Promise<void>;
}

export const FoodFormModal: React.FC<FoodFormModalProps> = ({
  editingFood,
  menus,
  activeMenuId,
  onClose,
  onSubmit
}) => {
  const [foodName, setFoodName] = useState(editingFood ? editingFood.name : '');
  const [foodPrice, setFoodPrice] = useState(editingFood ? editingFood.price.toString() : '');
  const [foodDesc, setFoodDesc] = useState(editingFood ? editingFood.description || '' : '');
  const [foodImage, setFoodImage] = useState(editingFood ? editingFood.image || '' : '');
  const [foodFile, setFoodFile] = useState<File | null>(null);
  const [foodMenuId, setFoodMenuId] = useState(editingFood ? editingFood.menu_id : activeMenuId);
  const [descTab, setDescTab] = useState<'write' | 'preview'>('write');
  const [saving, setSaving] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(foodPrice);
    if (isNaN(priceNum)) return;

    setSaving(true);
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
      await onSubmit(formData);
    } catch (err) {
      console.error('Error submitting food item form:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '650px', width: '90%' }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
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
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingFood ? 'Save Changes' : 'Create Dish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
