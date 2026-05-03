import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Upload, User, LogOut,
  FolderOpen, Award, ClipboardList,
  CreditCard, BookOpen, ArrowRight, HardDrive, BookMarked,
  GitBranch, Users
} from 'lucide-react';
import VaultLogo from './VaultLogo';
import { formatFileSize, storagePercent } from '../utils/helpers';
import './Sidebar.css';

const navItems = [
  { label: 'Dashboard',   icon: LayoutDashboard, path: '/dashboard', desc: 'Overview' },
  { label: 'My Documents',icon: FolderOpen,       path: '/documents', desc: 'All files' },
  { label: 'Upload',      icon: Upload,           path: '/upload',    desc: 'Add new' },
  { label: 'Timeline',    icon: GitBranch,        path: '/timeline',  desc: 'By year' },
  { label: 'Rooms',       icon: Users,            path: '/rooms',     desc: 'Collaborate' },
  { label: 'Profile',     icon: User,             path: '/profile',   desc: 'Account' },
];

const categoryItems = [
  { label: 'Marksheets', icon: BookMarked, path: '/documents?category=marksheet', color: 'var(--cat-marksheet)' },
  { label: 'Certificates', icon: Award, path: '/documents?category=certificate', color: 'var(--cat-certificate)' },
  { label: 'Assignments', icon: ClipboardList, path: '/documents?category=assignment', color: 'var(--cat-assignment)' },
  { label: 'ID Cards', icon: CreditCard, path: '/documents?category=id_card', color: 'var(--cat-id_card)' },
  { label: 'Admission', icon: BookOpen, path: '/documents?category=admission', color: 'var(--cat-admission)' },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    // Hard redirect — clears all React in-memory state & prevents stale data
    window.location.href = '/login';
  };

  const usedPercent = storagePercent(user?.storageUsed || 0, user?.storageLimit || 524288000);
  const isWarning = usedPercent >= 80;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <VaultLogo size={22} />
        </div>
        <div>
          <span className="sidebar-logo-text">StudentVault</span>
          <p className="sidebar-logo-sub">Document Vault</p>
        </div>
      </div>

      {/* Main Nav */}
      <nav className="sidebar-nav">
        <p className="sidebar-section-label">Menu</p>
        {navItems.map(({ label, icon: Icon, path, desc }) => (
          <Link
            key={path}
            to={path}
            className={`sidebar-nav-item ${pathname === path ? 'active' : ''}`}
          >
            <div className="sidebar-nav-icon-wrap">
              <Icon size={17} />
            </div>
            <div className="sidebar-nav-label">
              <span className="sidebar-nav-text">{label}</span>
              <span className="sidebar-nav-desc">{desc}</span>
            </div>
            {pathname === path && <ArrowRight size={13} className="sidebar-nav-chevron" />}
          </Link>
        ))}

        {/* Categories */}
        <p className="sidebar-section-label" style={{ marginTop: '24px' }}>Categories</p>
        {categoryItems.map(({ label, icon: Icon, path, color }) => (
          <Link
            key={path}
            to={path}
            className="sidebar-nav-item sidebar-nav-category"
          >
            <Icon size={16} style={{ color }} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Storage Widget */}
      <div className="sidebar-storage">
        <div className="sidebar-storage-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <HardDrive size={13} style={{ color: 'var(--color-primary-light)' }} />
            <span className="sidebar-storage-label">Storage</span>
          </div>
          <span className="sidebar-storage-percent" style={{ color: isWarning ? 'var(--color-warning)' : 'var(--color-primary-light)' }}>
            {usedPercent}%
          </span>
        </div>
        <div className="storage-bar" style={{ marginBottom: '6px' }}>
          <div
            className={`storage-bar-fill ${isWarning ? 'warning' : ''}`}
            style={{ width: `${usedPercent}%` }}
          />
        </div>
        <p className="text-xs text-muted">
          {formatFileSize(user?.storageUsed || 0)} / {formatFileSize(user?.storageLimit || 524288000)}
        </p>
      </div>

      {/* User + Logout */}
      <div className="sidebar-user">
        <div className="sidebar-user-avatar">
          {user?.name?.[0]?.toUpperCase() || 'S'}
        </div>
        <div className="sidebar-user-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <p className="sidebar-user-name">{user?.name}</p>
            <span className="sidebar-active-pill">Active</span>
          </div>
          <p className="sidebar-user-email">{user?.email}</p>
        </div>
        <button className="sidebar-logout-btn" onClick={handleLogout} title="Sign out of {user?.name}">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
