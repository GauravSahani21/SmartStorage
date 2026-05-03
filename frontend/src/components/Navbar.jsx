import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, Upload, Zap, Menu } from 'lucide-react';
import VaultLogo from './VaultLogo';
import './Navbar.css';

export default function Navbar({ onMenuToggle, searchValue, onSearchChange }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue?.trim()) {
      navigate(`/documents?search=${encodeURIComponent(searchValue)}`);
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="navbar-menu-btn show-mobile" onClick={onMenuToggle}>
          <Menu size={20} />
        </button>
        <div className="navbar-brand hide-mobile">
          <VaultLogo size={22} className="navbar-brand-icon" />
          <span className="navbar-brand-text">StudentVault</span>
        </div>
      </div>

      {/* Search */}
      <form className="navbar-search" onSubmit={handleSearchSubmit}>
        <Search size={16} className="navbar-search-icon" />
        <input
          type="text"
          placeholder="Search documents…"
          className="navbar-search-input"
          value={searchValue || ''}
          onChange={(e) => onSearchChange?.(e.target.value)}
          id="navbar-search"
        />
      </form>

      <div className="navbar-right">
        <Link to="/upload" className="btn btn-primary btn-sm hide-mobile">
          <Upload size={15} />
          Upload
        </Link>
        <div className="navbar-avatar" title={user?.name}>
          {user?.name?.[0]?.toUpperCase() || 'S'}
        </div>
      </div>
    </header>
  );
}
