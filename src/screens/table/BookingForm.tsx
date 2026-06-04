import React, { useState, useEffect } from 'react';
import { X } from '@phosphor-icons/react';
import type { Table } from '../../services/types';
import { CustomSelect } from '../../components/CustomSelect';
import { getLocalDateString, isTimeInPast } from '../../utils/date';

interface BookingFormProps {
  selectedTable: Table;
  onCancel: () => void;
  onSubmit: (bookingData: {
    party_size: number;
    is_shared: boolean;
    start_time: string;
    end_time: string;
    user_email: string;
    user_name: string;
    user_phone: string;
  }) => Promise<void>;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  selectedTable,
  onCancel,
  onSubmit
}) => {
  const [bookEmail, setBookEmail] = useState('');
  const [bookName, setBookName] = useState('');
  const [bookPhone, setBookPhone] = useState('');
  const [bookPartySize, setBookPartySize] = useState('2');
  const [bookDate, setBookDate] = useState(() => getLocalDateString());
  const [bookTime, setBookTime] = useState('12:00');
  const [bookDuration, setBookDuration] = useState('2');
  const [bookIsShared, setBookIsShared] = useState(false);
  const [bookError, setBookError] = useState('');
  const [saving, setSaving] = useState(false);

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

  // Auto-correct time selection if it becomes invalid
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookError('');

    if (!bookName.trim() || !bookEmail.trim() || !bookPhone.trim()) {
      setBookError('Name, email, and phone number are required.');
      return;
    }

    const startDateTime = new Date(`${bookDate}T${bookTime}:00`);
    if (isTimeInPast(bookDate, bookTime)) {
      setBookError('Booking time must be in the future.');
      return;
    }
    const endDateTime = new Date(startDateTime.getTime() + parseFloat(bookDuration) * 60 * 60 * 1000);
    const startTimeISO = startDateTime.toISOString();
    const endTimeISO = endDateTime.toISOString();

    setSaving(true);
    try {
      await onSubmit({
        party_size: parseInt(bookPartySize),
        is_shared: bookIsShared,
        start_time: startTimeISO,
        end_time: endTimeISO,
        user_email: bookEmail.trim(),
        user_name: bookName.trim(),
        user_phone: bookPhone.trim()
      });
    } catch (err: any) {
      console.error('Error creating booking in form:', err);
      setBookError(err.message || 'Failed to create booking.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>New Booking / Reservation</span>
        <button type="button" style={{ border: 'none', background: 'none', color: 'var(--muted)', cursor: 'pointer', padding: '0.25rem', display: 'flex', alignItems: 'center' }} onClick={onCancel}>
          <X size={16} />
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

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" style={{ fontSize: '0.8rem' }}>Customer Name</label>
        <input
          type="text"
          className="form-input"
          placeholder="e.g. John Doe"
          value={bookName}
          onChange={e => setBookName(e.target.value)}
          style={{ padding: '0.5rem' }}
          required
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>Customer Email</label>
          <input
            type="email"
            className="form-input"
            placeholder="customer@example.com"
            value={bookEmail}
            onChange={e => setBookEmail(e.target.value)}
            style={{ padding: '0.5rem' }}
            required
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.8rem' }}>Customer Phone</label>
          <input
            type="tel"
            className="form-input"
            placeholder="+91 98765 43210"
            value={bookPhone}
            onChange={e => setBookPhone(e.target.value)}
            style={{ padding: '0.5rem' }}
            required
          />
        </div>
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: 'auto', paddingTop: '1rem' }}>
        <button type="button" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} disabled={saving}>
          {saving ? 'Booking...' : 'Create Booking'}
        </button>
      </div>
    </form>
  );
};
