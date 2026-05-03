import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { documentsAPI } from '../services/api';
import { formatFileSize, formatDate, CATEGORY_LABELS, getFileIcon } from '../utils/helpers';
import { GraduationCap, Download, Calendar, Building, User, Clock } from 'lucide-react';
import './SharedDocViewer.css';

export default function SharedDocViewer() {
  const { token } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fileUrl = documentsAPI.getSharedFile(token);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await documentsAPI.getShared(token);
        setDoc(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Document not found or link has expired');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = doc.title;
    a.click();
  };

  const isImage = doc?.mimeType?.startsWith('image/');
  const isPdf = doc?.mimeType === 'application/pdf';

  return (
    <div className="shared-page">
      {/* Branded Header */}
      <div className="shared-header">
        <div className="shared-brand">
          <GraduationCap size={20} />
          <span>StudentVault</span>
        </div>
        <span className="shared-badge">Shared Document</span>
      </div>

      <div className="shared-content">
        {loading ? (
          <div className="loading-screen">
            <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }} />
            <p className="text-secondary">Loading document…</p>
          </div>
        ) : error ? (
          <div className="shared-error">
            <span style={{ fontSize: '3rem' }}>🔗</span>
            <h2>Link Unavailable</h2>
            <p>{error}</p>
            <a href="/" className="btn btn-primary">Go to StudentVault</a>
          </div>
        ) : (
          <div className="shared-layout">
            {/* Preview */}
            <div className="shared-preview">
              {isImage ? (
                <img src={fileUrl} alt={doc.title} className="shared-image" />
              ) : isPdf ? (
                <iframe src={fileUrl} title={doc.title} className="shared-iframe" />
              ) : (
                <div className="shared-no-preview">
                  <span style={{ fontSize: '4rem' }}>{getFileIcon(doc.mimeType)}</span>
                  <p>Preview not available for this file type</p>
                  <button className="btn btn-primary" onClick={handleDownload}>
                    <Download size={16} /> Download to View
                  </button>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="shared-info">
              <span className={`badge badge-${doc.category}`}>
                {CATEGORY_LABELS[doc.category] || doc.category}
              </span>
              <h1 className="shared-title">{doc.title}</h1>
              {doc.description && <p className="shared-desc">{doc.description}</p>}

              <div className="shared-meta">
                <div className="shared-meta-item">
                  <User size={14} />
                  <span>Shared by <strong>{doc.owner?.name}</strong></span>
                </div>
                {doc.owner?.institution && (
                  <div className="shared-meta-item">
                    <Building size={14} />
                    <span>{doc.owner.institution}</span>
                  </div>
                )}
                {doc.institution && doc.institution !== doc.owner?.institution && (
                  <div className="shared-meta-item">
                    <Building size={14} />
                    <span>{doc.institution}</span>
                  </div>
                )}
                {doc.year && (
                  <div className="shared-meta-item">
                    <Calendar size={14} />
                    <span>{doc.year}</span>
                  </div>
                )}
                {doc.shareExpiresAt && (
                  <div className="shared-meta-item" style={{ color: 'var(--color-warning)' }}>
                    <Clock size={14} />
                    <span>Expires {formatDate(doc.shareExpiresAt)}</span>
                  </div>
                )}
                <div className="shared-meta-item">
                  <span className="text-muted">Size:</span>
                  <span>{formatFileSize(doc.fileSize)}</span>
                </div>
              </div>

              <div className="divider" />

              <button className="btn btn-primary w-full" onClick={handleDownload} id="shared-download-btn">
                <Download size={16} /> Download Document
              </button>

              <div className="shared-cta">
                <p>Want to store your own documents?</p>
                <a href="/register" className="btn btn-secondary w-full">Create Free Account</a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
