import React, { useState } from 'react';
import { X } from '@phosphor-icons/react';
import { CustomSelect } from '../../components/CustomSelect';

interface AddTableModalProps {
  onClose: () => void;
  onSubmit: (tableNum: number, capacity: number) => Promise<void>;
}

export const AddTableModal: React.FC<AddTableModalProps> = ({
  onClose,
  onSubmit
}) => {
  const [newTableNum, setNewTableNum] = useState('');
  const [newTableCap, setNewTableCap] = useState('2');
  const [addTableError, setAddTableError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(newTableNum);
    const cap = parseInt(newTableCap);
    if (isNaN(num) || isNaN(cap)) return;

    setAddTableError('');
    setSaving(true);
    try {
      await onSubmit(num, cap);
    } catch (err: any) {
      console.error('Error creating table in modal:', err);
      setAddTableError(err.message || 'Failed to create table. Table number might already exist.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
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
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create Table'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
