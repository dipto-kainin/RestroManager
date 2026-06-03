import React, { useEffect, useState } from 'react';
import { api, type Order, type Table, type Food, type OrderItem } from '../api';
import { Play, Check, X, Plus, ShoppingCart, Table as TableIcon } from '@phosphor-icons/react';
import { CustomSelect } from './CustomSelect';

export const OrderView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for adding order
  const [selectedTableId, setSelectedTableId] = useState('');
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [cart, setCart] = useState<{ food: Food; quantity: number }[]>([]);

  const loadData = async () => {
    try {
      const [allOrders, allTables, allFoods] = await Promise.all([
        api.getOrders(),
        api.getTables(),
        api.getFoods()
      ]);
      setOrders(allOrders);
      setTables(allTables);
      setFoods(allFoods);
    } catch (err) {
      console.error('Error fetching order view data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (order: Order, newStatus: Order['status']) => {
    if (!order.id) return;
    try {
      await api.updateOrder(order.id, {
        ...order,
        status: newStatus
      });
      
      // If order is served or cancelled, make table vacant
      if (newStatus === 'served' || newStatus === 'cancelled') {
        const table = tables.find(t => t.id === order.table_id);
        if (table && table.id) {
          await api.updateTable(table.id, {
            ...table,
            status: 'vacant'
          });
        }
      }
      
      loadData();
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  // Cart operations
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

    try {
      const orderPayload: Order = {
        table_id: selectedTableId,
        order_date: new Date().toISOString(),
        status: 'pending'
      };

      const orderItemsPayload: OrderItem[] = cart.map(item => ({
        order_id: '',
        food_id: item.food.id || '',
        quantity: item.quantity,
        unit_price: item.food.price
      }));

      await api.createOrder(orderPayload, orderItemsPayload);

      // Make table occupied
      const table = tables.find(t => t.id === selectedTableId);
      if (table && table.id) {
        await api.updateTable(table.id, {
          ...table,
          status: 'occupied'
        });
      }

      setShowAddModal(false);
      setSelectedTableId('');
      setCart([]);
      loadData();
    } catch (err) {
      console.error('Error submitting order:', err);
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <p style={{ color: 'var(--muted)', fontWeight: 600 }}>Loading active order queues...</p>
      </div>
    );
  }

  // Kanban Columns
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');
  const readyOrders = orders.filter(o => o.status === 'ready');
  const servedOrders = orders.filter(o => o.status === 'served' || o.status === 'cancelled');

  const renderOrderCard = (order: Order) => {
    const table = tables.find(t => t.id === order.table_id);
    const total = order.items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0;

    return (
      <div key={order.id} className="order-card">
        <div className="order-card-header">
          <span className="order-card-id">#{order.id?.slice(-4).toUpperCase()}</span>
          <span className="order-card-table">T-{table?.table_number || 'N/A'}</span>
        </div>

        <div className="order-card-details">
          {order.items?.map((item, idx) => {
            const food = foods.find(f => f.id === item.food_id);
            return (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span>{food?.name || 'Dish'} x{item.quantity}</span>
              </div>
            );
          })}
        </div>

        <div className="order-card-footer">
          <span className="order-card-price">₹{total.toFixed(2)}</span>
          
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {order.status === 'pending' && (
              <button
                className="btn btn-primary"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px' }}
                onClick={() => handleUpdateStatus(order, 'preparing')}
              >
                <Play size={12} /> Prep
              </button>
            )}
            {order.status === 'preparing' && (
              <button
                className="btn btn-accent"
                style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', borderRadius: '6px' }}
                onClick={() => handleUpdateStatus(order, 'ready')}
              >
                <Check size={12} /> Ready
              </button>
            )}
            {order.status === 'ready' && (
              <button
                className="btn btn-primary"
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  backgroundColor: 'var(--status-ready)',
                  borderColor: 'var(--status-ready)'
                }}
                onClick={() => handleUpdateStatus(order, 'served')}
              >
                <Check size={12} /> Serve
              </button>
            )}
            {order.status !== 'served' && order.status !== 'cancelled' && (
              <button
                className="btn btn-secondary"
                style={{ padding: '0.25rem', borderRadius: '6px' }}
                onClick={() => handleUpdateStatus(order, 'cancelled')}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="view-header">
        <div>
          <h2 className="view-title">Kitchen Queue</h2>
          <p className="view-subtitle">Monitor order flows. Advance orders from pending to active preparation, to counter-ready and delivery.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> New Order
        </button>
      </div>

      <div className="kanban-board">
        {/* Pending Column */}
        <div className="kanban-column">
          <div className="kanban-column-header">
            <h3 className="kanban-column-title">Pending</h3>
            <span className="kanban-column-count">{pendingOrders.length}</span>
          </div>
          <div className="kanban-cards">
            {pendingOrders.map(renderOrderCard)}
          </div>
        </div>

        {/* Preparing Column */}
        <div className="kanban-column">
          <div className="kanban-column-header">
            <h3 className="kanban-column-title">Preparing</h3>
            <span className="kanban-column-count" style={{ backgroundColor: 'var(--accent)' }}>{preparingOrders.length}</span>
          </div>
          <div className="kanban-cards">
            {preparingOrders.map(renderOrderCard)}
          </div>
        </div>

        {/* Ready Column */}
        <div className="kanban-column">
          <div className="kanban-column-header">
            <h3 className="kanban-column-title">Ready</h3>
            <span className="kanban-column-count" style={{ backgroundColor: 'var(--status-ready)' }}>{readyOrders.length}</span>
          </div>
          <div className="kanban-cards">
            {readyOrders.map(renderOrderCard)}
          </div>
        </div>

        {/* Served Column */}
        <div className="kanban-column">
          <div className="kanban-column-header">
            <h3 className="kanban-column-title">Served / Past</h3>
            <span className="kanban-column-count" style={{ backgroundColor: 'var(--muted)' }}>{servedOrders.length}</span>
          </div>
          <div className="kanban-cards">
            {servedOrders.map(renderOrderCard)}
          </div>
        </div>
      </div>

      {/* Add Order Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddModal(false)}>
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
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={cart.length === 0}>
                  Create Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
