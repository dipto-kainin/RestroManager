import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getCurrentUser, type User } from '../../services';
import { CalendarCheck, ClipboardText, ForkKnife, SignOut, SignIn } from '@phosphor-icons/react';

interface CustomerLayoutProps {
  currentUser: User | null;
  onSignOut: () => void;
}

export const CustomerLayout: React.FC<CustomerLayoutProps> = ({ currentUser, onSignOut }) => {
  const user = currentUser || getCurrentUser();
  const navigate = useNavigate();

  return (
    <div className="customer-shell">
      {/* Customer Header */}
      <header className="customer-header">
        <div className="customer-header-inner">
          <div 
            onClick={() => navigate('/')} 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}
            title="Back to Home"
          >
            <div className="brand-logo">B</div>
            <span className="brand-name">Bistro Restaurant Chain</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <nav className="customer-nav">
              <NavLink
                to="/bookings/new"
                className={({ isActive }) => `customer-nav-btn ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <CalendarCheck size={18} />
                <span>Book Table</span>
              </NavLink>
              <NavLink
                to="/bookings/my"
                className={({ isActive }) => `customer-nav-btn ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <ClipboardText size={18} />
                <span>My Bookings</span>
              </NavLink>
              <NavLink
                to="/bookings/menu"
                className={({ isActive }) => `customer-nav-btn ${isActive ? 'active' : ''}`}
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <ForkKnife size={18} />
                <span>Menu</span>
              </NavLink>
            </nav>
            <div className="customer-user-info">
              {user ? (
                <>
                  <div className="user-avatar" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                    {user?.first_name?.charAt(0) || 'U'}
                  </div>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem', border: 'none' }}
                    onClick={onSignOut}
                    title="Sign Out"
                  >
                    <SignOut size={16} />
                  </button>
                </>
              ) : (
                <button
                  className="btn btn-primary"
                  style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.375rem' }}
                  onClick={() => {
                    const currentPath = window.location.pathname;
                    navigate(`/login?redirect=${currentPath}`);
                  }}
                >
                  <SignIn size={16} />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="customer-main">
        <Outlet />
      </main>
    </div>
  );
};
