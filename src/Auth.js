import React, { useState } from 'react';
import { supabase } from './lib/supabase';
import './Auth.css';

const Auth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Configure allowed email domains here
  const ALLOWED_DOMAINS = ['moveworks.com', 'moveworks.ai']; // Add more domains as needed

  const validateEmailDomain = (email) => {
    const domain = email.split('@')[1];
    return ALLOWED_DOMAINS.includes(domain);
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    // Check email domain
    if (!validateEmailDomain(email)) {
      setError(`Only emails from ${ALLOWED_DOMAINS.join(', ')} are allowed`);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });

      if (error) throw error;

      if (data?.user?.identities?.length === 0) {
        setError('This email is already registered. Please log in instead.');
      } else {
        setMessage('✅ Check your email for the confirmation link!');
        setEmail('');
        setPassword('');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check email domain even for existing users
      if (!validateEmailDomain(email)) {
        await supabase.auth.signOut();
        setError(`Access denied. Only ${ALLOWED_DOMAINS.join(', ')} emails are allowed.`);
        return;
      }

      onAuthSuccess(data.user);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (error) throw error;
      setMessage('✅ Password reset email sent! Check your inbox.');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });

      if (error) throw error;
      setMessage('✅ Confirmation email resent! Check your inbox (and spam folder).');
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>🔒 Customer Data Manager</h1>
          <p className="auth-subtitle">
            {isLogin ? 'Sign in to continue' : 'Create your account'}
          </p>
        </div>

        {message && <div className="auth-message success">{message}</div>}
        {error && <div className="auth-message error">{error}</div>}

        <form onSubmit={isLogin ? handleLogin : handleSignUp} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder={`you@${ALLOWED_DOMAINS[0]}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="auth-input"
            />
            <small className="help-text">
              Only {ALLOWED_DOMAINS.join(', ')} emails are allowed
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="auth-input"
              minLength={6}
            />
            {!isLogin && (
              <small className="help-text">
                Must be at least 6 characters
              </small>
            )}
          </div>

          <button 
            type="submit" 
            className="auth-button primary"
            disabled={loading}
          >
            {loading ? 'Loading...' : isLogin ? 'Sign In' : 'Sign Up'}
          </button>

          {isLogin && (
            <button
              type="button"
              onClick={handleResetPassword}
              className="auth-button link"
              disabled={loading}
            >
              Forgot password?
            </button>
          )}
        </form>

        {/* Show resend button if signup was successful */}
        {!isLogin && message.includes('Check your email') && (
          <div className="resend-section">
            <p className="resend-text">Didn't receive the email?</p>
            <button
              onClick={handleResendConfirmation}
              className="auth-button secondary"
              disabled={loading}
            >
              {loading ? 'Sending...' : '📧 Resend Confirmation Email'}
            </button>
            <small className="help-text">
              Check your spam folder too!
            </small>
          </div>
        )}

        <div className="auth-toggle">
          {isLogin ? (
            <p>
              Don't have an account?{' '}
              <button
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                  setMessage('');
                }}
                className="toggle-link"
              >
                Sign up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                  setMessage('');
                }}
                className="toggle-link"
              >
                Sign in
              </button>
            </p>
          )}
        </div>

        <div className="auth-footer">
          <p>🔐 Secured with Supabase Authentication</p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
