import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { documentsAPI } from '../services/api';
import { formatFileSize, formatRelativeTime, storagePercent, CATEGORY_LABELS, getFileIcon } from '../utils/helpers';
import { Upload, FolderOpen, FileText, Award, TrendingUp, Clock } from 'lucide-react';
import DocumentCard from '../components/DocumentCard';
import './Dashboard.css';

const COLORS = {
  marksheet: 'var(--cat-marksheet)',
  certificate: 'var(--cat-certificate)',
  assignment: 'var(--cat-assignment)',
  id_card: 'var(--cat-id_card)',
  admission: 'var(--cat-admission)',
  fee_receipt: 'var(--cat-fee_receipt)',
  other: 'var(--cat-other)',
};

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, docsRes] = await Promise.all([
          documentsAPI.getStats(),
          documentsAPI.getAll({ sort: 'newest' }),
        ]);
        setStats(statsRes.data);
        setRecentDocs(docsRes.data.slice(0, 4));
        refreshUser();
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const usedPercent = storagePercent(user?.storageUsed || 0, user?.storageLimit || 524288000);
  const isWarning = usedPercent >= 80;

  if (loading) {
    return (
      <div className="page-container">
        <div className="dashboard-skeleton">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '16px' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="page-title">Good {getGreeting()}, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="page-subtitle">Here's an overview of your document vault</p>
        </div>
        <Link to="/upload" className="btn btn-primary" id="dashboard-upload-btn">
          <Upload size={16} />
          Upload Document
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--color-primary-light)' }}>
            <FileText size={22} />
          </div>
          <div>
            <p className="stat-card-value">{stats?.totalDocuments ?? 0}</p>
            <p className="stat-card-label">Total Documents</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(6,182,212,0.12)', color: 'var(--color-accent)' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="stat-card-value">{formatFileSize(user?.storageUsed || 0)}</p>
            <p className="stat-card-label">Storage Used</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--color-success)' }}>
            <Award size={22} />
          </div>
          <div>
            <p className="stat-card-value">{stats?.categoryBreakdown?.length ?? 0}</p>
            <p className="stat-card-label">Categories</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--color-warning)' }}>
            <Clock size={22} />
          </div>
          <div>
            <p className="stat-card-value">{recentDocs.length > 0 ? formatRelativeTime(recentDocs[0]?.createdAt) : 'None'}</p>
            <p className="stat-card-label">Last Upload</p>
          </div>
        </div>
      </div>

      <div className="dashboard-body">
        {/* Storage & Category breakdown */}
        <div className="dashboard-sidebar-widgets">

          {/* Storage Card */}
          <div className="card dashboard-storage-card">
            <h3 className="dashboard-widget-title">Storage</h3>
            <div className="dashboard-storage-visual">
              <div
                className="dashboard-storage-ring"
                style={{ '--pct': usedPercent, '--ring-color': isWarning ? 'var(--color-warning)' : 'var(--color-primary)' }}
              >
                <span className="dashboard-storage-ring-text">{usedPercent}%</span>
              </div>
              <div>
                <p className="dashboard-storage-used">{formatFileSize(user?.storageUsed || 0)}</p>
                <p className="text-xs text-muted">of {formatFileSize(user?.storageLimit || 524288000)}</p>
                {isWarning && <p className="text-xs" style={{ color: 'var(--color-warning)', marginTop: '4px' }}>⚠️ Running low!</p>}
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="card">
            <h3 className="dashboard-widget-title">By Category</h3>
            {stats?.categoryBreakdown?.length > 0 ? (
              <div className="dashboard-categories">
                {stats.categoryBreakdown.map(({ _id, count, size }) => (
                  <div key={_id} className="dashboard-category-row">
                    <div className="dashboard-category-dot" style={{ background: COLORS[_id] || COLORS.other }} />
                    <span className="dashboard-category-name">{CATEGORY_LABELS[_id] || _id}</span>
                    <span className="dashboard-category-count">{count}</span>
                    <span className="dashboard-category-size">{formatFileSize(size)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted" style={{ textAlign: 'center', padding: '20px 0' }}>
                No documents yet
              </p>
            )}
          </div>
        </div>

        {/* Recent Docs */}
        <div className="dashboard-recent">
          <div className="flex justify-between items-center mb-4">
            <h3 className="dashboard-widget-title">Recent Documents</h3>
            <Link to="/documents" className="btn btn-ghost btn-sm">View All</Link>
          </div>
          {recentDocs.length > 0 ? (
            <div className="grid-auto">
              {recentDocs.map((doc) => (
                <DocumentCard key={doc._id} doc={doc} onDelete={(id) => setRecentDocs((p) => p.filter((d) => d._id !== id))} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-icon"><FolderOpen size={36} /></div>
              <p className="empty-state-title">No documents yet</p>
              <p className="empty-state-desc">Upload your first document to get started.</p>
              <Link to="/upload" className="btn btn-primary">
                <Upload size={15} /> Upload Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}
