import React, { useEffect, useState } from 'react';
import { 
  useTablesQuery,
  useBookingsQuery,
  useFoodsQuery,
  useCreateBookingMutation,
  useCancelBookingMutation,
  getCurrentUser, 
  type Table, 
  type Booking 
} from '../../services';
import { Users, Check, X, CalendarCheck, MapPin, Info, ArrowRight, CaretLeft, ClipboardText, ForkKnife, SignOut } from '@phosphor-icons/react';
import { CustomSelect } from '../../components/CustomSelect';
import { getLocalDateString, isTimeInPast } from '../../utils/date';

interface BookingScreenProps {
  onSignOut: () => void;
}

type BookingStep = 'party' | 'datetime' | 'table' | 'confirm' | 'done';
type CustomerTab = 'book' | 'my-bookings' | 'menu';

export const BookingScreen: React.FC<BookingScreenProps> = ({ onSignOut }) => {
  const [activeTab, setActiveTab] = useState<CustomerTab>('book');
  const [step, setStep] = useState<BookingStep>('party');
  const [partySize, setPartySize] = useState<number>(2);
  
  // Date & Time states
  const [bookingDate, setBookingDate] = useState<string>(() => getLocalDateString());
  const [bookingTime, setBookingTime] = useState<string>('12:00');
  const [bookingDuration, setBookingDuration] = useState<number>(2);

  const [timeWindow, setTimeWindow] = useState<{ start?: string; end?: string }>({});
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [comfortSharing, setComfortSharing] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [lastBooking, setLastBooking] = useState<Booking | null>(null);

  const currentUser = getCurrentUser();

  // Queries
  const { data: tables = [] } = useTablesQuery(timeWindow.start, timeWindow.end);
  const { data: bookings = [] } = useBookingsQuery();
  const { data: foods = [] } = useFoodsQuery();

  const selectedTable = selectedTableId ? tables.find(t => t.id === selectedTableId) || null : null;

  // Mutations
  const createBookingMutation = useCreateBookingMutation();
  const cancelBookingMutation = useCancelBookingMutation();

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
    const options = getSelectableTimeOptions(bookingDate);
    if (options.length > 0) {
      const isValid = options.some(opt => opt.value === bookingTime);
      if (!isValid) {
        setBookingTime(options[0].value);
      }
    } else if (bookingDate === getLocalDateString()) {
      setBookingError("No booking slots remaining for today. Please select a future date.");
    } else {
      setBookingError('');
    }
  }, [bookingDate]);

  const loading = createBookingMutation.isPending || cancelBookingMutation.isPending;

  // Filter tables available for the given party size
  const getAvailableTables = () => {
    return tables.filter(table => {
      const capacity = table.capacity || table.number_of_guests;
      if (capacity < partySize) return false;

      // Vacant tables always available
      if (table.status === 'vacant') return true;

      // Reserved or Occupied tables might be available if sharing
      if (table.status === 'reserved' || table.status === 'occupied') {
        const availableSeats = capacity - (table.seats_reserved || 0);
        return availableSeats >= partySize;
      }

      return false;
    });
  };

  // Determine sharing behavior for a given table
  const getSharingInfo = (table: Table) => {
    const capacity = table.capacity || table.number_of_guests;
    const halfCapacity = capacity / 2;

    if (partySize === capacity) {
      return { type: 'full' as const, message: '' };
    } else if (partySize > halfCapacity) {
      return {
        type: 'checkbox' as const,
        message: 'I\'m comfortable sharing if extra seats are available'
      };
    } else {
      return {
        type: 'info' as const,
        message: 'This table may be shared with other guests'
      };
    }
  };

  const handleSelectTable = (table: Table) => {
    setSelectedTableId(table.id || null);
    setComfortSharing(false);
    setBookingError('');
  };

  const handleConfirmBooking = async () => {
    if (!selectedTable || !selectedTable.id) return;
    setBookingError('');

    const capacity = selectedTable.capacity || selectedTable.number_of_guests;
    const sharingInfo = getSharingInfo(selectedTable);

    // Determine if this is a shared booking
    let isShared = false;
    if (sharingInfo.type === 'full') {
      isShared = false; // Full table, no sharing
    } else if (sharingInfo.type === 'checkbox') {
      isShared = comfortSharing; // User opted in
    } else if (sharingInfo.type === 'info') {
      isShared = true; // Sharing is expected (small party at big table)
    }

    // If not shared and party doesn't fill the table, still book exclusively
    if (!isShared && partySize < capacity) {
      isShared = false; // Whole table booked
    }

    const startDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
    if (isTimeInPast(bookingDate, bookingTime)) {
      setBookingError('Booking time must be in the future.');
      return;
    }
    const endDateTime = new Date(startDateTime.getTime() + bookingDuration * 60 * 60 * 1000);
    const startTimeISO = startDateTime.toISOString();
    const endTimeISO = endDateTime.toISOString();

    try {
      const booking = await createBookingMutation.mutateAsync({
        table_id: selectedTable.id,
        party_size: partySize,
        is_shared: isShared,
        comfort_sharing: comfortSharing,
        start_time: startTimeISO,
        end_time: endTimeISO
      });
      setLastBooking(booking);
      setStep('done');
    } catch (err: any) {
      setBookingError(err.message || 'Failed to create booking');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await cancelBookingMutation.mutateAsync(bookingId);
    } catch (err) {
      console.error('Error cancelling booking:', err);
    }
  };

  const handleNewBooking = () => {
    setStep('party');
    setPartySize(2);
    setSelectedTableId(null);
    setComfortSharing(false);
    setLastBooking(null);
    setBookingError('');
    setTimeWindow({});
  };

  const availableTables = getAvailableTables();

  // Active (non-cancelled, non-completed) bookings for the "My Bookings" tab
  const activeBookings = bookings.filter(b => b.status === 'pending' || b.status === 'checked_in');
  const pastBookings = bookings.filter(b => b.status === 'cancelled' || b.status === 'completed');

  return (
    <div className="customer-shell">
      {/* Customer Header */}
      <header className="customer-header">
        <div className="customer-header-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="brand-logo">C</div>
            <span className="brand-name">Citrus Sunlit Bistro</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <nav className="customer-nav">
              <button
                className={`customer-nav-btn ${activeTab === 'book' ? 'active' : ''}`}
                onClick={() => { setActiveTab('book'); handleNewBooking(); }}
              >
                <CalendarCheck size={18} />
                <span>Book Table</span>
              </button>
              <button
                className={`customer-nav-btn ${activeTab === 'my-bookings' ? 'active' : ''}`}
                onClick={() => { setActiveTab('my-bookings'); }}
              >
                <ClipboardText size={18} />
                <span>My Bookings</span>
              </button>
              <button
                className={`customer-nav-btn ${activeTab === 'menu' ? 'active' : ''}`}
                onClick={() => { setActiveTab('menu'); }}
              >
                <ForkKnife size={18} />
                <span>Menu</span>
              </button>
            </nav>
            <div className="customer-user-info">
              <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                {currentUser?.first_name?.charAt(0) || 'G'}
              </div>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem', border: 'none' }}
                onClick={onSignOut}
              >
                <SignOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="customer-main">
        {activeTab === 'book' && (
          <div className="booking-flow">
            {/* Step Indicator */}
            <div className="booking-steps">
              <div className={`booking-step-indicator ${step === 'party' ? 'active' : 'done'}`}>
                <span className="step-num">1</span>
                <span className="step-label">Party Size</span>
              </div>
              <div className="step-connector" />
              <div className={`booking-step-indicator ${step === 'datetime' ? 'active' : (step === 'party' ? '' : 'done')}`}>
                <span className="step-num">2</span>
                <span className="step-label">Date & Time</span>
              </div>
              <div className="step-connector" />
              <div className={`booking-step-indicator ${step === 'table' ? 'active' : (step === 'confirm' || step === 'done' ? 'done' : '')}`}>
                <span className="step-num">3</span>
                <span className="step-label">Choose Table</span>
              </div>
              <div className="step-connector" />
              <div className={`booking-step-indicator ${step === 'confirm' ? 'active' : (step === 'done' ? 'done' : '')}`}>
                <span className="step-num">4</span>
                <span className="step-label">Confirm</span>
              </div>
            </div>

            {/* Step 1: Party Size */}
            {step === 'party' && (
              <div className="booking-step-content">
                <h2 className="booking-step-title">How many guests are dining?</h2>
                <p className="booking-step-desc">Select your party size to find the perfect table.</p>

                <div className="party-chips">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12].map(size => (
                    <button
                      key={size}
                      className={`party-chip ${partySize === size ? 'active' : ''}`}
                      onClick={() => setPartySize(size)}
                    >
                      <Users size={16} weight={partySize === size ? 'fill' : 'regular'} />
                      <span>{size}</span>
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => { setStep('datetime'); }}
                    style={{ padding: '0.75rem 2rem' }}
                  >
                    Next Step <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Date & Time Selector */}
            {step === 'datetime' && (
              <div className="booking-step-content">
                <h2 className="booking-step-title">When would you like to dine?</h2>
                <p className="booking-step-desc">Select a date, start time, and reservation duration.</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Select Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={bookingDate}
                      min={getLocalDateString()}
                      onChange={e => setBookingDate(e.target.value)}
                      style={{ height: '46px', fontSize: '1rem', colorScheme: 'light' }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Start Time</label>
                    <CustomSelect
                      options={getSelectableTimeOptions(bookingDate)}
                      value={bookingTime}
                      onChange={setBookingTime}
                      placeholder="Choose Start Time"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Duration</label>
                    <CustomSelect
                      options={[
                        { value: '1', label: '1 Hour' },
                        { value: '1.5', label: '1.5 Hours' },
                        { value: '2', label: '2 Hours' },
                        { value: '2.5', label: '2.5 Hours' },
                        { value: '3', label: '3 Hours' },
                        { value: '4', label: '4 Hours' }
                      ]}
                      value={bookingDuration.toString()}
                      onChange={(val) => setBookingDuration(parseFloat(val))}
                      placeholder="Choose Duration"
                    />
                  </div>
                </div>

                <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setStep('party')}
                    style={{ padding: '0.75rem 2rem' }}
                  >
                    Back
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      const startDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
                      if (isTimeInPast(bookingDate, bookingTime)) {
                        setBookingError('Booking time must be in the future.');
                        return;
                      }
                      const endDateTime = new Date(startDateTime.getTime() + bookingDuration * 60 * 60 * 1000);
                      setTimeWindow({
                        start: startDateTime.toISOString(),
                        end: endDateTime.toISOString()
                      });
                      setStep('table');
                      setSelectedTableId(null);
                    }}
                    style={{ padding: '0.75rem 2rem' }}
                  >
                    Find Tables <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Choose Table */}
            {step === 'table' && (
              <div className="booking-step-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div>
                    <h2 className="booking-step-title">Choose your table</h2>
                    <p className="booking-step-desc">
                      {availableTables.length} table{availableTables.length !== 1 ? 's' : ''} available for {partySize} guest{partySize !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setStep('datetime')}
                    style={{ fontSize: '0.85rem' }}
                  >
                    <CaretLeft size={16} /> Change date/time
                  </button>
                </div>

                {availableTables.length === 0 ? (
                  <div className="booking-empty">
                    <MapPin size={40} />
                    <p style={{ fontWeight: 600 }}>No tables available</p>
                    <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                      Try a different party size, date/time, or check back later.
                    </p>
                  </div>
                ) : (
                  <div className="booking-table-grid">
                    {availableTables.map(table => {
                      const capacity = table.capacity || table.number_of_guests;
                      const isSelected = selectedTable?.id === table.id;
                      const sharing = getSharingInfo(table);
                      const seatsUsed = table.seats_reserved || 0;

                      return (
                        <div
                          key={table.id}
                          className={`booking-table-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectTable(table)}
                        >
                          <div className="booking-table-header">
                            <span className="booking-table-num">T-{table.table_number}</span>
                            <span className="booking-table-cap">{capacity}-seat</span>
                          </div>

                          {/* Seat dot visualization */}
                          <div className="seat-dots">
                            {Array.from({ length: capacity }).map((_, i) => (
                              <div
                                key={i}
                                className={`seat-dot ${i < seatsUsed ? 'occupied' : (i < seatsUsed + partySize ? 'yours' : 'available')}`}
                                title={i < seatsUsed ? 'Reserved' : (i < seatsUsed + partySize ? 'Your seat' : 'Available')}
                              />
                            ))}
                          </div>

                          {/* Sharing info */}
                          {sharing.type !== 'full' && (
                            <div className={`sharing-info ${sharing.type}`}>
                              {sharing.type === 'checkbox' && isSelected ? (
                                <label className="sharing-checkbox" onClick={e => e.stopPropagation()}>
                                  <input
                                    type="checkbox"
                                    checked={comfortSharing}
                                    onChange={e => setComfortSharing(e.target.checked)}
                                  />
                                  <span>{sharing.message}</span>
                                </label>
                              ) : sharing.type === 'checkbox' ? (
                                <div className="sharing-note">
                                  <Info size={14} />
                                  <span>Sharing option available</span>
                                </div>
                              ) : (
                                <div className="sharing-note">
                                  <Info size={14} />
                                  <span>{sharing.message}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {isSelected && (
                            <div className="booking-table-selected-mark">
                              <Check size={16} weight="bold" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedTable && (
                  <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => setStep('confirm')}
                      style={{ padding: '0.75rem 2rem' }}
                    >
                      Review Booking <ArrowRight size={18} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Confirm */}
            {step === 'confirm' && selectedTable && (
              <div className="booking-step-content">
                <button
                  className="btn btn-secondary"
                  onClick={() => setStep('table')}
                  style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}
                >
                  <CaretLeft size={16} /> Back to tables
                </button>

                <h2 className="booking-step-title">Review your booking</h2>

                <div className="booking-summary-card">
                  <div className="summary-row">
                    <span className="summary-label">Date</span>
                    <span className="summary-value">{new Date(bookingDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Time window</span>
                    <span className="summary-value">
                      {(() => {
                        const startDateTime = new Date(`${bookingDate}T${bookingTime}:00`);
                        const endDateTime = new Date(startDateTime.getTime() + bookingDuration * 60 * 60 * 1000);
                        return `${startDateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${endDateTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} (${bookingDuration} hours)`;
                      })()}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Table</span>
                    <span className="summary-value">T-{selectedTable.table_number}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Party size</span>
                    <span className="summary-value">{partySize} guest{partySize !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Table capacity</span>
                    <span className="summary-value">{selectedTable.capacity || selectedTable.number_of_guests} seats</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Booking type</span>
                    <span className="summary-value">
                      {(() => {
                        const sharing = getSharingInfo(selectedTable);
                        if (sharing.type === 'full') return 'Exclusive (full table)';
                        if (sharing.type === 'checkbox' && comfortSharing) return 'Open to sharing';
                        if (sharing.type === 'checkbox' && !comfortSharing) return 'Exclusive (full table)';
                        if (sharing.type === 'info') return 'Shared seating';
                        return 'Standard';
                      })()}
                    </span>
                  </div>
                </div>

                {bookingError && (
                  <div className="form-error" style={{
                    padding: '0.75rem',
                    backgroundColor: 'oklch(0.95 0.05 20)',
                    border: '1px solid oklch(0.85 0.10 20)',
                    borderRadius: '8px',
                    textAlign: 'center',
                    marginTop: '1rem'
                  }}>
                    {bookingError}
                  </div>
                )}

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    className="btn btn-accent"
                    onClick={handleConfirmBooking}
                    disabled={loading}
                    style={{ padding: '0.75rem 2rem' }}
                  >
                    {loading ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Done */}
            {step === 'done' && (
              <div className="booking-step-content" style={{ textAlign: 'center' }}>
                <div className="booking-success-icon">
                  <Check size={32} weight="bold" />
                </div>
                <h2 className="booking-step-title" style={{ marginTop: '1.5rem' }}>Booking Confirmed</h2>
                <p className="booking-step-desc" style={{ maxWidth: '40ch', margin: '0.5rem auto 0' }}>
                  Please check in with staff when you arrive. Your table will be confirmed upon verification.
                </p>

                {lastBooking && (
                  <div className="booking-summary-card" style={{ marginTop: '2rem', textAlign: 'left' }}>
                    <div className="summary-row">
                      <span className="summary-label">Status</span>
                      <span className="badge badge-reserved">Pending check-in</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Date & Time</span>
                      <span className="summary-value">
                        {new Date(lastBooking.start_time).toLocaleDateString()} at {new Date(lastBooking.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(lastBooking.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Party size</span>
                      <span className="summary-value">{lastBooking.party_size} guests</span>
                    </div>
                    <div className="summary-row">
                      <span className="summary-label">Sharing</span>
                      <span className="summary-value">{lastBooking.is_shared ? 'Shared seating' : 'Exclusive table'}</span>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button className="btn btn-primary" onClick={handleNewBooking}>
                    Book Another Table
                  </button>
                  <button className="btn btn-secondary" onClick={() => { setActiveTab('my-bookings'); }}>
                    View My Bookings
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* My Bookings Tab */}
        {activeTab === 'my-bookings' && (
          <div className="my-bookings">
            <h2 className="booking-step-title">My Bookings</h2>
            <p className="booking-step-desc" style={{ marginBottom: '2rem' }}>Your active and past reservations.</p>

            {activeBookings.length === 0 && pastBookings.length === 0 ? (
              <div className="booking-empty">
                <CalendarCheck size={40} />
                <p style={{ fontWeight: 600 }}>No bookings yet</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                  Book a table to get started.
                </p>
                <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => { setActiveTab('book'); handleNewBooking(); }}>
                  Book a Table
                </button>
              </div>
            ) : (
              <div className="bookings-list">
                {activeBookings.map(booking => {
                  const table = tables.find(t => t.id === booking.table_id);
                  return (
                    <div key={booking.id} className="booking-list-card">
                      <div className="booking-list-header">
                        <div>
                          <span className="booking-list-table">Table {table?.table_number || '?'}</span>
                          <span className={`badge ${booking.status === 'pending' ? 'badge-reserved' : 'badge-ready'}`} style={{ marginLeft: '0.75rem' }}>
                            {booking.status === 'pending' ? 'Pending check-in' : 'Checked in'}
                          </span>
                        </div>
                        {booking.status === 'pending' && booking.id && (
                           <button
                            className="btn btn-secondary"
                            style={{ fontSize: '0.8rem', padding: '0.25rem 0.75rem', color: 'oklch(0.6 0.2 20)' }}
                            onClick={() => handleCancelBooking(booking.id!)}
                          >
                            <X size={14} /> Cancel
                          </button>
                        )}
                      </div>
                      <div className="booking-list-details">
                        <span><Users size={14} /> {booking.party_size} guest{booking.party_size !== 1 ? 's' : ''}</span>
                        <span>{booking.is_shared ? 'Shared seating' : 'Exclusive table'}</span>
                        {booking.start_time && (
                          <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 600, marginTop: '0.25rem' }}>
                            Slot: {new Date(booking.start_time).toLocaleDateString()} @ {new Date(booking.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {new Date(booking.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        )}
                        {booking.status === 'pending' && (
                          <div style={{ fontSize: '0.8rem', color: 'oklch(0.6 0.15 30)', fontWeight: 500, marginTop: '0.25rem' }}>
                            ⚠️ Please check in by: {(() => {
                              const getMinEntryTime = (b: typeof booking) => {
                                if (b.min_entry_time) return new Date(b.min_entry_time);
                                const start = new Date(b.start_time);
                                const end = new Date(b.end_time);
                                const duration = (end.getTime() - start.getTime()) / (60 * 60 * 1000);
                                let limitMinutes = Math.floor(duration) * 30;
                                if (limitMinutes < 30) limitMinutes = 30;
                                return new Date(start.getTime() + limitMinutes * 60 * 1000);
                              };
                              return getMinEntryTime(booking).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            })()} (booking auto-cancels if late)
                          </div>
                        )}
                        {booking.created_at && (
                          <span style={{ color: 'var(--muted)', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
                            Booked on: {new Date(booking.created_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {pastBookings.length > 0 && (
                  <>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--muted)', marginTop: '2rem', marginBottom: '1rem' }}>Past bookings</h3>
                    {pastBookings.map(booking => {
                      const table = tables.find(t => t.id === booking.table_id);
                      return (
                        <div key={booking.id} className="booking-list-card" style={{ opacity: 0.6 }}>
                          <div className="booking-list-header">
                            <div>
                              <span className="booking-list-table">Table {table?.table_number || '?'}</span>
                              <span className="badge badge-served" style={{ marginLeft: '0.75rem' }}>Cancelled</span>
                            </div>
                          </div>
                          <div className="booking-list-details">
                            <span><Users size={14} /> {booking.party_size} guests</span>
                            {booking.created_at && (
                              <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                                {new Date(booking.created_at).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Menu Browse Tab */}
        {activeTab === 'menu' && (
          <div>
            <h2 className="booking-step-title">Our Menu</h2>
            <p className="booking-step-desc" style={{ marginBottom: '2rem' }}>Browse our dishes. You can order food after checking in.</p>

            <div className="food-grid">
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
                    <div className="food-card-footer">
                      <span className="food-card-price">₹{food.price.toFixed(2)}</span>
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
        )}
      </main>
    </div>
  );
};
