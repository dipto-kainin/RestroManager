import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom';
import { type User, removeAuthToken, setCurrentUser, getCurrentUser } from './services';
import { AuthScreen } from './screens/auth/AuthScreen';
import { DashboardScreen } from './screens/dashboard/DashboardScreen';
import { TableScreen } from './screens/table/TableScreen';
import { MenuScreen } from './screens/menu/MenuScreen';
import { OrderScreen } from './screens/order/OrderScreen';
import { InvoiceScreen } from './screens/invoice/InvoiceScreen';
import { House, SquaresFour, ForkKnife, ClipboardText, Receipt, SignOut } from '@phosphor-icons/react';
import { CustomerLayout } from './screens/booking/CustomerLayout';
import { NewBookingScreen } from './screens/booking/NewBookingScreen';
import { MyBookingsScreen } from './screens/booking/MyBookingsScreen';
import { CustomerMenuScreen } from './screens/booking/CustomerMenuScreen';

// Admin/Staff Layout
const AdminLayout = ({ currentUser, onSignOut }: { currentUser: User; onSignOut: () => void }) => {
  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="brand-section">
            <div className="brand-logo">C</div>
            <span className="brand-name">RestroManager</span>
          </div>

          <ul className="nav-links">
            <li>
              <NavLink 
                to="/dashboard" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', textDecoration: 'none' }}
              >
                <House size={20} />
                <span>Dashboard</span>
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/tables" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', textDecoration: 'none' }}
              >
                <SquaresFour size={20} />
                <span>Floor Map</span>
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/menu" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', textDecoration: 'none' }}
              >
                <ForkKnife size={20} />
                <span>Food Menu</span>
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/orders" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', textDecoration: 'none' }}
              >
                <ClipboardText size={20} />
                <span>Orders Queue</span>
              </NavLink>
            </li>
            <li>
              <NavLink 
                to="/invoices" 
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', textDecoration: 'none' }}
              >
                <Receipt size={20} />
                <span>Billing Invoices</span>
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="sidebar-footer">
          {/* User profile section */}
          <div className="user-profile">
            <div className="user-avatar">
              {currentUser.first_name.charAt(0)}
            </div>
            <div className="user-info">
              <span className="user-name">{currentUser.first_name} {currentUser.last_name}</span>
              <span className="user-role">{currentUser.role.toUpperCase()}</span>
            </div>
          </div>

          <button 
            className="btn btn-secondary" 
            onClick={onSignOut}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <SignOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

function AppRoutes() {
  const [currentUser, setLocalCurrentUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Read current user from localStorage on mount
    const user = getCurrentUser();
    if (user) {
      setLocalCurrentUser(user);
    }
    setAuthChecked(true);

    const handleAuthLogout = () => {
      setLocalCurrentUser(null);
      navigate('/login');
    };

    window.addEventListener('auth-logout', handleAuthLogout);
    return () => {
      window.removeEventListener('auth-logout', handleAuthLogout);
    };
  }, [navigate]);

  const handleAuthSuccess = (user: User) => {
    setLocalCurrentUser(user);
    if (user.role === 'user') {
      navigate('/bookings');
    } else {
      navigate('/dashboard');
    }
  };

  const handleSignOut = () => {
    removeAuthToken();
    setCurrentUser(null);
    setLocalCurrentUser(null);
    navigate('/login');
  };

  if (!authChecked) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg)' }}>
        <p style={{ color: 'var(--muted)', fontWeight: 600 }}>Checking authentication status...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          currentUser ? (
            currentUser.role === 'user' ? <Navigate to="/bookings" replace /> : <Navigate to="/dashboard" replace />
          ) : (
            <AuthScreen onAuthSuccess={handleAuthSuccess} />
          )
        } 
      />

      {/* Customer Layout and Sub-routes */}
      <Route 
        element={
          currentUser ? (
            currentUser.role === 'user' ? (
              <CustomerLayout currentUser={currentUser} onSignOut={handleSignOut} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      >
        <Route path="/bookings" element={<Navigate to="/bookings/new" replace />} />
        <Route path="/bookings/new" element={<NewBookingScreen />} />
        <Route path="/bookings/my" element={<MyBookingsScreen />} />
        <Route path="/bookings/menu" element={<CustomerMenuScreen />} />
      </Route>

      {/* Admin/Staff layout routes */}
      <Route 
        element={
          currentUser ? (
            currentUser.role !== 'user' ? (
              <AdminLayout currentUser={currentUser} onSignOut={handleSignOut} />
            ) : (
              <Navigate to="/bookings" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route path="/dashboard" element={<DashboardScreen />} />
        <Route path="/tables" element={<TableScreen />} />
        <Route path="/menu" element={<MenuScreen currentUser={currentUser!} />} />
        <Route path="/orders" element={<OrderScreen />} />
        <Route path="/invoices" element={<InvoiceScreen />} />
      </Route>

      {/* Fallback routing */}
      <Route 
        path="*" 
        element={
          currentUser ? (
            currentUser.role === 'user' ? <Navigate to="/bookings" replace /> : <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        } 
      />
    </Routes>
  );
}

import { ToastProvider } from './context/ToastContext';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
