import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { formatFileSize, storagePercent, formatDate } from '../utils/helpers';
import { User, Building, Hash, Mail, Lock, Save, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, setUser, refreshUser } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    institution: user?.institution || '',
    studentId: user?.studentId || '',
  });
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPass, setShowPass] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const usedPercent = storagePercent(user?.storageUsed || 0, user?.storageLimit || 524288000);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await authAPI.updateProfile(profileForm);
      const updated = { ...user, ...data };
      localStorage.setItem('studentvault_user', JSON.stringify(updated));
      setUser(updated);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePassSave = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setSavingPass(true);
    try {
      await authAPI.changePassword({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Password changed successfully!');
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPass(false);
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Profile Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      <div className="profile-layout">
        {/* Left: Avatar + Storage */}
        <div className="profile-sidebar">
          <div className="profile-avatar-card card">
            <div className="profile-avatar">
              {user?.name?.[0]?.toUpperCase() || 'S'}
            </div>
            <h2 className="profile-name">{user?.name}</h2>
            <p className="profile-email"><Mail size={13} /> {user?.email}</p>
            {user?.institution && (
              <p className="profile-institution"><Building size={13} /> {user.institution}</p>
            )}
            <p className="text-xs text-muted" style={{ marginTop: '8px' }}>
              Member since {formatDate(user?.createdAt)}
            </p>
          </div>

          <div className="card">
            <h3 className="profile-section-title">Storage Usage</h3>
            <div className="profile-storage-info">
              <span>{formatFileSize(user?.storageUsed || 0)} used</span>
              <span>{usedPercent}%</span>
            </div>
            <div className="storage-bar" style={{ marginBottom: '8px' }}>
              <div
                className={`storage-bar-fill ${usedPercent >= 80 ? 'warning' : ''}`}
                style={{ width: `${usedPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted">
              {formatFileSize((user?.storageLimit || 524288000) - (user?.storageUsed || 0))} remaining of {formatFileSize(user?.storageLimit || 524288000)}
            </p>
          </div>
        </div>

        {/* Right: Forms */}
        <div className="profile-forms">
          {/* Profile Info */}
          <div className="card profile-form-card">
            <h3 className="profile-section-title">Personal Information</h3>
            <form onSubmit={handleProfileSave} className="profile-form">
              <div className="form-group">
                <label className="form-label" htmlFor="profile-name">Full Name</label>
                <div className="auth-input-wrapper">
                  <User size={15} className="auth-input-icon" />
                  <input
                    id="profile-name"
                    type="text"
                    className="form-input auth-input"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="auth-input-wrapper">
                  <Mail size={15} className="auth-input-icon" />
                  <input type="email" className="form-input auth-input" value={user?.email || ''} disabled style={{ opacity: 0.5 }} />
                </div>
                <p className="text-xs text-muted" style={{ marginTop: '4px' }}>Email cannot be changed</p>
              </div>

              <div className="profile-form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-institution">Institution</label>
                  <div className="auth-input-wrapper">
                    <Building size={15} className="auth-input-icon" />
                    <input
                      id="profile-institution"
                      type="text"
                      className="form-input auth-input"
                      placeholder="Your college/school"
                      value={profileForm.institution}
                      onChange={(e) => setProfileForm((p) => ({ ...p, institution: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="profile-studentid">Student ID</label>
                  <div className="auth-input-wrapper">
                    <Hash size={15} className="auth-input-icon" />
                    <input
                      id="profile-studentid"
                      type="text"
                      className="form-input auth-input"
                      placeholder="2024CS001"
                      value={profileForm.studentId}
                      onChange={(e) => setProfileForm((p) => ({ ...p, studentId: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <button id="save-profile-btn" type="submit" className="btn btn-primary" disabled={savingProfile}>
                {savingProfile ? <span className="spinner" /> : <><Save size={15} /> Save Profile</>}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="card profile-form-card">
            <h3 className="profile-section-title">Change Password</h3>
            <form onSubmit={handlePassSave} className="profile-form">
              <div className="form-group">
                <label className="form-label" htmlFor="current-password">Current Password</label>
                <div className="auth-input-wrapper">
                  <Lock size={15} className="auth-input-icon" />
                  <input
                    id="current-password"
                    type={showPass ? 'text' : 'password'}
                    className="form-input auth-input auth-input-pad"
                    placeholder="••••••••"
                    value={passForm.currentPassword}
                    onChange={(e) => setPassForm((p) => ({ ...p, currentPassword: e.target.value }))}
                  />
                  <button type="button" className="auth-eye-btn" onClick={() => setShowPass((v) => !v)}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="profile-form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="new-password">New Password</label>
                  <div className="auth-input-wrapper">
                    <Lock size={15} className="auth-input-icon" />
                    <input
                      id="new-password"
                      type="password"
                      className="form-input auth-input"
                      placeholder="Min. 6 characters"
                      value={passForm.newPassword}
                      onChange={(e) => setPassForm((p) => ({ ...p, newPassword: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="confirm-new-password">Confirm Password</label>
                  <div className="auth-input-wrapper">
                    <Lock size={15} className="auth-input-icon" />
                    <input
                      id="confirm-new-password"
                      type="password"
                      className="form-input auth-input"
                      placeholder="Re-enter password"
                      value={passForm.confirmPassword}
                      onChange={(e) => setPassForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <button id="save-password-btn" type="submit" className="btn btn-primary" disabled={savingPass}>
                {savingPass ? <span className="spinner" /> : <><Lock size={15} /> Change Password</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
