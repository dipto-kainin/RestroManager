import React, { useState } from 'react';
import { 
  useInvoicesQuery,
  useOrdersQuery,
  useTablesQuery,
  useFoodsQuery,
  type Invoice 
} from '../../services';
import { Receipt, CreditCard, Bank, Money, Eye, SealCheck } from '@phosphor-icons/react';
import { ReceiptPanel } from './ReceiptPanel';

export const InvoiceScreen: React.FC = () => {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // Queries
  const { data: invoices = [], isLoading: loadingInvoices } = useInvoicesQuery();
  const { data: orders = [], isLoading: loadingOrders } = useOrdersQuery();
  const { data: tables = [], isLoading: loadingTables } = useTablesQuery();
  const { data: foods = [], isLoading: loadingFoods } = useFoodsQuery();

  const loading = loadingInvoices || loadingOrders || loadingTables || loadingFoods;

  // Selected invoice and linked order resolution
  const selectedInvoice = selectedInvoiceId ? invoices.find(i => i.id === selectedInvoiceId) || null : null;
  const selectedInvoiceOrder = selectedInvoice ? orders.find(o => o.id === selectedInvoice.order_id) || null : null;

  const handleViewDetails = (invoice: Invoice) => {
    setSelectedInvoiceId(invoice.id || null);
  };

  if (loading && invoices.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <p style={{ color: 'var(--muted)', fontWeight: 600 }}>Loading invoices history...</p>
      </div>
    );
  }

  // Calculate invoice statistics
  const totalSales = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const cardSales = invoices.filter(inv => inv.payment_method === 'card').reduce((sum, inv) => sum + inv.total_amount, 0);
  const cashSales = invoices.filter(inv => inv.payment_method === 'cash').reduce((sum, inv) => sum + inv.total_amount, 0);
  const upiSales = invoices.filter(inv => inv.payment_method === 'upi').reduce((sum, inv) => sum + inv.total_amount, 0);

  const getMethodIcon = (method: Invoice['payment_method']) => {
    switch (method) {
      case 'card': return <CreditCard size={18} />;
      case 'cash': return <Money size={18} />;
      case 'upi': return <Bank size={18} />;
    }
  };

  return (
    <div>
      <div className="view-header">
        <div>
          <h2 className="view-title">Billing & Receipts</h2>
          <p className="view-subtitle">Review ledger statements, view printable guest checks, and analyze payment channel splits.</p>
        </div>
      </div>

      {/* Invoice summary cards */}
      <div className="stats-grid" style={{ marginBottom: '2.5rem' }}>
        <div className="stat-card" style={{ borderLeft: '3px solid var(--primary)' }}>
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'var(--primary)' }}>
            <Receipt size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">₹{totalSales.toFixed(2)}</span>
            <span className="stat-label">Total Billings ({invoices.length} checkouts)</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'oklch(0.95 0.02 185)', color: 'var(--status-vacant)' }}>
            <CreditCard size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">₹{cardSales.toFixed(2)}</span>
            <span className="stat-label">Card Sales</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'oklch(0.96 0.02 140)', color: 'oklch(0.40 0.12 140)' }}>
            <Money size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">₹{cashSales.toFixed(2)}</span>
            <span className="stat-label">Cash Register</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ backgroundColor: 'oklch(0.97 0.02 75)', color: 'oklch(0.65 0.15 75)' }}>
            <Bank size={24} />
          </div>
          <div className="stat-details">
            <span className="stat-value">₹{upiSales.toFixed(2)}</span>
            <span className="stat-label">UPI Bank Transfers</span>
          </div>
        </div>
      </div>

      {/* Invoices List Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1.5fr', gap: '2rem', alignItems: 'flex-start' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Invoices Registry</h3>
          
          {invoices.length === 0 ? (
            <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--muted)' }}>
              <Receipt size={48} style={{ marginInline: 'auto', marginBottom: '1rem' }} />
              <h4 style={{ margin: 0 }}>No invoices created yet</h4>
              <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Checkout occupied tables to generate billing entries.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
              {invoices.map(inv => {
                const order = orders.find(o => o.id === inv.order_id);
                const table = order ? tables.find(t => t.id === order.table_id) : null;
                
                return (
                  <div key={inv.id} className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', display: 'block' }}>Bill #{inv.id?.slice(-4).toUpperCase()}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Order: #{inv.order_id.slice(-4).toUpperCase()}</span>
                      </div>
                      <span className="badge badge-ready" style={{ backgroundColor: 'oklch(0.96 0.02 140)', color: 'oklch(0.40 0.12 140)' }}>
                        <SealCheck size={12} style={{ marginRight: '0.25rem' }} /> {inv.payment_status.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--surface-border)', paddingTop: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block' }}>Table</span>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Table {table?.table_number || 'N/A'}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block' }}>Method</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem', fontWeight: 600 }}>
                          {getMethodIcon(inv.payment_method)} {inv.payment_method.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--surface-border)', paddingTop: '0.75rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem' }}>
                        ₹{inv.total_amount.toFixed(2)}
                      </span>
                      <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }} onClick={() => handleViewDetails(inv)}>
                        <Eye size={14} /> Receipt
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Detailed Receipt View Panel */}
        <ReceiptPanel
          selectedInvoice={selectedInvoice}
          selectedInvoiceOrder={selectedInvoiceOrder}
          foods={foods}
          onClose={() => setSelectedInvoiceId(null)}
        />

      </div>
    </div>
  );
};
