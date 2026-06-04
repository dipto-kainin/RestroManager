import React, { useState } from 'react';
import { X } from '@phosphor-icons/react';

interface CategoryFormModalProps {
  existingCategories: string[];
  onClose: () => void;
  onSubmit: (categoryName: string, categoryType: string) => Promise<void>;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  existingCategories,
  onClose,
  onSubmit
}) => {
  const [categoryName, setCategoryName] = useState('');
  const [categoryType, setCategoryType] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName || !categoryType) return;
    setCategoryError('');
    setCreatingCategory(true);

    try {
      await onSubmit(categoryName, categoryType);
    } catch (err: any) {
      console.error('Error creating category:', err);
      setCategoryError(err.message || 'Failed to create category.');
    } finally {
      setCreatingCategory(false);
    }
  };

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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
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
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={creatingCategory}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={creatingCategory}>
              {creatingCategory ? 'Creating...' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
