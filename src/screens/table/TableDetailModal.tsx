import React, { useState } from 'react';
import { Plus, Receipt, FileText, X, Check } from '@phosphor-icons/react';
import type { Table, Booking, Food, Order } from '../../services/types';
import { useOrderItemsQuery, useFoodsQuery, useInvoicesQuery } from '../../services';
import { CustomSelect } from '../../components/CustomSelect';
import { BookingForm } from './BookingForm';
import { OrderForm } from './OrderForm';

interface TableDetailModalProps {
  selectedTable: Table;
  bookings: Booking[];
  orders: Order[];
  onClose: () => void;
  onUpdateStatus: (status: 'vacant' | 'occupied' | 'reserved') => Promise<void>;
  onCheckInBooking: (bookingId: string) => Promise<void>;
  onCancelBooking: (bookingId: string) => Promise<void>;
  onShiftCutoff: (bookingId: string, val: string) => Promise<void>;
  onCreateBooking: (bookingData: any) => Promise<void>;
  onCreateOrder: (cartItems: { food: Food; quantity: number }[]) => Promise<void>;
  onCheckout: () => Promise<void>;
  onConfirmCashPayment: () => Promise<void>;
  onNavigateToOrders: () => void;
}

export const TableDetailModal: React.FC<TableDetailModalProps> = ({
  selectedTable,
  bookings,
  orders,
  onClose,
  onUpdateStatus,
  onCheckInBooking,
  onCancelBooking,
  onShiftCutoff,
  onCreateBooking,
  onCreateOrder,
  onCheckout,
  onConfirmCashPayment,
  onNavigateToOrders
}) => {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [activeView, setActiveView] = useState<'booking' | 'order'>(() => {
    return selectedTable.status === 'occupied' ? 'order' : 'booking';
  });
  const [showBookForm, setShowBookForm] = useState(false);
  const [isOrdering, setIsOrdering] = useState(false);

  // Fetch foods list only when details modal is open
  const { data: foods = [] } = useFoodsQuery();
  const { data: invoices = [] } = useInvoicesQuery();

  // Helper to determine if shared bookings exist and seats are left
  const currentTableBookings = bookings.filter(b => b.table_id === selectedTable.id && (b.status === 'pending' || b.status === 'checked_in'));
  const hasSharedBooking = currentTableBookings.some(b => b.is_shared);
  const isSharedAndNotFull = (hasSharedBooking && (selectedTable.seats_reserved || 0) < selectedTable.number_of_guests);

  const activeOrder = orders.find(o => o.table_id === selectedTable.id && o.status !== 'completed' && o.status !== 'cancelled');
  
  // Dynamically query items for the active order of this table
  const { data: orderItems = [] } = useOrderItemsQuery(activeOrder?.id || '');
  
  const activeOrderTotal = orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  const pendingCashRequest = invoices.find(
    inv => inv.order_id === activeOrder?.id && inv.payment_method === 'cash' && inv.payment_status === 'pending'
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '820px', maxHeight: '85vh', minHeight: 'min(600px, 80vh)', width: '95%', padding: '2.5rem', display: 'flex', flexDirection: 'column' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {/* Left Side: Title, Status Dropdown, Capacity */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.375rem' }}>
              <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
                Table {selectedTable.table_number}
              </h3>
              
              {/* Status Dropdown */}
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {showStatusDropdown && (
                  <div 
                    style={{ position: 'fixed', inset: 0, zIndex: 190, background: 'transparent' }} 
                    onClick={() => setShowStatusDropdown(false)} 
                  />
                )}
                <button
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className={`badge ${selectedTable.status === 'vacant' ? 'badge-vacant' : selectedTable.status === 'occupied' ? 'badge-occupied' : 'badge-reserved'}`}
                  style={{
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    background: 'none',
                    padding: '0.375rem 0.75rem',
                    fontSize: '0.8rem',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 600,
                    textTransform: 'lowercase',
                    transition: 'all 0.2s var(--ease-out)',
                    zIndex: 200,
                    position: 'relative'
                  }}
                >
                  <span>{selectedTable.status === 'occupied' && isSharedAndNotFull ? 'occupied (sharable)' : selectedTable.status}</span>
                  <span style={{ fontSize: '0.55rem', opacity: 0.7 }}>▼</span>
                </button>
                {showStatusDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      marginTop: '6px',
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--surface-border)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                      zIndex: 200,
                      minWidth: '130px',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden'
                    }}
                  >
                    {['vacant', 'occupied', 'reserved'].map(status => (
                      <button
                        key={status}
                        onClick={async () => {
                          await onUpdateStatus(status as any);
                          setShowStatusDropdown(false);
                        }}
                        style={{
                          padding: '0.625rem 1rem',
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          color: 'var(--ink)',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          width: '100%',
                          fontWeight: selectedTable.status === status ? 700 : 500,
                          backgroundColor: selectedTable.status === status ? 'var(--bg-active)' : 'transparent',
                          transition: 'background-color 150ms var(--ease-out)'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--surface-hover)'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = selectedTable.status === status ? 'var(--bg-active)' : 'transparent'}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Capacity & Dots */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
              <span>Max Capacity: {selectedTable.number_of_guests} guests</span>
              <div className="seat-dots" style={{ display: 'flex', gap: '0.375rem' }}>
                {Array.from({ length: selectedTable.number_of_guests }).map((_, i) => (
                  <div
                    key={i}
                    className={`seat-dot ${i < (selectedTable.seats_reserved || 0) ? 'occupied' : 'available'}`}
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: i < (selectedTable.seats_reserved || 0) ? 'var(--accent)' : 'var(--surface-border)'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Side Actions & Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {activeView === 'booking' && !showBookForm && (
                <button
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem', borderRadius: '8px' }}
                  onClick={() => {
                    setShowBookForm(true);
                  }}
                >
                  + Book Table
                </button>
              )}
              {activeView === 'order' && !isOrdering && !activeOrder && (
                <button
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.375rem', borderRadius: '8px' }}
                  onClick={() => {
                    setIsOrdering(true);
                  }}
                >
                  + Place New Order
                </button>
              )}
            </div>

            <button 
              onClick={onClose} 
              style={{
                border: 'none',
                background: 'none',
                color: 'var(--muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.25rem',
                transition: 'color 150ms var(--ease-out)'
              }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Divider line */}
        <hr style={{ border: 'none', borderTop: '1px solid var(--surface-border)', margin: '1.25rem 0 1.5rem 0' }} />

        {/* Workspace Box */}
        <div style={{
          border: '1px solid var(--surface-border)',
          borderRadius: '16px',
          padding: showBookForm || isOrdering ? '1.5rem 2rem' : '2rem',
          backgroundColor: 'var(--surface)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflowY: showBookForm || isOrdering ? 'visible' : 'hidden'
        }}>
          {/* View Selector Dropdown */}
          {!showBookForm && !isOrdering && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ width: '220px' }}>
                <CustomSelect
                  options={[
                    { value: 'booking', label: 'Bookings & Occupancy' },
                    { value: 'order', label: 'Foods and Orders' }
                  ]}
                  value={activeView}
                  onChange={(val) => {
                    setActiveView(val as 'booking' | 'order');
                  }}
                />
              </div>
            </div>
          )}

          {activeView === 'booking' && (
            showBookForm ? (
              <BookingForm
                selectedTable={selectedTable}
                onCancel={() => setShowBookForm(false)}
                onSubmit={async (data) => {
                  await onCreateBooking(data);
                  setShowBookForm(false);
                }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, minHeight: 0 }}>
                <div style={{ overflowY: 'auto', flex: 1, paddingRight: '0.5rem' }}>
                  {(() => {
                    const pending = currentTableBookings.filter(b => b.status === 'pending');
                    const checkedIn = currentTableBookings.filter(b => b.status === 'checked_in');

                    if (currentTableBookings.length === 0) {
                      return (
                        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', color: 'var(--muted)' }}>
                          <p style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>No Activity</p>
                          <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '0.25rem 0 0 0' }}>No active bookings for this table.</p>
                        </div>
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
                                                    await onShiftCutoff(b.id, val);
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
                                      onClick={() => b.id && onCheckInBooking(b.id)}
                                    >
                                      Verify & Check In
                                    </button>
                                    <button
                                      className="btn btn-secondary"
                                      style={{ padding: '0.375rem 0.5rem', fontSize: '0.75rem', color: 'red' }}
                                      onClick={() => b.id && onCancelBooking(b.id)}
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
              </div>
            )
          )}

          {activeView === 'order' && (
            isOrdering ? (
              <OrderForm
                foods={foods}
                activeOrderExists={!!activeOrder}
                onCancel={() => setIsOrdering(false)}
                onSubmit={async (items) => {
                  await onCreateOrder(items);
                  setIsOrdering(false);
                }}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, minHeight: 0 }}>
                {activeOrder ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Active Order</span>
                      <span className={`badge badge-${activeOrder.status}`}>{activeOrder.status}</span>
                    </div>
                    
                    {/* Warning if empty */}
                    {orderItems.length === 0 && (
                      <div style={{
                        padding: '0.75rem',
                        backgroundColor: 'oklch(0.95 0.05 20)',
                        border: '1px solid oklch(0.85 0.10 20)',
                        borderRadius: '8px',
                        color: 'oklch(0.4 0.15 20)',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        textAlign: 'center',
                        marginBottom: '1rem'
                      }}>
                        ⚠️ Warning: This order has no items. Add items before processing checkout.
                      </div>
                    )}

                    {/* Active Order Items Summary */}
                    {orderItems.length > 0 && (
                      <div style={{
                        maxHeight: '280px',
                        overflowY: 'auto',
                        padding: '0.5rem',
                        border: '1px solid var(--surface-border)',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg)',
                        marginBottom: '1rem'
                      }}>
                        {orderItems.map(item => {
                          const food = foods.find(f => f.id === item.food_id);
                          return (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', paddingBottom: '0.25rem' }}>
                              <span>{food?.name} x {item.quantity}</span>
                                      <span style={{ fontFamily: 'var(--font-mono)' }}>₹{(item.quantity * item.unit_price).toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {pendingCashRequest && (
                        <div style={{
                          padding: '0.75rem 1rem',
                          backgroundColor: 'oklch(0.95 0.05 45)',
                          border: '1px solid oklch(0.85 0.1 45)',
                          borderRadius: '8px',
                          color: 'oklch(0.40 0.12 45)',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          marginBottom: '1rem',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.25rem'
                        }}>
                          <span>⚠️ Table T-{selectedTable.table_number} requested Cash Payment!</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Please collect: ₹{activeOrderTotal.toFixed(2)}</span>
                        </div>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '1.5rem' }}>
                        <span>Total:</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>₹{activeOrderTotal.toFixed(2)}</span>
                      </div>
 
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setIsOrdering(true)}>
                          <Plus size={16} /> Add Items to Order
                        </button>
                        <button 
                          className="btn btn-accent" 
                          style={{ width: '100%' }} 
                          onClick={onCheckout}
                          disabled={orderItems.length === 0}
                          title={orderItems.length === 0 ? "Cannot checkout an empty order" : ""}
                        >
                          <Receipt size={16} /> Process Razorpay & Checkout
                        </button>
                        <button 
                          className="btn" 
                          style={{ width: '100%', backgroundColor: 'oklch(0.60 0.15 140)', borderColor: 'oklch(0.60 0.15 140)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }} 
                          onClick={onConfirmCashPayment}
                          disabled={orderItems.length === 0}
                          title={orderItems.length === 0 ? "Cannot checkout an empty order" : ""}
                        >
                          <Check size={16} /> Confirm Cash & Checkout
                        </button>
                        <button className="btn btn-secondary" style={{ width: '100%' }} onClick={onNavigateToOrders}>
                          <FileText size={16} /> Open Order board
                        </button>
                      </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', color: 'var(--muted)', gap: '1rem' }}>
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0 }}>No Activity</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: '0.25rem 0 0 0' }}>No active orders on this table.</p>
                    </div>
                    <button className="btn btn-primary" onClick={() => setIsOrdering(true)}>
                      <Plus size={16} /> Place New Order
                    </button>
                  </div>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
