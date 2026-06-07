import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, removeAuthToken, setCurrentUser } from '../../services';
import { CalendarCheck, SquaresFour, ArrowRight, CheckCircle } from '@phosphor-icons/react';

export const HomeScreen: React.FC = () => {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleGetStarted = (role: 'customer' | 'staff') => {
    if (role === 'customer') {
      if (user) {
        if (user.role === 'user') {
          navigate('/bookings/new');
        } else {
          // Logged in as admin/staff, log out and redirect to customer portal
          removeAuthToken();
          setCurrentUser(null);
          window.dispatchEvent(new Event('auth-logout'));
          navigate('/login?redirect=/bookings/new');
        }
      } else {
        navigate('/login?redirect=/bookings/new');
      }
    } else { // staff portal
      if (user) {
        if (user.role !== 'user') {
          navigate('/dashboard');
        } else {
          // Logged in as customer, log out and redirect to staff dashboard
          removeAuthToken();
          setCurrentUser(null);
          window.dispatchEvent(new Event('auth-logout'));
          navigate('/login?redirect=/dashboard');
        }
      } else {
        navigate('/login?redirect=/dashboard');
      }
    }
  };



  return (
    <div style={{ backgroundColor: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', fontFamily: 'var(--font-sans)' }}>
      {/* Navigation Header */}
      <header style={{ borderBottom: '1px solid var(--surface-border)', padding: '1rem 2rem', position: 'sticky', top: 0, backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="brand-logo" style={{ backgroundColor: 'var(--primary)', color: 'var(--ink)', width: '36px', height: '36px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>B</div>
            <span className="brand-name" style={{ fontSize: '1.2rem', fontWeight: 700 }}>Bistro Restaurant Chain</span>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {user ? (
              <button 
                className="btn btn-primary"
                onClick={() => navigate(user.role === 'user' ? '/bookings/new' : '/dashboard')}
              >
                Go to App <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <button className="btn btn-secondary" onClick={() => navigate('/login')}>Sign In</button>
                <button className="btn btn-primary" onClick={() => navigate('/bookings/new')}>Book a Table</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '5rem 2rem 4rem 2rem', textAlign: 'center', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'inline-block', backgroundColor: 'var(--surface)', border: '1px solid var(--surface-border)', borderRadius: '20px', padding: '0.35rem 1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '1.5rem' }}>
          ✨ Comprehensive Restaurant Management & Booking System
        </div>
        <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: '1.5rem', fontFamily: 'var(--font-display)' }}>
          Streamline Dining, Kitchen & Billing Operations
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '2rem', maxWidth: '75ch', margin: '0 auto' }}>
          An all-in-one interactive platform for modern dining chains. Manage tables, coordinate live order ticket queues, process transactions, and let customers reserve their tables online with a premium, tactile interface.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
          <button 
            className="btn btn-accent" 
            style={{ padding: '0.85rem 2rem', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }} 
            onClick={() => handleGetStarted('customer')}
          >
            <span>Book a Table Now</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Quick Access Portal Grid */}
      <section style={{ padding: '2rem 2rem 4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', display: 'grid', gap: '2rem' }}>
          <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px' }}>
            <div>
              <div style={{ backgroundColor: 'var(--primary)', width: '44px', height: '44px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: 'var(--ink)' }}>
                <SquaresFour size={24} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>For Managers & Staff</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                Access the back-office dashboard to view live sales analytics, manage the floor table layout, process incoming food orders, and generate invoices.
              </p>
            </div>
            <button className="btn btn-secondary" style={{ width: 'fit-content' }} onClick={() => handleGetStarted('staff')}>
              Enter Manager Area <ArrowRight size={14} />
            </button>
          </div>

          <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '260px' }}>
            <div>
              <div style={{ backgroundColor: 'var(--primary)', width: '44px', height: '44px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem', color: 'var(--ink)' }}>
                <CalendarCheck size={24} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.75rem' }}>For Dining Customers</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                Securely book dining tables, specify party sizes, toggle table sharing preferences, browse food catalogs, and track active table reservations.
              </p>
            </div>
            <button className="btn btn-secondary" style={{ width: 'fit-content' }} onClick={() => handleGetStarted('customer')}>
              Enter Customer Area <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </section>

      {/* Feature Breakdown: What & Why */}
      <section style={{ backgroundColor: 'var(--surface)', padding: '5rem 2rem', borderTop: '1px solid var(--surface-border)', borderBottom: '1px solid var(--surface-border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em' }}>What It Does & Why It Exists</h2>
            <p style={{ color: 'var(--muted)', maxWidth: '60ch', margin: '0.5rem auto 0 auto' }}>An engineering breakdown of operational problems solved by this project.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
            <div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <CheckCircle size={20} style={{ color: 'var(--accent)' }} /> Interactive Floor Mapping
              </h4>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                <strong>What:</strong> Displays real-time table statuses (Vacant, Occupied, Reserved) showing current guest counts and capacity limits.<br/>
                <strong>Why:</strong> Enables hosts to seat guests instantly and accurately, optimizing space utilization and maximizing seating speed.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <CheckCircle size={20} style={{ color: 'var(--accent)' }} /> Kitchen Kanban Queue
              </h4>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                <strong>What:</strong> A progress tracker moving tickets through Preparing, Ready, Served, and Completed stages.<br/>
                <strong>Why:</strong> Ensures chefs and servers are aligned in real-time, eliminating lost paper tickets and minimizing food serving latency.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <CheckCircle size={20} style={{ color: 'var(--accent)' }} /> Automated Billing & Invoices
              </h4>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                <strong>What:</strong> Calculates orders automatically, links payments to specific dining tables, and handles multiple payment gateways.<br/>
                <strong>Why:</strong> Reduces math errors, fast-tracks checkout times, and records detailed sales histories for accounting.
              </p>
            </div>
            <div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <CheckCircle size={20} style={{ color: 'var(--accent)' }} /> Expiry Cleanups
              </h4>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                <strong>What:</strong> Runs a background goroutine worker that monitors tables and automatically cancels booking requests that are expired.<br/>
                <strong>Why:</strong> Frees up idle table capacities automatically without requiring manual supervisor audits.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--surface-border)', padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.9rem' }}>
        <p>&copy; {new Date().getFullYear()} Bistro Restaurant Chain. Crafted for Taste & Efficiency.</p>
      </footer>
    </div>
  );
};
