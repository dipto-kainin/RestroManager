import React, { useState } from 'react';
import { 
  useFoodsQuery, 
  useBookingsQuery, 
  useOrdersQuery, 
  useOrderItemsQuery, 
  usePlaceOrderMutation, 
  getCurrentUser, 
  useTablesQuery,
  useInvoicesQuery,
  createRazorpayOrder,
  verifyRazorpayPayment,
  requestCashPayment,
  type Food
} from '../../services';
import { ForkKnife, ShoppingCart, Plus, Receipt, Trash, Coins } from '@phosphor-icons/react';
import { loadRazorpayScript } from '../../utils/razorpay';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../context/ToastContext';

export const CustomerMenuScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();
  const { showToast } = useToast();
  const [cart, setCart] = useState<{ food: Food; quantity: number }[]>([]);

  // Queries
  const { data: foods = [] } = useFoodsQuery();
  const { data: bookings = [] } = useBookingsQuery();
  const { data: orders = [] } = useOrdersQuery();
  const { data: tables = [] } = useTablesQuery();
  const { data: invoices = [] } = useInvoicesQuery();

  // Find active check-in for this user
  const activeBooking = bookings.find(
    b => b.user_email === currentUser?.email && b.status === 'checked_in'
  );

  const table = tables.find(t => t.id === activeBooking?.table_id);

  // Active placed order for this table
  const activeOrder = orders.find(
    o => o.table_id === activeBooking?.table_id && o.status !== 'completed' && o.status !== 'cancelled'
  );

  // Placed items query
  const { data: activeOrderItems = [] } = useOrderItemsQuery(activeOrder?.id || '');
  const activeOrderTotal = activeOrderItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  const pendingCashRequest = invoices.find(
    inv => inv.order_id === activeOrder?.id && inv.payment_method === 'cash' && inv.payment_status === 'pending'
  );

  // Mutation
  const placeOrderMutation = usePlaceOrderMutation();

  const handleAddToCart = (food: Food) => {
    const existingIdx = cart.findIndex(item => item.food.id === food.id);
    if (existingIdx !== -1) {
      const updated = [...cart];
      updated[existingIdx].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { food, quantity: 1 }]);
    }
  };

  const handleRemoveFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const handlePlaceOrder = async () => {
    if (!activeBooking || cart.length === 0) return;
    try {
      await placeOrderMutation.mutateAsync({
        tableId: activeBooking.table_id,
        cartItems: cart
      });
      setCart([]);
      showToast("Order placed successfully! The kitchen is preparing your meal.", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to place order", "error");
    }
  };

  const handleCashPaymentRequest = async () => {
    if (!activeOrder || !activeOrder.id) return;
    const confirm = window.confirm("Request to pay via Cash? The waiter will collect cash at your table.");
    if (!confirm) return;
    try {
      await requestCashPayment(activeOrder.id);
      showToast("Cash payment requested! A staff member will visit your table shortly.", "success");
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    } catch (err: any) {
      showToast(err.message || "Failed to request cash payment.", "error");
    }
  };

  const handlePayment = async () => {
    if (!activeOrder || !activeOrder.id || !activeBooking) return;

    // Load Razorpay Script
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      showToast("Failed to load payment gateway. Please check your network connection.", "error");
      return;
    }

    try {
      const rpOrder = await createRazorpayOrder(activeOrder.id);

      const options = {
        key: rpOrder.key,
        amount: rpOrder.amount,
        currency: rpOrder.currency,
        name: "Bistro Restaurant Chain",
        description: `Checkout Table T-${table?.table_number || '?'}`,
        order_id: rpOrder.id,
        handler: async (response: any) => {
          try {
            await verifyRazorpayPayment({
              order_id: activeOrder.id!,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            showToast("Payment verified! Thank you for dining with us.", "success");
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });
            queryClient.invalidateQueries({ queryKey: ['tables'] });
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
          } catch (err: any) {
            showToast(err.message || "Signature verification failed.", "error");
          }
        },
        prefill: {
          name: currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : "",
          email: currentUser?.email || "",
          contact: currentUser?.phone || "",
        },
        theme: {
          color: "#E28B00",
        },
      };

      const rz = new window.Razorpay(options);
      rz.open();
    } catch (err: any) {
      showToast(err.message || "Could not initialize checkout payment.", "error");
    }
  };

  return (
    <div>
      <h2 className="booking-step-title">Our Menu</h2>
      {activeBooking ? (
        <p className="booking-step-desc" style={{ marginBottom: '2rem' }}>
          You are checked-in to <strong>Table T-{table?.table_number || '?'}</strong>. Add dishes to your cart below.
        </p>
      ) : (
        <p className="booking-step-desc" style={{ marginBottom: '2rem' }}>Browse our dishes. You can order food after checking in.</p>
      )}

      <div style={{ display: 'flex', gap: '2rem', flexDirection: activeBooking ? 'row' : 'column', alignItems: 'flex-start' }}>
        {/* Menu List */}
        <div style={{ flex: activeBooking ? 2 : 1, width: '100%' }}>
          <div className="food-grid" style={{ gridTemplateColumns: activeBooking ? 'repeat(auto-fill, minmax(200px, 1fr))' : 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {foods.map(food => (
              <div key={food.id} className="food-card">
                {food.image ? (
                  <img
                    src={food.image}
                    alt={food.name}
                    style={{ width: '100%', height: 180, objectFit: 'cover' }}
                  />
                ) : (
                  <div className="food-image-placeholder">
                    <ForkKnife size={32} />
                  </div>
                )}
                <div className="food-card-body">
                  <h3 className="food-card-title">{food.name}</h3>
                  {food.description && <p className="food-card-desc">{food.description}</p>}
                  <div className="food-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                    <span className="food-card-price">₹{food.price.toFixed(2)}</span>
                    {activeBooking && (
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', borderRadius: '6px' }}
                        onClick={() => handleAddToCart(food)}
                      >
                        <Plus size={12} weight="bold" /> Add
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {foods.length === 0 && (
              <div className="booking-empty" style={{ gridColumn: '1 / -1' }}>
                <ForkKnife size={40} />
                <p style={{ fontWeight: 600 }}>Menu coming soon</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Cart & Running Order */}
        {activeBooking && (
          <div style={{
            flex: 1,
            width: '100%',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--surface-border)',
            borderRadius: '12px',
            padding: '1.5rem',
            position: 'sticky',
            top: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.75rem', margin: 0 }}>
              Table T-{table?.table_number || '?'} Order Panel
            </h3>

            {/* Cart Section */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--muted)', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <ShoppingCart size={16} /> Shopping Cart
              </h4>
              
              {cart.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>Cart is empty.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {cart.map((item, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 500 }}>{item.food.name} <strong style={{ color: 'var(--accent)' }}>x{item.quantity}</strong></span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>₹{(item.food.price * item.quantity).toFixed(2)}</span>
                          <button
                            onClick={() => handleRemoveFromCart(idx)}
                            style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer', padding: 0, display: 'flex' }}
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
                    onClick={handlePlaceOrder}
                    disabled={placeOrderMutation.isPending}
                  >
                    {placeOrderMutation.isPending ? 'Placing Order...' : 'Send to Kitchen'}
                  </button>
                </div>
              )}
            </div>

            {/* Active Running Order Section */}
            <div style={{ borderTop: '1px solid var(--surface-border)', paddingTop: '1.25rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--muted)', margin: '0 0 0.75rem 0', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <Receipt size={16} /> Current Bill
              </h4>

              {!activeOrder ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)', fontStyle: 'italic', margin: 0 }}>No active orders placed yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Status:</span>
                    <span className={`badge badge-${activeOrder.status}`} style={{ fontSize: '0.75rem' }}>{activeOrder.status}</span>
                  </div>

                  <div style={{
                    maxHeight: '180px',
                    overflowY: 'auto',
                    border: '1px solid var(--surface-border)',
                    borderRadius: '8px',
                    padding: '0.5rem',
                    backgroundColor: 'var(--bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.375rem'
                  }}>
                    {activeOrderItems.map(item => {
                      const food = foods.find(f => f.id === item.food_id);
                      return (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                          <span>{food?.name} x {item.quantity}</span>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>₹{(item.quantity * item.unit_price).toFixed(2)}</span>
                        </div>
                      );
                    })}
                    {activeOrderItems.length === 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontStyle: 'italic', textAlign: 'center' }}>Preparing order...</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.9rem' }}>
                    <span>Total Amount:</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>₹{activeOrderTotal.toFixed(2)}</span>
                  </div>

                  {pendingCashRequest ? (
                    <div style={{
                      padding: '1rem',
                      backgroundColor: 'oklch(0.95 0.05 80)',
                      border: '1px solid oklch(0.85 0.1 80)',
                      borderRadius: '8px',
                      color: 'oklch(0.40 0.12 80)',
                      textAlign: 'center',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      marginTop: '0.5rem'
                    }}>
                      🔔 Cash payment requested. A waiter is on the way to collect ₹{activeOrderTotal.toFixed(2)}.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                      <button
                        className="btn btn-accent"
                        style={{ width: '100%' }}
                        onClick={handlePayment}
                        disabled={activeOrderItems.length === 0}
                      >
                        <Receipt size={16} /> Pay Bill & Checkout
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem', borderColor: 'var(--surface-border)' }}
                        onClick={handleCashPaymentRequest}
                        disabled={activeOrderItems.length === 0}
                      >
                        <Coins size={16} /> Pay via Cash
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
