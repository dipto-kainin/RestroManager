import React, { useState } from 'react';
import { X } from '@phosphor-icons/react';
import type { Food } from '../../services/types';
import { CustomSelect } from '../../components/CustomSelect';

interface OrderFormProps {
  foods: Food[];
  activeOrderExists: boolean;
  onCancel: () => void;
  onSubmit: (items: { food: Food; quantity: number }[]) => Promise<void>;
}

export const OrderForm: React.FC<OrderFormProps> = ({
  foods,
  activeOrderExists,
  onCancel,
  onSubmit
}) => {
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [cartItems, setCartItems] = useState<{ food: Food; quantity: number }[]>([]);
  const [orderError, setOrderError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddToCart = () => {
    if (!selectedFoodId) return;
    const foodItem = foods.find(f => f.id === selectedFoodId);
    if (!foodItem) return;

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) return;

    const existingIdx = cartItems.findIndex(item => item.food.id === foodItem.id);
    if (existingIdx !== -1) {
      const updatedCart = [...cartItems];
      updatedCart[existingIdx].quantity += qty;
      setCartItems(updatedCart);
    } else {
      setCartItems([...cartItems, { food: foodItem, quantity: qty }]);
    }
    setSelectedFoodId('');
    setQuantity('1');
  };

  const handleRemoveFromCart = (index: number) => {
    const updated = cartItems.filter((_, i) => i !== index);
    setCartItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    setOrderError('');
    setSaving(true);
    try {
      await onSubmit(cartItems);
    } catch (err: any) {
      console.error('Error placing order in form:', err);
      setOrderError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
          {activeOrderExists ? 'Add Items to Order' : 'New Table Order'}
        </span>
        <button type="button" style={{ border: 'none', background: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }} onClick={onCancel}>
          <X size={16} />
        </button>
      </div>

      {orderError && (
        <div className="form-error" style={{
          padding: '0.75rem',
          backgroundColor: 'oklch(0.95 0.05 20)',
          border: '1px solid oklch(0.85 0.10 20)',
          borderRadius: '8px',
          color: 'oklch(0.4 0.15 20)',
          fontSize: '0.85rem',
          fontWeight: 500,
          textAlign: 'center'
        }}>
          {orderError}
        </div>
      )}

      {/* Selector */}
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" style={{ fontSize: '0.8rem' }}>Choose Dish</label>
        <CustomSelect
          options={foods.map(f => ({
            value: f.id || '',
            label: f.name,
            subLabel: `₹${f.price.toFixed(2)}`
          }))}
          value={selectedFoodId}
          onChange={setSelectedFoodId}
          placeholder="-- Select --"
        />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
        <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>Qty</label>
          <input
            type="number"
            className="form-input"
            min="1"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            style={{ padding: '0.5rem' }}
          />
        </div>
        <button className="btn btn-secondary" style={{ height: '38px', padding: '0.5rem 1rem' }} onClick={handleAddToCart} disabled={saving}>
          Add
        </button>
      </div>

      {/* Cart Summary */}
      {cartItems.length > 0 && (
        <div style={{ marginTop: '0.5rem' }}>
          <span className="form-label" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem' }}>Cart:</span>
          <div style={{
            maxHeight: '180px',
            overflowY: 'auto',
            border: '1px solid var(--surface-border)',
            borderRadius: '6px',
            padding: '0.5rem',
            backgroundColor: 'var(--bg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.375rem'
          }}>
            {cartItems.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                <span>{item.food.name} x {item.quantity}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>₹{(item.food.price * item.quantity).toFixed(2)}</span>
                  <button 
                    style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer', padding: 0 }}
                    onClick={() => handleRemoveFromCart(idx)}
                    disabled={saving}
                  >
                    <X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.85rem', marginTop: '0.5rem' }}>
            <span>Total:</span>
            <span>
              ₹{cartItems.reduce((sum, item) => sum + (item.food.price * item.quantity), 0).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '1rem' }}>
        <button 
          className="btn btn-secondary" 
          style={{ flex: 1, padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button 
          className="btn btn-accent" 
          style={{ flex: 1, padding: '0.5rem 1rem', fontSize: '0.85rem' }}
          disabled={cartItems.length === 0 || saving}
          onClick={handleSubmit}
        >
          {saving ? 'Submitting...' : 'Submit Order'}
        </button>
      </div>
    </div>
  );
};
