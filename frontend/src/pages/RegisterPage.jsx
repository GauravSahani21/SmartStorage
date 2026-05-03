import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Mail, Lock, Eye, EyeOff, User, Building, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import './AuthPages.css';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', institution: '', studentId: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError('Name, email and password are required');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, institution: form.institution, studentId: form.studentId });
      toast.success('Account created! Welcome to StudentVault 🎓');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
  const strengthLabels = ['', 'Weak', 'Good', 'Strong'];
  const strengthColors = ['', '#ef4444', '#f59e0b', '#10b981'];

  return (
    <div className="auth-page">
      <div className="auth-panel-left">
        <div className="auth-brand">
          <div className="auth-brand-icon"><GraduationCap size={28} /></div>
          <span className="auth-brand-text">StudentVault</span>
        </div>
        <h2 className="auth-tagline">Join thousands of students going paperless.</h2>
        <div className="auth-features">
          {['Free 500MB storage forever', 'Upload PDF, Images, Docs', 'Time-limited document sharing', 'Secure JWT authentication'].map((f) => (
            <div key={f} className="auth-feature-item">
              <span className="auth-feature-dot" />
              {f}
            </div>
          ))}
        </div>
      </div>

      <div className="auth-panel-right">
        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-card-title">Create your account</h1>
            <p className="auth-card-subtitle">Start storing your documents for free</p>
          </div>

          {error && <div className="auth-error-banner">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-name">Full Name</label>
              <div className="auth-input-wrapper">
                <User size={16} className="auth-input-icon" />
                <input id="reg-name" type="text" name="name" className="form-input auth-input" placeholder="Ravi Sharma" value={form.name} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email Address</label>
              <div className="auth-input-wrapper">
                <Mail size={16} className="auth-input-icon" />
                <input id="reg-email" type="email" name="email" className="form-input auth-input" placeholder="ravi@example.com" value={form.email} onChange={handleChange} />
              </div>
            </div>

            <div className="auth-form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="reg-institution">Institution (optional)</label>
                <div className="auth-input-wrapper">
                  <Building size={16} className="auth-input-icon" />
                  <input id="reg-institution" type="text" name="institution" className="form-input auth-input" placeholder="IIT Delhi" value={form.institution} onChange={handleChange} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="reg-studentid">Student ID (optional)</label>
                <div className="auth-input-wrapper">
                  <input id="reg-studentid" type="text" name="studentId" className="form-input" placeholder="2024CS001" value={form.studentId} onChange={handleChange} style={{ paddingLeft: '12px' }} />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <div className="auth-input-wrapper">
                <Lock size={16} className="auth-input-icon" />
                <input id="reg-password" type={showPass ? 'text' : 'password'} name="password" className="form-input auth-input auth-input-pad" placeholder="Min. 6 characters" value={form.password} onChange={handleChange} />
                <button type="button" className="auth-eye-btn" onClick={() => setShowPass((p) => !p)}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.password && (
                <div className="auth-strength">
                  <div className="auth-strength-bar">
                    {[1, 2, 3].map((lvl) => (
                      <div key={lvl} className="auth-strength-segment" style={{ background: strength >= lvl ? strengthColors[strength] : 'var(--bg-input)' }} />
                    ))}
                  </div>
                  <span style={{ color: strengthColors[strength], fontSize: '0.75rem' }}>{strengthLabels[strength]}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-confirm-password">Confirm Password</label>
              <div className="auth-input-wrapper">
                <Lock size={16} className="auth-input-icon" />
                <input id="reg-confirm-password" type="password" name="confirmPassword" className="form-input auth-input" placeholder="••••••••" value={form.confirmPassword} onChange={handleChange} />
              </div>
            </div>

            <button id="register-submit" type="submit" className="btn btn-primary w-full" disabled={loading} style={{ padding: '14px', fontSize: '0.95rem' }}>
              {loading ? <span className="spinner" /> : (<>Create Account <ArrowRight size={16} /></>)}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account?{' '}
            <Link to="/login" id="go-to-login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
