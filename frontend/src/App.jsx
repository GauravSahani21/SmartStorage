import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import DocumentsPage from './pages/DocumentsPage';
import UploadPage from './pages/UploadPage';
import DocumentViewer from './pages/DocumentViewer';
import ProfilePage from './pages/ProfilePage';
import SharedDocViewer from './pages/SharedDocViewer';
import TimelinePage from './pages/TimelinePage';
import RoomsPage from './pages/RoomsPage';
import RoomDetailPage from './pages/RoomDetailPage';
import VerifyPage from './pages/VerifyPage';

// Layout components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" style={{ width: '48px', height: '48px', borderWidth: '3px' }} />
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-heading)' }}>
          Loading StudentVault…
        </p>
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}

// Auth redirect (if already logged in)
function AuthRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

// App shell (with sidebar + navbar)
function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');

  return (
    <div className="app-layout">
      <Sidebar className={sidebarOpen ? 'open' : ''} />
      <div className="main-content">
        <Navbar
          onMenuToggle={() => setSidebarOpen((p) => !p)}
          searchValue={search}
          onSearchChange={setSearch}
        />
        <main>{children}</main>
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
      <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />
      <Route path="/shared/:token" element={<SharedDocViewer />} />
      <Route path="/verify/:token" element={<VerifyPage />} />

      {/* Protected app routes */}
      <Route path="/dashboard" element={<ProtectedRoute><AppShell><Dashboard /></AppShell></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><AppShell><DocumentsPage /></AppShell></ProtectedRoute>} />
      <Route path="/documents/:id" element={<ProtectedRoute><AppShell><DocumentViewer /></AppShell></ProtectedRoute>} />
      <Route path="/upload" element={<ProtectedRoute><AppShell><UploadPage /></AppShell></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><AppShell><ProfilePage /></AppShell></ProtectedRoute>} />
      <Route path="/timeline" element={<ProtectedRoute><AppShell><TimelinePage /></AppShell></ProtectedRoute>} />
      <Route path="/rooms" element={<ProtectedRoute><AppShell><RoomsPage /></AppShell></ProtectedRoute>} />
      <Route path="/rooms/:id" element={<ProtectedRoute><AppShell><RoomDetailPage /></AppShell></ProtectedRoute>} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-card)',
              borderRadius: '12px',
              fontSize: '0.88rem',
              fontFamily: 'var(--font-body)',
              boxShadow: 'var(--shadow-lg)',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
            duration: 3500,
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}
