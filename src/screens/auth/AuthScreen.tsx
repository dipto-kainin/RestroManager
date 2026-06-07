import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, signup, type User } from '../../services';
import { Envelope, Key, User as UserIcon, Phone, ArrowRight } from '@phosphor-icons/react';

interface AuthScreenProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const credentials = { email, password };
        const result = await login(credentials);
        onAuthSuccess(result.user);
      } else {
        const result = await signup({
          first_name: firstName,
          last_name: lastName,
          email,
          password,
          phone,
          user_type: 'USER'
        });
        onAuthSuccess(result.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-sidebar">
        <div 
          className="brand-section" 
          onClick={() => navigate('/')} 
          style={{ cursor: 'pointer' }}
          title="Back to Home"
        >
          <div className="brand-logo">B</div>
          <span className="brand-name" style={{ color: 'var(--ink)' }}>Bistro Chain</span>
        </div>
        <div>
          <h1 className="auth-sidebar-title">Bistro Restaurant Chain</h1>
          <p className="auth-sidebar-desc">
            Vibrant floor maps, instant order queues, and automated billing. Control front-of-house operations with absolute clarity.
          </p>
        </div>
        <div style={{ fontSize: '0.85rem', fontWeight: 500, opacity: 0.8 }}>
          &copy; {new Date().getFullYear()} Bistro Restaurant Chain. Crafted for taste.
        </div>
      </div>

      <div className="auth-form-container">
        <div className="auth-form-card">
          <div className="auth-header">
            <h2 className="auth-title">{isLogin ? 'Welcome Back' : 'Create Your Account'}</h2>
            <p className="auth-subtitle">
              {isLogin 
                ? 'Sign in to access your dashboard or booking' 
                : 'Sign up to book tables and order food'
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {error && (
              <div className="form-error" style={{
                padding: '0.75rem',
                backgroundColor: 'oklch(0.95 0.05 20)',
                border: '1px solid oklch(0.85 0.10 20)',
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                {error}
              </div>
            )}

            {!isLogin && (
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">First Name</label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Jane"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      style={{ paddingLeft: '2.5rem' }}
                    />
                  </div>
                </div>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">{isLogin ? 'Email or Phone Number' : 'Email Address'}</label>
              <div style={{ position: 'relative' }}>
                <Envelope size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                <input
                  type={isLogin ? 'text' : 'email'}
                  className="form-input"
                  placeholder={isLogin ? 'e.g. jane.doe@bistro.com or +91 98765 43210' : 'jane.doe@bistro.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Key size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            {!isLogin && (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                  <input
                    type="tel"
                    className="form-input"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: '0.5rem', width: '100%' }}
            >
              {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <button
              className="btn btn-secondary"
              style={{ border: 'none', background: 'none', color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem' }}
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
            >
              {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
