import { useState, useEffect } from 'react';
import { type User, removeAuthToken, setCurrentUser, getCurrentUser } from './api';
import { AuthView } from './components/AuthView';
import { DashboardView } from './components/DashboardView';
import { TableView } from './components/TableView';
import { MenuView } from './components/MenuView';
import { OrderView } from './components/OrderView';
import { InvoiceView } from './components/InvoiceView';
import { House, SquaresFour, ForkKnife, ClipboardText, Receipt, SignOut } from '@phosphor-icons/react';
import { BookingView } from './components/BookingView';

function App() {
  const [currentUser, setLocalCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // Read current user from localStorage on mount
    const user = getCurrentUser();
    if (user) {
      setLocalCurrentUser(user);
    }
    setAuthChecked(true);
  }, []);

  const handleAuthSuccess = (user: User) => {
    setLocalCurrentUser(user);
    setActiveTab('dashboard');
  };

  const handleSignOut = () => {
    removeAuthToken();
    setCurrentUser(null);
    setLocalCurrentUser(null);
  };

  if (!authChecked) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg)' }}>
        <p style={{ color: 'var(--muted)', fontWeight: 600 }}>Checking authentication status...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <AuthView onAuthSuccess={handleAuthSuccess} />;
  }

  if (currentUser.role === 'user') {
    return <BookingView onSignOut={handleSignOut} />;
  }

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
              <button 
                className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
              >
                <House size={20} />
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-link ${activeTab === 'tables' ? 'active' : ''}`}
                onClick={() => setActiveTab('tables')}
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
              >
                <SquaresFour size={20} />
                <span>Floor Map</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-link ${activeTab === 'menu' ? 'active' : ''}`}
                onClick={() => setActiveTab('menu')}
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
              >
                <ForkKnife size={20} />
                <span>Food Menu</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => setActiveTab('orders')}
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
              >
                <ClipboardText size={20} />
                <span>Orders Queue</span>
              </button>
            </li>
            <li>
              <button 
                className={`nav-link ${activeTab === 'invoices' ? 'active' : ''}`}
                onClick={() => setActiveTab('invoices')}
                style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left' }}
              >
                <Receipt size={20} />
                <span>Billing Invoices</span>
              </button>
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
            onClick={handleSignOut}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <SignOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="main-content">
        {activeTab === 'dashboard' && <DashboardView onNavigate={(tab) => setActiveTab(tab)} />}
        {activeTab === 'tables' && (
          <TableView 
            onNavigateToOrders={() => setActiveTab('orders')} 
            onNavigateToInvoices={() => setActiveTab('invoices')} 
          />
        )}
        {activeTab === 'menu' && <MenuView currentUser={currentUser} />}
        {activeTab === 'orders' && <OrderView />}
        {activeTab === 'invoices' && <InvoiceView />}
      </main>
    </div>
  );
}

export default App;
