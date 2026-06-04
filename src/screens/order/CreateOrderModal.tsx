import React, { useState } from 'react';
import { X, Table as TableIcon, ShoppingCart } from '@phosphor-icons/react';
import type { Table, Food } from '../../services/types';
import { CustomSelect } from '../../components/CustomSelect';

interface CreateOrderModalProps {
  tables: Table[];
  foods: Food[];
  onClose: () => void;
  onSubmit: (tableId: string, cartItems: { food: Food; quantity: number }[]) => Promise<void>;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  tables,
  foods,
  onClose,
  onSubmit
}) => {
  const [selectedTableId, setSelectedTableId] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [cart, setCart] = useState<{ food: Food; quantity: number }[]>([]);
  const [saving, setSaving] = useState(false);

  const handleAddToCart = () => {
    if (!selectedFoodId) return;
    const foodItem = foods.find(f => f.id === selectedFoodId);
    if (!foodItem) return;

    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) return;

    const existingIdx = cart.findIndex(item => item.food.id === foodItem.id);
    if (existingIdx !== -1) {
      const updated = [...cart];
      updated[existingIdx].quantity += qty;
      setCart(updated);
    } else {
      setCart([...cart, { food: foodItem, quantity: qty }]);
    }
    setSelectedFoodId('');
    setQuantity('1');
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handlePlaceOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTableId || cart.length === 0) return;

    setSaving(true);
    try {
      await onSubmit(selectedTableId, cart);
    } catch (err) {
      console.error('Error in order submit:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
          Create Dining Room Order
        </h3>

        <form onSubmit={handlePlaceOrderSubmit}>
          <div className="form-group">
            <label className="form-label">Table Number</label>
            <CustomSelect
              options={tables.map(t => ({
                value: t.id || '',
                label: `Table ${t.table_number}`,
                subLabel: `${t.status.toUpperCase()} • Cap: ${t.number_of_guests}`
              }))}
              value={selectedTableId}
              onChange={setSelectedTableId}
              placeholder="-- Choose Table --"
              required
              leftIcon={<TableIcon size={16} />}
            />
          </div>

          {/* Add item interface */}
          <div style={{ border: '1px solid var(--surface-border)', padding: '1rem', borderRadius: '8px', marginBottom: '1.25rem', backgroundColor: 'var(--surface)' }}>
            <span className="form-label" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.75rem' }}>Select Food Items:</span>
            
            <div className="form-group">
              <CustomSelect
                options={foods.map(f => ({
                  value: f.id || '',
                  label: f.name,
                  subLabel: `₹${f.price.toFixed(2)}`
                }))}
                value={selectedFoodId}
                onChange={setSelectedFoodId}
                placeholder="-- Choose Food --"
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', marginTop: '0.5rem' }}>
              <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Qty</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                />
              </div>
              <button type="button" className="btn btn-secondary" style={{ height: '42px' }} onClick={handleAddToCart}>
                Add to Cart
              </button>
            </div>
          </div>

          {/* Cart List */}
          {cart.length > 0 ? (
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="form-label" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Order Details:</span>
              <div style={{
                maxHeight: '150px',
                overflowY: 'auto',
                border: '1px solid var(--surface-border)',
                borderRadius: '8px',
                padding: '0.75rem',
                backgroundColor: 'var(--bg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {cart.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span>{item.food.name} <strong style={{ color: 'var(--accent)' }}>x{item.quantity}</strong></span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>₹{(item.food.price * item.quantity).toFixed(2)}</span>
                      <button
                        type="button"
                        style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer', padding: 0 }}
                        onClick={() => handleRemoveFromCart(idx)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: '0.75rem' }}>
                <span>Order Total:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  ₹{cart.reduce((s, i) => s + (i.food.price * i.quantity), 0).toFixed(2)}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ padding: '1.5rem', textAlign: 'center', border: '1px dashed var(--surface-border)', borderRadius: '8px', color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              <ShoppingCart size={24} style={{ marginInline: 'auto', marginBottom: '0.5rem' }} />
              Your order cart is empty. Add dishes above.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={cart.length === 0 || saving}>
              {saving ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
