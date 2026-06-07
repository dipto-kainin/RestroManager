import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useTablesQuery,
  useCreateBookingMutation,
  type Table, 
  type Booking,
  getCurrentUser 
} from '../../services';
import { Users, Check, MapPin, Info, ArrowRight, CaretLeft } from '@phosphor-icons/react';
import { CustomSelect } from '../../components/CustomSelect';
import { getLocalDateString, isTimeInPast } from '../../utils/date';

type BookingStep = 'party' | 'datetime' | 'table' | 'confirm' | 'done';

export const NewBookingScreen: React.FC = () => {
  const navigate = useNavigate();
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

  // Queries
  const { data: tables = [] } = useTablesQuery(timeWindow.start, timeWindow.end);
  const selectedTable = selectedTableId ? tables.find(t => t.id === selectedTableId) || null : null;

  // Mutations
  const createBookingMutation = useCreateBookingMutation();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const paramPartySize = searchParams.get('partySize');
    const paramDate = searchParams.get('date');
    const paramTime = searchParams.get('time');
    const paramDuration = searchParams.get('duration');
    const paramTableId = searchParams.get('tableId');
    const paramComfortSharing = searchParams.get('comfortSharing');
    const paramStep = searchParams.get('step');

    if (paramPartySize) setPartySize(parseInt(paramPartySize));
    if (paramDate) setBookingDate(paramDate);
    if (paramTime) setBookingTime(paramTime);
    if (paramDuration) setBookingDuration(parseFloat(paramDuration));
    if (paramTableId) setSelectedTableId(paramTableId);
    if (paramComfortSharing) setComfortSharing(paramComfortSharing === 'true');
    
    if (paramStep) {
      setStep(paramStep as BookingStep);
      const date = paramDate || bookingDate;
      const time = paramTime || bookingTime;
      const duration = paramDuration ? parseFloat(paramDuration) : bookingDuration;
      const startDateTime = new Date(`${date}T${time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + duration * 60 * 60 * 1000);
      setTimeWindow({
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString()
      });
    }

    if (searchParams.toString() !== '') {
      navigate('/bookings/new', { replace: true });
    }
  }, [navigate]);

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

  const loading = createBookingMutation.isPending;

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

    const user = getCurrentUser();
    if (!user) {
      const redirectUrl = `/bookings/new?partySize=${partySize}&date=${bookingDate}&time=${bookingTime}&duration=${bookingDuration}&tableId=${selectedTableId}&comfortSharing=${comfortSharing}&step=confirm`;
      navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

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

  return (
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
            <button className="btn btn-secondary" onClick={() => navigate('/bookings/my')}>
              View My Bookings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
