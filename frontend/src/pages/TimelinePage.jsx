import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentsAPI } from '../services/api';
import { formatFileSize, CATEGORY_LABELS } from '../utils/helpers';
import { GitBranch, FileText, ChevronRight, HardDrive, FolderOpen } from 'lucide-react';
import './TimelinePage.css';

const CATEGORY_COLORS = {
  marksheet: '#6366f1', certificate: '#10b981', assignment: '#f59e0b',
  id_card: '#06b6d4', admission: '#8b5cf6', fee_receipt: '#ec4899', other: '#94a3b8',
};

export default function TimelinePage() {
  const navigate = useNavigate();
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    documentsAPI.getTimeline()
      .then(r => {
        setTimeline(r.data);
        if (r.data.length > 0) setSelected(r.data[0]._id);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-container">
      <div className="skeleton" style={{ height: 400, borderRadius: 20 }} />
    </div>
  );

  if (timeline.length === 0) return (
    <div className="page-container">
      <div className="empty-state">
        <div className="empty-state-icon"><GitBranch size={32} /></div>
        <h2 className="empty-state-title">No Timeline Yet</h2>
        <p className="empty-state-desc">Upload documents and set their year to build your academic timeline.</p>
      </div>
    </div>
  );

  const activeYear = timeline.find(t => t._id === selected);

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="tl-header-icon"><GitBranch size={22} /></div>
          <div>
            <h1 className="page-title">Academic Timeline</h1>
            <p className="page-subtitle">Your complete academic journey, year by year</p>
          </div>
        </div>
      </div>

      {/* Year selector rail */}
      <div className="tl-rail">
        {timeline.map((yr, i) => (
          <button
            key={yr._id}
            className={`tl-rail-item ${selected === yr._id ? 'active' : ''}`}
            onClick={() => setSelected(yr._id)}
          >
            <div className="tl-rail-dot" />
            {i < timeline.length - 1 && <div className="tl-rail-line" />}
            <span className="tl-rail-year">{yr._id}</span>
            <span className="tl-rail-count">{yr.count} docs</span>
          </button>
        ))}
      </div>

      {/* Active year content */}
      {activeYear && (
        <div className="tl-content animate-fade-in" key={activeYear._id}>
          <div className="tl-year-header">
            <h2 className="tl-year-title">{activeYear._id}</h2>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <span className="text-muted text-sm"><FolderOpen size={13} style={{ display: 'inline', marginRight: 4 }} />{activeYear.count} documents</span>
              <span className="text-muted text-sm"><HardDrive size={13} style={{ display: 'inline', marginRight: 4 }} />{formatFileSize(activeYear.totalSize)}</span>
            </div>
          </div>

          <div className="tl-docs-grid">
            {activeYear.docs.map(doc => (
              <button
                key={doc._id}
                className="tl-doc-card"
                onClick={() => navigate(`/documents/${doc._id}`)}
              >
                <div className="tl-doc-icon" style={{ background: `${CATEGORY_COLORS[doc.category]}18`, color: CATEGORY_COLORS[doc.category] }}>
                  <FileText size={20} />
                </div>
                <div className="tl-doc-info">
                  <p className="tl-doc-title">{doc.title}</p>
                  <p className="tl-doc-meta">
                    <span className="badge" style={{ background: `${CATEGORY_COLORS[doc.category]}18`, color: CATEGORY_COLORS[doc.category], fontSize: '0.68rem', padding: '1px 8px' }}>
                      {CATEGORY_LABELS[doc.category] || doc.category}
                    </span>
                    <span className="text-muted text-xs">{formatFileSize(doc.fileSize)}</span>
                  </p>
                </div>
                <ChevronRight size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
