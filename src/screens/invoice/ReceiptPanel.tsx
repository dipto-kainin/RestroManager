import React from 'react';
import { X, FileText, Receipt } from '@phosphor-icons/react';
import type { Invoice, Order, Food } from '../../services/types';

interface ReceiptPanelProps {
  selectedInvoice: Invoice | null;
  selectedInvoiceOrder: Order | null;
  foods: Food[];
  onClose: () => void;
}

export const ReceiptPanel: React.FC<ReceiptPanelProps> = ({
  selectedInvoice,
  selectedInvoiceOrder,
  foods,
  onClose
}) => {
  return (
    <div className="card" style={{ padding: '2rem', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
      {selectedInvoice ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Guest Receipt Check</h3>
              <span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>Check #{selectedInvoice.id?.slice(-6).toUpperCase()}</span>
            </div>
            <button className="btn btn-secondary" style={{ padding: '0.25rem', border: 'none' }} onClick={onClose}>
              <X size={14} />
            </button>
          </div>

          {/* Receipt Body */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--muted)' }}>Payment Method:</span>
              <span style={{ fontWeight: 600 }}>{selectedInvoice.payment_method.toUpperCase()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--muted)' }}>Payment Status:</span>
              <span style={{ fontWeight: 600, color: 'oklch(0.40 0.12 140)' }}>{selectedInvoice.payment_status.toUpperCase()}</span>
            </div>

            {/* Items detail list */}
            {selectedInvoiceOrder && (
              <div style={{ borderTop: '1px dashed var(--surface-border)', borderBottom: '1px dashed var(--surface-border)', padding: '1rem 0', margin: '0.5rem 0' }}>
                <span style={{ fontWeight: 700, fontSize: '0.85rem', display: 'block', marginBottom: '0.75rem' }}>Ordered Dishes:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selectedInvoiceOrder.items?.map((item, idx) => {
                    const food = foods.find(f => f.id === item.food_id);
                    return (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                        <span>{food?.name || 'Dish'} x{item.quantity}</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>₹{(item.quantity * item.unit_price).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Math layout */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignSelf: 'flex-end', width: '100%', borderTop: '1px solid var(--surface-border)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--muted)' }}>Subtotal:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>₹{(selectedInvoice.total_amount * 0.9).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--muted)' }}>VAT/Sales Tax (10%):</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>₹{(selectedInvoice.total_amount * 0.1).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem', marginTop: '0.5rem', borderTop: '2px solid var(--ink)', paddingTop: '0.5rem' }}>
                <span>Total Amount Paid:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>₹{selectedInvoice.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => window.print()}>
            <FileText size={16} /> Print Guest Check
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '300px', color: 'var(--muted)', flexGrow: 1 }}>
          <Receipt size={36} />
          <p style={{ fontWeight: 600, marginTop: '1rem', marginInline: 'auto' }}>No Receipt Selected</p>
          <p style={{ fontSize: '0.85rem', marginTop: '0.25rem', textAlign: 'center' }}>Click the Receipt button on any invoice to view detailed check breakdown.</p>
        </div>
      )}
    </div>
  );
};
