import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useTablesQuery, 
  useOrdersQuery, 
  useBookingsQuery,
  useUpdateTableMutation,
  useCheckInBookingMutation,
  useCancelBookingMutation,
  useUpdateMinEntryTimeMutation,
  useCreateBookingMutation,
  usePlaceOrderMutation,
  useCheckoutMutation,
  useCreateTableMutation,
  getCurrentUser, 
  type Table, 
  type Food 
} from '../../services';
import { Plus, Users } from '@phosphor-icons/react';
import { AddTableModal } from './AddTableModal';
import { TableDetailModal } from './TableDetailModal';

export const TableScreen: React.FC = () => {
  const navigate = useNavigate();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Queries
  const { data: tables = [], isLoading: loadingTables } = useTablesQuery();
  const { data: orders = [], isLoading: loadingOrders } = useOrdersQuery();
  const { data: bookings = [], isLoading: loadingBookings } = useBookingsQuery();

  const loading = loadingTables || loadingOrders || loadingBookings;

  // Selected Table reference
  const selectedTable = selectedTableId ? tables.find(t => t.id === selectedTableId) || null : null;

  // Mutations
  const updateTableMutation = useUpdateTableMutation();
  const checkInBookingMutation = useCheckInBookingMutation();
  const cancelBookingMutation = useCancelBookingMutation();
  const updateMinEntryTimeMutation = useUpdateMinEntryTimeMutation();
  const createBookingMutation = useCreateBookingMutation();
  const placeOrderMutation = usePlaceOrderMutation();
  const checkoutMutation = useCheckoutMutation();
  const createTableMutation = useCreateTableMutation();

  const handleSelectTable = (table: Table) => {
    setSelectedTableId(table.id || null);
  };

  const handleUpdateStatus = async (status: 'vacant' | 'occupied' | 'reserved') => {
    if (!selectedTable || !selectedTable.id) return;
    try {
      const updatedTable: Table = {
        ...selectedTable,
        status
      };
      await updateTableMutation.mutateAsync({ id: selectedTable.id, data: updatedTable });
    } catch (err) {
      console.error('Error updating table status:', err);
    }
  };

  const handleCheckInBooking = async (bookingId: string) => {
    try {
      await checkInBookingMutation.mutateAsync(bookingId);
    } catch (err) {
      console.error('Error checking in booking:', err);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await cancelBookingMutation.mutateAsync(bookingId);
    } catch (err) {
      console.error('Error cancelling booking:', err);
    }
  };

  const handleShiftCutoff = async (bookingId: string, val: string) => {
    try {
      await updateMinEntryTimeMutation.mutateAsync({ bookingId, val });
    } catch (err: any) {
      alert(err.message || 'Failed to shift cutoff time');
    }
  };

  const handleCreateBooking = async (bookingData: any) => {
    if (!selectedTable || !selectedTable.id) return;
    try {
      await createBookingMutation.mutateAsync({
        table_id: selectedTable.id,
        ...bookingData
      });
    } catch (err) {
      console.error('Error creating booking:', err);
    }
  };

  const handleCreateOrder = async (cartItems: { food: Food; quantity: number }[]) => {
    if (!selectedTable || !selectedTable.id) return;
    try {
      await placeOrderMutation.mutateAsync({ tableId: selectedTable.id, cartItems });
    } catch (err: any) {
      console.error('Error placing order:', err);
      throw err;
    }
  };

  const handleCheckout = async () => {
    if (!selectedTable) return;
    try {
      await checkoutMutation.mutateAsync(selectedTable);
      setSelectedTableId(null);
      navigate('/invoices');
    } catch (err) {
      console.error('Error during checkout:', err);
    }
  };

  const handleAddTable = async (tableNumber: number, capacity: number) => {
    try {
      await createTableMutation.mutateAsync({
        table_number: tableNumber,
        capacity: capacity,
        number_of_guests: capacity,
        seats_reserved: 0,
        status: 'vacant'
      });
      setShowAddModal(false);
    } catch (err) {
      console.error('Error adding table:', err);
    }
  };

  if (loading && tables.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <p style={{ color: 'var(--muted)', fontWeight: 600 }}>Loading floor map...</p>
      </div>
    );
  }

  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  return (
    <div>
      <div className="view-header">
        <div>
          <h2 className="view-title">Floor Map</h2>
          <p className="view-subtitle">Interactive floor planning. Select tables to adjust seating status, create orders, and check out bills.</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Table
          </button>
        )}
      </div>

      <div>
        {/* Visual Map Grid */}
        <div className="table-grid">
          {tables.map(table => {
            const isSelected = selectedTable?.id === table.id;
            const tableActiveOrder = orders.find(o => o.table_id === table.id && o.status !== 'served' && o.status !== 'cancelled');
            
            let badgeClass = 'badge-vacant';
            if (table.status === 'occupied') badgeClass = 'badge-occupied';
            if (table.status === 'reserved') badgeClass = 'badge-reserved';

            const tableBookings = bookings.filter(b => b.table_id === table.id && (b.status === 'pending' || b.status === 'checked_in'));
            const pendingCount = tableBookings.filter(b => b.status === 'pending').length;

            return (
              <div
                key={table.id}
                className={`table-cell ${isSelected ? 'selected' : ''} ${table.status}`}
                onClick={() => handleSelectTable(table)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span className={`badge ${badgeClass}`}>{table.status}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--muted)' }}>
                    <Users size={14} />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{table.number_of_guests}</span>
                  </div>
                </div>

                <div className="table-number">T-{table.table_number}</div>

                {/* Seat Dot Visualization */}
                <div className="seat-dots" style={{ display: 'flex', gap: '0.25rem', margin: '0.5rem 0', justifyContent: 'center' }}>
                  {Array.from({ length: table.number_of_guests }).map((_, i) => (
                    <div
                      key={i}
                      className={`seat-dot ${i < table.seats_reserved ? 'occupied' : 'available'}`}
                    />
                  ))}
                </div>

                <div className="table-cap">
                  {table.seats_reserved > 0 && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600 }}>
                      {table.seats_reserved}/{table.number_of_guests} reserved
                    </div>
                  )}
                  {pendingCount > 0 && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--warning)', fontWeight: 600 }}>
                      {pendingCount} pending check-in
                    </div>
                  )}
                  {tableActiveOrder ? (
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent)' }}>
                      Active Order: #{tableActiveOrder.id?.slice(-4).toUpperCase()}
                    </div>
                  ) : (
                    !table.seats_reserved && <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Clear</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Table Detail Modal */}
      {selectedTable && (
        <TableDetailModal
          selectedTable={selectedTable}
          bookings={bookings}
          orders={orders}
          onClose={() => setSelectedTableId(null)}
          onUpdateStatus={handleUpdateStatus}
          onCheckInBooking={handleCheckInBooking}
          onCancelBooking={handleCancelBooking}
          onShiftCutoff={handleShiftCutoff}
          onCreateBooking={handleCreateBooking}
          onCreateOrder={handleCreateOrder}
          onCheckout={handleCheckout}
          onNavigateToOrders={() => navigate('/orders')}
        />
      )}

      {/* Add Table Modal */}
      {showAddModal && (
        <AddTableModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddTable}
        />
      )}
    </div>
  );
};
