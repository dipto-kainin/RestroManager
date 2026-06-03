import React, { useEffect, useState } from 'react';
import { api, getCurrentUser, type Table, type Order, type Food, type Booking } from '../api';
import { Plus, Users, Receipt, FileText, X } from '@phosphor-icons/react';
import { CustomSelect } from './CustomSelect';

const getLocalDateString = (d: Date = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

interface TableViewProps {
  onNavigateToOrders: () => void;
  onNavigateToInvoices: () => void;
}

export const TableView: React.FC<TableViewProps> = ({ onNavigateToOrders, onNavigateToInvoices }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [loading, setLoading] = useState(true);
  
  // New Table Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableCap, setNewTableCap] = useState('2');
  const [addTableError, setAddTableError] = useState('');

  // Order Placement state (when placing order directly from table)
  const [isOrdering, setIsOrdering] = useState(false);
  const [selectedFoodId, setSelectedFoodId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [cartItems, setCartItems] = useState<{ food: Food; quantity: number }[]>([]);

  const loadData = async () => {
    try {
      const [allTables, allOrders, allFoods, allBookings] = await Promise.all([
        api.getTables(),
        api.getOrders(),
        api.getFoods(),
        api.getBookings()
      ]);
      setTables(allTables);
      setOrders(allOrders);
      setFoods(allFoods);
      setBookings(allBookings);

      // Re-sync selected table reference if any
      if (selectedTable) {
        const updated = allTables.find(t => t.id === selectedTable.id);
        if (updated) setSelectedTable(updated);
      }
    } catch (err) {
      console.error('Error loading tables data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckInBooking = async (bookingId: string) => {
    try {
      await api.checkInBooking(bookingId);
      await loadData();
    } catch (err) {
      console.error('Error checking in booking:', err);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await api.cancelBooking(bookingId);
      await loadData();
    } catch (err) {
      console.error('Error cancelling booking:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [activeView, setActiveView] = useState<'booking' | 'order'>('booking');

  const handleSelectTable = (table: Table) => {
    setSelectedTable(table);
    setIsOrdering(false);
    setCartItems([]);
    setOrderError('');
    setShowBookForm(false);
    setBookEmail('');
    setBookName('');
    setBookPartySize('2');
    setBookDuration('2');
    setBookIsShared(false);
    setBookDate(new Date().toISOString().split('T')[0]);
    setBookTime('12:00');
    setBookError('');
    setBookSuccess('');
    if (table.status === 'occupied') {
      setActiveView('order');
    } else {
      setActiveView('booking');
    }
  };

  const handleCloseDetailModal = () => {
    setSelectedTable(null);
    setIsOrdering(false);
    setCartItems([]);
    setOrderError('');
    setShowBookForm(false);
    setBookEmail('');
    setBookName('');
    setBookPartySize('2');
    setBookDuration('2');
    setBookIsShared(false);
    setBookError('');
    setBookSuccess('');
    setActiveView('booking');
  };

  const handleUpdateStatus = async (status: 'vacant' | 'occupied' | 'reserved') => {
    if (!selectedTable || !selectedTable.id) return;
    try {
      const updatedTable: Table = {
        ...selectedTable,
        status
      };
      await api.updateTable(selectedTable.id, updatedTable);
      await loadData();
    } catch (err) {
      console.error('Error updating table status:', err);
    }
  };

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(newTableNum);
    const cap = parseInt(newTableCap);
    if (isNaN(num) || isNaN(cap)) return;

    setAddTableError('');
    try {
      await api.createTable({
        table_number: num,
        capacity: cap,
        number_of_guests: cap,
        seats_reserved: 0,
        status: 'vacant'
      });
      setShowAddModal(false);
      setNewTableNum('');
      loadData();
    } catch (err: any) {
      console.error('Error creating table:', err);
      setAddTableError(err.message || 'Failed to create table. Table number might already exist.');
    }
  };

  // Cart operations
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

  const [orderError, setOrderError] = useState('');

  // Staff Direct Booking state
  const [showBookForm, setShowBookForm] = useState(false);
  const [bookEmail, setBookEmail] = useState('');
  const [bookName, setBookName] = useState('');
  const [bookPartySize, setBookPartySize] = useState('2');
  const [bookDate, setBookDate] = useState(() => getLocalDateString());
  const [bookTime, setBookTime] = useState('12:00');
  const [bookDuration, setBookDuration] = useState('2');
  const [bookIsShared, setBookIsShared] = useState(false);
  const [bookError, setBookError] = useState('');
  const [bookSuccess, setBookSuccess] = useState('');

  // Helper to determine if shared bookings exist and seats are left
  const currentTableBookings = selectedTable ? bookings.filter(b => b.table_id === selectedTable.id && (b.status === 'pending' || b.status === 'checked_in')) : [];
  const hasSharedBooking = currentTableBookings.some(b => b.is_shared);
  const isSharedAndNotFull = selectedTable ? (hasSharedBooking && (selectedTable.seats_reserved || 0) < selectedTable.number_of_guests) : false;

  const showBookingTab = selectedTable ? (selectedTable.status === 'vacant' || selectedTable.status === 'reserved' || (selectedTable.status === 'occupied' && isSharedAndNotFull)) : false;
  const showOrderTab = selectedTable ? (selectedTable.status === 'occupied') : false;

  useEffect(() => {
    if (!selectedTable) return;

    if (activeView === 'booking' && !showBookingTab && showOrderTab) {
      setActiveView('order');
    } else if (activeView === 'order' && !showOrderTab && showBookingTab) {
      setActiveView('booking');
    }
  }, [selectedTable?.status, bookings, activeView, showBookingTab, showOrderTab]);

  const getSelectableTimeOptions = (selectedDateStr: string) => {
    const allSlots = Array.from({ length: 25 }).map((_, i) => {
      const hour = 10 + Math.floor(i / 2);
      const min = i % 2 === 0 ? '00' : '30';
      const timeStr = `${hour.toString().padStart(2, '0')}:${min}`;
      const displayHour = hour > 12 ? hour - 12 : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      return {
        value: timeStr,
        label: `${displayHour}:${min} ${ampm}`,
        hour,
        min: parseInt(min)
      };
    });

    const todayStr = getLocalDateString();
    if (selectedDateStr !== todayStr) {
      return allSlots;
    }

    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();

    let nextHour = currentHour;
    let nextMin = 0;
    if (currentMin > 30) {
      nextHour += 1;
      nextMin = 0;
    } else if (currentMin > 0) {
      nextMin = 30;
    }

    return allSlots.filter(slot => {
      return slot.hour > nextHour || (slot.hour === nextHour && slot.min >= nextMin);
    });
  };

  // Auto-correct time selection if it becomes invalid (e.g. date changed to today)
  useEffect(() => {
    const options = getSelectableTimeOptions(bookDate);
    if (options.length > 0) {
      const isValid = options.some(opt => opt.value === bookTime);
      if (!isValid) {
        setBookTime(options[0].value);
      }
    } else if (bookDate === getLocalDateString()) {
      setBookError("No booking slots remaining for today. Please select a future date.");
    } else {
      setBookError('');
    }
  }, [bookDate]);

  const handleBookTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || !selectedTable.id) return;
    setBookError('');
    setBookSuccess('');

    const startDateTime = new Date(`${bookDate}T${bookTime}:00`);
    if (startDateTime.getTime() < Date.now() - 60000) { // 1 min grace
      setBookError('Booking time must be in the future.');
      return;
    }
    const endDateTime = new Date(startDateTime.getTime() + parseFloat(bookDuration) * 60 * 60 * 1000);
    const startTimeISO = startDateTime.toISOString();
    const endTimeISO = endDateTime.toISOString();

    try {
      await api.createBooking({
        table_id: selectedTable.id,
        party_size: parseInt(bookPartySize),
        is_shared: bookIsShared,
        comfort_sharing: bookIsShared,
        start_time: startTimeISO,
        end_time: endTimeISO,
        user_email: bookEmail.trim() || undefined,
        user_name: bookName.trim() || undefined
      });
      setBookSuccess('Booking created successfully!');
      // Reset form
      setBookEmail('');
      setBookName('');
      setBookPartySize('2');
      setBookDuration('2');
      setBookIsShared(false);
      setShowBookForm(false);
      await loadData();
    } catch (err: any) {
      console.error('Error creating booking:', err);
      setBookError(err.message || 'Failed to create booking.');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedTable || !selectedTable.id || cartItems.length === 0) return;
    setOrderError('');
    
    try {
      let orderId = '';
      
      if (activeOrder && activeOrder.id) {
        // Appending new items to existing order
        orderId = activeOrder.id;
      } else {
        // Create a new order first
        const orderPayload: Order = {
          table_id: selectedTable.id,
          order_date: new Date().toISOString(),
          status: 'pending'
        };
        const createdOrder = await api.createOrder(orderPayload, []);
        orderId = createdOrder.id || '';
      }

      if (!orderId) {
        throw new Error('Failed to identify or create active order.');
      }

      // Create order items
      for (const item of cartItems) {
        await api.createOrderItem({
          order_id: orderId,
          food_id: item.food.id || '',
          quantity: item.quantity,
          unit_price: item.food.price
        });
      }
      
      // Update table to occupied
      await api.updateTable(selectedTable.id, {
        ...selectedTable,
        status: 'occupied'
      });

      setIsOrdering(false);
      setCartItems([]);
      await loadData();
    } catch (err: any) {
      console.error('Error placing order:', err);
      setOrderError(err.message || 'Failed to place order. Please try again.');
    }
  };

  // Calculate active order for selected table
  const activeOrder = selectedTable
    ? orders.find(o => o.table_id === selectedTable.id && o.status !== 'served' && o.status !== 'cancelled')
    : null;

  const activeOrderTotal = activeOrder
    ? activeOrder.items?.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0) || 0
    : 0;

  const handleCheckout = async () => {
    if (!selectedTable || !selectedTable.id || !activeOrder || !activeOrder.id) return;
    
    try {
      // Create invoice
      await api.createInvoice({
        order_id: activeOrder.id,
        payment_method: 'card',
        payment_status: 'paid',
        total_amount: activeOrderTotal
      });

      // Update order status to served
      await api.updateOrder(activeOrder.id, {
        ...activeOrder,
        status: 'served'
      });

      // Update table to vacant
      await api.updateTable(selectedTable.id, {
        ...selectedTable,
        status: 'vacant'
      });

      await loadData();
      onNavigateToInvoices();
    } catch (err) {
      console.error('Error during checkout:', err);
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
          <button className="btn btn-primary" onClick={() => {
            setAddTableError('');
            setNewTableNum('');
            setNewTableCap('2');
            setShowAddModal(true);
          }}>
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
            
            // Map status to badge style
            let badgeClass = 'badge-vacant';
            if (table.status === 'occupied') badgeClass = 'badge-occupied';
            if (table.status === 'reserved') badgeClass = 'badge-reserved';

            // Find bookings for this table
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
                    <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>
                      Order: ₹{tableActiveOrder.items?.reduce((s, i) => s + (i.quantity * i.unit_price), 0).toFixed(2)}
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
        <div className="modal-overlay" onClick={handleCloseDetailModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '550px', width: '95%', padding: '2.5rem' }}>
            <button className="modal-close" onClick={handleCloseDetailModal}>
              <X size={20} />
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  Table {selectedTable.table_number}
                  <span className={`badge ${selectedTable.status === 'vacant' ? 'badge-vacant' : selectedTable.status === 'occupied' ? 'badge-occupied' : 'badge-reserved'}`}>
                    {selectedTable.status}
                  </span>
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted)', margin: '0.25rem 0 0 0' }}>
                  Max Capacity: {selectedTable.number_of_guests} guests
                </p>
              </div>
            </div>

            {/* Set Table Status Row */}
            <div style={{ marginBottom: '1.5rem' }}>
              <span className="form-label" style={{ fontSize: '0.85rem', display: 'block', marginBottom: '0.5rem' }}>Set Table Status:</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className={`btn ${selectedTable.status === 'vacant' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                  onClick={() => handleUpdateStatus('vacant')}
                >
                  Vacant
                </button>
                <button
                  className={`btn ${selectedTable.status === 'occupied' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                  onClick={() => handleUpdateStatus('occupied')}
                >
                  Occupied
                </button>
                <button
                  className={`btn ${selectedTable.status === 'reserved' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }}
                  onClick={() => handleUpdateStatus('reserved')}
                >
                  Reserve
                </button>
              </div>
            </div>

            {/* Tab Header Buttons */}
            {(showBookingTab || showOrderTab) && (
              <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--surface-border)', marginBottom: '1.5rem', paddingBottom: '0.5rem' }}>
                {showBookingTab && (
                  <button
                    className={`btn ${activeView === 'booking' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                    onClick={() => setActiveView('booking')}
                  >
                    Bookings & Reservations
                  </button>
                )}
                {showOrderTab && (
                  <button
                    className={`btn ${activeView === 'order' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                    onClick={() => setActiveView('order')}
                  >
                    Table Orders
                  </button>
                )}
              </div>
            )}

            {/* Modal Body Container (Single Column) */}
            <div>
              {/* Active View: Booking */}
              {activeView === 'booking' && showBookingTab && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Bookings & Occupancy</h4>
                    {!showBookForm && (selectedTable.status === 'vacant' || selectedTable.status === 'reserved' || (selectedTable.status === 'occupied' && isSharedAndNotFull)) && (
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        onClick={() => {
                          setShowBookForm(true);
                          setBookError('');
                          setBookSuccess('');
                        }}
                      >
                        <Plus size={14} /> Book Table
                      </button>
                    )}
                  </div>

                  {/* Seats reserved text & dots */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Seats Occupied/Reserved:</span>
                    <span style={{ fontWeight: 600 }}>{selectedTable.seats_reserved || 0} / {selectedTable.number_of_guests}</span>
                  </div>

                  <div className="seat-dots" style={{ display: 'flex', gap: '0.375rem' }}>
                    {Array.from({ length: selectedTable.number_of_guests }).map((_, i) => (
                      <div
                        key={i}
                        className={`seat-dot ${i < (selectedTable.seats_reserved || 0) ? 'occupied' : 'available'}`}
                        style={{
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          backgroundColor: i < (selectedTable.seats_reserved || 0) ? 'var(--accent)' : 'var(--bg-active)'
                        }}
                      />
                    ))}
                  </div>

                  {showBookForm ? (
                    <form onSubmit={handleBookTable} style={{ backgroundColor: 'var(--surface)', padding: '1.25rem', borderRadius: '8px', border: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>New Booking / Reservation</span>
                        <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem', border: 'none' }} onClick={() => setShowBookForm(false)}>
                          <X size={14} />
                        </button>
                      </div>

                      {bookError && (
                        <div className="form-error" style={{
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'oklch(0.95 0.05 20)',
                          border: '1px solid oklch(0.85 0.10 20)',
                          borderRadius: '6px',
                          color: 'oklch(0.4 0.15 20)',
                          fontSize: '0.8rem',
                          textAlign: 'center'
                        }}>
                          {bookError}
                        </div>
                      )}

                      {bookSuccess && (
                        <div className="form-success" style={{
                          padding: '0.5rem 0.75rem',
                          backgroundColor: 'oklch(0.95 0.05 140)',
                          border: '1px solid oklch(0.85 0.10 140)',
                          borderRadius: '6px',
                          color: 'oklch(0.4 0.15 140)',
                          fontSize: '0.8rem',
                          textAlign: 'center'
                        }}>
                          {bookSuccess}
                        </div>
                      )}

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Customer Name (Optional)</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="e.g. John Doe"
                          value={bookName}
                          onChange={e => setBookName(e.target.value)}
                          style={{ padding: '0.5rem' }}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Customer Email (Optional)</label>
                        <input
                          type="email"
                          className="form-input"
                          placeholder="customer@example.com"
                          value={bookEmail}
                          onChange={e => setBookEmail(e.target.value)}
                          style={{ padding: '0.5rem' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Party Size</label>
                          <CustomSelect
                            options={Array.from({ length: selectedTable.number_of_guests }, (_, i) => {
                              const size = i + 1;
                              return { value: size.toString(), label: `${size} Guest${size > 1 ? 's' : ''}` };
                            })}
                            value={bookPartySize}
                            onChange={setBookPartySize}
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Duration</label>
                          <CustomSelect
                            options={[
                              { value: '1', label: '1 Hour' },
                              { value: '1.5', label: '1.5 Hours' },
                              { value: '2', label: '2 Hours' },
                              { value: '2.5', label: '2.5 Hours' },
                              { value: '3', label: '3 Hours' },
                              { value: '4', label: '4 Hours' }
                            ]}
                            value={bookDuration}
                            onChange={setBookDuration}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Date</label>
                          <input
                            type="date"
                            className="form-input"
                            value={bookDate}
                            min={getLocalDateString()}
                            onChange={e => setBookDate(e.target.value)}
                            style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem' }}
                            required
                          />
                        </div>

                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <label className="form-label" style={{ fontSize: '0.8rem' }}>Start Time</label>
                          <CustomSelect
                            options={getSelectableTimeOptions(bookDate)}
                            value={bookTime}
                            onChange={setBookTime}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginBottom: 0, marginTop: '0.25rem' }}>
                        <input
                          type="checkbox"
                          id="bookIsSharedModal"
                          checked={bookIsShared}
                          onChange={e => setBookIsShared(e.target.checked)}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <label htmlFor="bookIsSharedModal" style={{ fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', color: 'var(--ink)' }}>
                          Allow sharing seats
                        </label>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button type="button" className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }} onClick={() => setShowBookForm(false)}>
                          Cancel
                        </button>
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}>
                          Create Booking
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      {(() => {
                        const tableBookings = bookings.filter(b => b.table_id === selectedTable.id && (b.status === 'pending' || b.status === 'checked_in'));
                        const pending = tableBookings.filter(b => b.status === 'pending');
                        const checkedIn = tableBookings.filter(b => b.status === 'checked_in');

                        if (tableBookings.length === 0) {
                          return (
                            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', textAlign: 'center', margin: '1rem 0' }}>
                              No active bookings for this table.
                            </p>
                          );
                        }

                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {pending.length > 0 && (
                              <div>
                                <span className="form-label" style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '0.375rem' }}>
                                  Pending Check-in:
                                </span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {pending.map(b => (
                                    <div key={b.id} style={{
                                      padding: '0.75rem',
                                      border: '1px solid var(--surface-border)',
                                      borderRadius: '8px',
                                      backgroundColor: 'var(--bg)',
                                      fontSize: '0.8rem'
                                    }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: '0.25rem' }}>
                                        <span>{b.user_name || b.user_email}</span>
                                        <span>{b.party_size} guests</span>
                                      </div>
                                      {b.start_time && (
                                        <div style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, marginBottom: '0.25rem' }}>
                                          Slot: {new Date(b.start_time).toLocaleDateString()} @ {new Date(b.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(b.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                      )}
                                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.5rem' }}>
                                        {b.is_shared ? 'Shared Seating (comfortable sharing)' : 'Exclusive Table'}
                                      </div>

                                      {b.start_time && (() => {
                                        const start = new Date(b.start_time);
                                        const end = new Date(b.end_time);
                                        
                                        const getMinEntryTime = (booking: typeof b) => {
                                          if (booking.min_entry_time) return new Date(booking.min_entry_time);
                                          const duration = (end.getTime() - start.getTime()) / (60 * 60 * 1000);
                                          let limitMinutes = Math.floor(duration) * 30;
                                          if (limitMinutes < 30) limitMinutes = 30;
                                          return new Date(start.getTime() + limitMinutes * 60 * 1000);
                                        };
                                        
                                        const currentMinEntry = getMinEntryTime(b);
                                        
                                        const getShiftOptions = () => {
                                          const opts: Date[] = [];
                                          let curr = new Date(start.getTime() + 30 * 60 * 1000);
                                          const cutoff = new Date(end.getTime() - 30 * 60 * 1000);
                                          while (curr <= cutoff) {
                                            opts.push(new Date(curr));
                                            curr = new Date(curr.getTime() + 30 * 60 * 1000);
                                          }
                                          return opts;
                                        };
                                        
                                        const options = getShiftOptions();
                                        
                                        return (
                                          <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '0.375rem',
                                            marginTop: '0.375rem',
                                            marginBottom: '0.75rem',
                                            padding: '0.5rem 0.75rem',
                                            backgroundColor: 'var(--bg-active)',
                                            borderRadius: '6px',
                                            border: '1px solid var(--surface-border)'
                                          }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                                              <span style={{ color: 'var(--muted)' }}>No-Show Cutoff:</span>
                                              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
                                                {currentMinEntry.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                              </span>
                                            </div>
                                            {options.length > 1 ? (
                                              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem', width: '100%' }}>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>Shift Cutoff:</span>
                                                <div style={{ flex: 1 }}>
                                                  <CustomSelect
                                                    options={options.map((opt) => ({
                                                      value: opt.toISOString(),
                                                      label: opt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    }))}
                                                    value={currentMinEntry.toISOString()}
                                                    onChange={async (val) => {
                                                      if (b.id) {
                                                        try {
                                                          await api.updateMinEntryTime(b.id, val);
                                                          await loadData();
                                                        } catch (err: any) {
                                                          alert(err.message || 'Failed to shift cutoff time');
                                                        }
                                                      }
                                                    }}
                                                  />
                                                </div>
                                              </div>
                                            ) : (
                                              <span style={{ fontSize: '0.65rem', color: 'var(--muted)', fontStyle: 'italic', display: 'block', textAlign: 'center', marginTop: '0.125rem' }}>
                                                Fixed cutoff (1h slots cannot be shifted)
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })()}
                                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                          className="btn btn-primary"
                                          style={{ flex: 1, padding: '0.375rem', fontSize: '0.75rem' }}
                                          onClick={() => b.id && handleCheckInBooking(b.id)}
                                        >
                                          Verify & Check In
                                        </button>
                                        <button
                                          className="btn btn-secondary"
                                          style={{ padding: '0.375rem 0.5rem', fontSize: '0.75rem', color: 'red' }}
                                          onClick={() => b.id && handleCancelBooking(b.id)}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {checkedIn.length > 0 && (
                              <div>
                                <span className="form-label" style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'block', marginBottom: '0.375rem' }}>
                                  Checked In:
                                </span>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                  {checkedIn.map(b => (
                                    <div key={b.id} style={{
                                      padding: '0.5rem 0.75rem',
                                      border: '1px solid var(--surface-border)',
                                      borderRadius: '6px',
                                      backgroundColor: 'var(--bg-active)',
                                      fontSize: '0.8rem',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center'
                                    }}>
                                      <div>
                                        <span style={{ fontWeight: 600, display: 'block' }}>{b.user_name || b.user_email}</span>
                                        {b.start_time && (
                                          <span style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600, display: 'block' }}>
                                            Slot: {new Date(b.start_time).toLocaleDateString()} @ {new Date(b.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(b.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                          </span>
                                        )}
                                        <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>
                                          {b.is_shared ? 'Shared Seating' : 'Exclusive Table'}
                                        </span>
                                      </div>
                                      <span style={{ fontWeight: 600 }}>{b.party_size} guests</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Active View: Order */}
              {activeView === 'order' && showOrderTab && (
                <div>
                  {isOrdering ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                          {activeOrder ? 'Add Items to Order' : 'New Table Order'}
                        </span>
                        <button className="btn btn-secondary" style={{ padding: '0.25rem', border: 'none' }} onClick={() => setIsOrdering(false)}>
                          <X size={14} />
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
                          marginBottom: '1rem',
                          textAlign: 'center'
                        }}>
                          {orderError}
                        </div>
                      )}

                      {/* Selector */}
                      <div className="form-group">
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

                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
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
                        <button className="btn btn-secondary" style={{ height: '38px' }} onClick={handleAddToCart}>
                          Add
                        </button>
                      </div>

                      {/* Cart Summary */}
                      {cartItems.length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                          <span className="form-label" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.5rem' }}>Cart:</span>
                          <div style={{
                            maxHeight: '120px',
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

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ flex: 1 }}
                          onClick={() => setIsOrdering(false)}
                        >
                          Cancel
                        </button>
                        <button 
                          className="btn btn-accent" 
                          style={{ flex: 1 }}
                          disabled={cartItems.length === 0}
                          onClick={handlePlaceOrder}
                        >
                          Submit Order
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {activeOrder ? (
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Active Order</span>
                            <span className={`badge badge-${activeOrder.status}`}>{activeOrder.status}</span>
                          </div>
                          
                          {/* Active Order Items Summary */}
                          <div style={{
                            maxHeight: '180px',
                            overflowY: 'auto',
                            padding: '0.5rem',
                            border: '1px solid var(--surface-border)',
                            borderRadius: '6px',
                            backgroundColor: 'var(--bg)',
                            marginBottom: '1rem'
                          }}>
                            {activeOrder.items?.map(item => {
                              const food = foods.find(f => f.id === item.food_id);
                              return (
                                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', paddingBottom: '0.25rem' }}>
                                  <span>{food?.name} x {item.quantity}</span>
                                  <span style={{ fontFamily: 'var(--font-mono)' }}>₹{(item.quantity * item.unit_price).toFixed(2)}</span>
                                </div>
                              );
                            })}
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '1.5rem' }}>
                            <span>Total:</span>
                            <span style={{ fontFamily: 'var(--font-mono)' }}>₹{activeOrderTotal.toFixed(2)}</span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => { setOrderError(''); setIsOrdering(true); }}>
                              <Plus size={16} /> Add Items to Order
                            </button>
                            <button className="btn btn-accent" style={{ width: '100%' }} onClick={handleCheckout}>
                              <Receipt size={16} /> Process Payment & Checkout
                            </button>
                            <button className="btn btn-secondary" style={{ width: '100%' }} onClick={onNavigateToOrders}>
                              <FileText size={16} /> Open Order board
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '1rem' }}>
                          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', textAlign: 'center', margin: 0 }}>
                            No active orders on this table.
                          </p>
                          {/* Table order can only be placed if vacant */}
                          {selectedTable.status === 'vacant' && (
                            <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setIsOrdering(true)}>
                              <Plus size={16} /> Place Table Order
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}      {/* Add Table Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAddModal(false)}>
              <X size={20} />
            </button>
             <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', letterSpacing: '-0.02em' }}>
              Add Restaurant Table
            </h3>

            {addTableError && (
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
                {addTableError}
              </div>
            )}

            <form onSubmit={handleAddTable}>
              <div className="form-group">
                <label className="form-label">Table Number</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 7"
                  value={newTableNum}
                  onChange={e => setNewTableNum(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Guest Seating Capacity</label>
                <CustomSelect
                  options={[
                    { value: '2', label: '2 Guests' },
                    { value: '4', label: '4 Guests' },
                    { value: '6', label: '6 Guests' },
                    { value: '8', label: '8 Guests' },
                    { value: '12', label: '12 Guests' }
                  ]}
                  value={newTableCap}
                  onChange={setNewTableCap}
                  placeholder="Select capacity"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
