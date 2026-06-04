import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTablesQuery, useOrdersWithActiveItemsQuery, useInvoicesQuery, useFoodsQuery } from '../../services';
import { ChartPieSlice, ClipboardText, CurrencyInr, ForkKnife, Plus, ArrowUpRight, Receipt, SealCheck } from '@phosphor-icons/react';

export const DashboardScreen: React.FC = () => {
  const navigate = useNavigate();

  const { data: tables = [], isLoading: loadingTables } = useTablesQuery();
  const { data: orders = [], isLoading: loadingOrders } = useOrdersWithActiveItemsQuery();
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoicesQuery();
  const { data: foods = [], isLoading: loadingFoods } = useFoodsQuery();

  const loading = loadingTables || loadingOrders || loadingInvoices || loadingFoods;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <p style={{ color: 'var(--muted)', fontWeight: 600 }}>Loading dashboard analytics...</p>
      </div>
    );
  }

  // Calculate statistics
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;
  const occupancyRate = tables.length ? Math.round((occupiedTables / tables.length) * 100) : 0;
  
  const activeOrders = orders.filter(o => o.status !== 'served' && o.status !== 'cancelled').length;
  
  const totalRevenue = invoices
    .filter(inv => inv.payment_status === 'paid')
    .reduce((sum, inv) => sum + inv.total_amount, 0);

  const recentInvoices = [...invoices].reverse().slice(0, 5);
  const activeOrderList = orders
    .filter(o => o.status !== 'served' && o.status !== 'cancelled')
    .slice(0, 4);

  return (
    <div>
      <div className="view-header">
        <div>
          <h2 className="view-title">Citrus Bistro Overview</h2>
          <p className="view-subtitle">Real-time floor statistics, pending service orders, and billing overview.</p>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--primary)' }}>
            <ChartPieSlice size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{occupancyRate}%</span>
            <span className="stat-label">Table Occupancy ({occupiedTables}/{tables.length})</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'oklch(0.95 0.03 45)', color: 'var(--accent)' }}>
            <ClipboardText size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{activeOrders}</span>
            <span className="stat-label">Active Orders</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'oklch(0.96 0.02 140)', color: 'oklch(0.40 0.12 140)' }}>
            <CurrencyInr size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">₹{totalRevenue.toFixed(2)}</span>
            <span className="stat-label">Total Revenue</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'oklch(0.95 0.02 185)', color: 'var(--status-vacant)' }}>
            <ForkKnife size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">{foods.length}</span>
            <span className="stat-label">Active Menu Items</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginTop: '2.5rem' }}>
        {/* Main Panel: Active Orders & Operations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <div className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Live Order Queue</h3>
              <button className="btn btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => navigate('/orders')}>
                Manage Board <ArrowUpRight size={14} />
              </button>
            </div>

            {activeOrderList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)' }}>
                <SealCheck size={48} style={{ color: 'var(--status-ready)', marginBottom: '1rem', display: 'block', marginInline: 'auto' }} />
                <p style={{ fontWeight: 600, margin: 0 }}>All orders have been served!</p>
                <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Use the Floor Map to place a new order.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {activeOrderList.map(order => {
                  const table = tables.find(t => t.id === order.table_id);
                  const total = order.items?.reduce((s, i) => s + (i.quantity * i.unit_price), 0) || 0;
                  return (
                    <div key={order.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid var(--surface-border)',
                      backgroundColor: 'var(--bg)'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Order #{order.id?.slice(-4).toUpperCase()}</span>
                          <span className={`badge badge-${order.status}`}>{order.status}</span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                          Table {table?.table_number || 'N/A'} &bull; {order.items?.length || 0} items
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>₹{total.toFixed(2)}</span>
                        <button className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }} onClick={() => navigate('/orders')}>
                          View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="card" style={{ padding: '2rem' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontSize: '1.25rem', fontWeight: 700 }}>Quick Actions</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <button className="btn btn-primary" onClick={() => navigate('/tables')}>
                <Plus size={16} /> Open Table Order
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/menu')}>
                <Plus size={16} /> Manage Menu
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/invoices')}>
                <Plus size={16} /> Review Invoices
              </button>
            </div>
          </div>
        </div>

        {/* Right Side Panel: Recent Invoices */}
        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Recent Bills</h3>
            <Receipt size={20} style={{ color: 'var(--muted)' }} />
          </div>

          {recentInvoices.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--muted)', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{ fontWeight: 600, margin: 0 }}>No invoices generated yet</p>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Paid bills will populate here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1 }}>
              {recentInvoices.map(inv => (
                <div key={inv.id} style={{
                  paddingBottom: '1rem',
                  borderBottom: '1px solid var(--surface-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block' }}>Bill #{inv.id?.slice(-4).toUpperCase()}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      Paid via {inv.payment_method.toUpperCase()}
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'oklch(0.40 0.12 140)' }}>
                    +₹{inv.total_amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
