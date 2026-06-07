import React, { useState } from 'react';
import { 
  useOrdersWithActiveItemsQuery,
  useTablesQuery,
  useFoodsQuery,
  usePlaceOrderMutation,
  useUpdateOrderStatusMutation,
  type Order, 
  type Food 
} from '../../services';
import { Play, Check, X, Plus } from '@phosphor-icons/react';
import { CreateOrderModal } from './CreateOrderModal';

export const OrderScreen: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);

  // Queries
  const { data: orders = [], isLoading: loadingOrders } = useOrdersWithActiveItemsQuery(5000);
  const { data: tables = [], isLoading: loadingTables } = useTablesQuery();
  const { data: foods = [], isLoading: loadingFoods } = useFoodsQuery();

  const loading = loadingOrders || loadingTables || loadingFoods;

  // Mutations
  const updateOrderStatusMutation = useUpdateOrderStatusMutation();
  const placeOrderMutation = usePlaceOrderMutation();

  const handleUpdateStatus = async (order: Order, newStatus: Order['status']) => {
    try {
      await updateOrderStatusMutation.mutateAsync({ order, newStatus });
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  const handlePlaceOrder = async (tableId: string, cartItems: { food: Food; quantity: number }[]) => {
    try {
      await placeOrderMutation.mutateAsync({ tableId, cartItems });
      setShowAddModal(false);
    } catch (err) {
      console.error('Error placing order:', err);
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
  const servedOrders = orders.filter(o => o.status === 'served' || o.status === 'completed' || o.status === 'cancelled');

  const renderOrderCard = (order: Order) => {
    const table = tables.find(t => t.id === order.table_id);
    const total = order.items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0;
    const hasNoItems = !order.items || order.items.length === 0;

    return (
      <div key={order.id} className="order-card">
        <div className="order-card-header">
          <span className="order-card-id">#{order.id?.slice(-4).toUpperCase()}</span>
          <span className="order-card-table">T-{table?.table_number || 'N/A'}</span>
        </div>

        <div className="order-card-details">
          {hasNoItems ? (
            <div style={{
              color: 'oklch(0.4 0.15 20)',
              fontWeight: 600,
              fontSize: '0.75rem',
              backgroundColor: 'oklch(0.95 0.05 20)',
              padding: '0.375rem 0.5rem',
              borderRadius: '6px',
              textAlign: 'center',
              marginBlock: '0.25rem'
            }}>
              ⚠️ Empty Order
            </div>
          ) : (
            order.items?.map((item, idx) => {
              const food = foods.find(f => f.id === item.food_id);
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span>{food?.name || 'Dish'} x{item.quantity}</span>
                </div>
              );
            })
          )}
        </div>

        <div className="order-card-footer">
          <span className="order-card-price">₹{total.toFixed(2)}</span>
          
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {order.status === 'pending' && (
              <button
                className="btn btn-primary"
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  opacity: hasNoItems ? 0.5 : 1,
                  cursor: hasNoItems ? 'not-allowed' : 'pointer'
                }}
                onClick={() => handleUpdateStatus(order, 'preparing')}
                disabled={hasNoItems}
                title={hasNoItems ? "Cannot process an empty order" : ""}
              >
                <Play size={12} /> Prep
              </button>
            )}
            {order.status === 'preparing' && (
              <button
                className="btn btn-accent"
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  opacity: hasNoItems ? 0.5 : 1,
                  cursor: hasNoItems ? 'not-allowed' : 'pointer'
                }}
                onClick={() => handleUpdateStatus(order, 'ready')}
                disabled={hasNoItems}
                title={hasNoItems ? "Cannot process an empty order" : ""}
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
                  backgroundColor: hasNoItems ? 'var(--surface-border)' : 'var(--status-ready)',
                  borderColor: hasNoItems ? 'var(--surface-border)' : 'var(--status-ready)',
                  opacity: hasNoItems ? 0.5 : 1,
                  cursor: hasNoItems ? 'not-allowed' : 'pointer'
                }}
                onClick={() => handleUpdateStatus(order, 'served')}
                disabled={hasNoItems}
                title={hasNoItems ? "Cannot process an empty order" : ""}
              >
                <Check size={12} /> Serve
              </button>
            )}
            {order.status !== 'served' && order.status !== 'completed' && order.status !== 'cancelled' && (
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
        <CreateOrderModal
          tables={tables}
          foods={foods}
          onClose={() => setShowAddModal(false)}
          onSubmit={handlePlaceOrder}
        />
      )}
    </div>
  );
};
