import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  useTablesQuery,
  useBookingsQuery,
  useCancelBookingMutation,
  getCurrentUser
} from '../../services';
import { Users, X, CalendarCheck } from '@phosphor-icons/react';

export const MyBookingsScreen: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login?redirect=/bookings/my');
    }
  }, [currentUser, navigate]);

  // Queries
  const { data: tables = [] } = useTablesQuery();
  const { data: bookings = [] } = useBookingsQuery();

  // Mutations
  const cancelBookingMutation = useCancelBookingMutation();

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await cancelBookingMutation.mutateAsync(bookingId);
    } catch (err) {
      console.error('Error cancelling booking:', err);
    }
  };

  // Active (non-cancelled, non-completed) bookings
  const activeBookings = bookings.filter(b => b.status === 'pending' || b.status === 'checked_in');
  const pastBookings = bookings.filter(b => b.status === 'cancelled' || b.status === 'completed');

  return (
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
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/bookings/new')}>
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
                      disabled={cancelBookingMutation.isPending}
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
  );
};
