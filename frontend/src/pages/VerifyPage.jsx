import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { documentsAPI } from '../services/api';
import { formatFileSize, formatDate, CATEGORY_LABELS } from '../utils/helpers';
import { ShieldCheck, ShieldX, Calendar, Building2, FileText, ExternalLink, Loader2 } from 'lucide-react';
import './VerifyPage.css';

const CATEGORY_COLORS = {
  marksheet: '#6366f1', certificate: '#10b981', assignment: '#f59e0b',
  id_card: '#06b6d4', admission: '#8b5cf6', fee_receipt: '#ec4899', other: '#94a3b8',
};

export default function VerifyPage() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await documentsAPI.verify(token);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Verification failed');
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [token]);

  if (loading) return (
    <div className="verify-container">
      <div className="verify-card">
        <Loader2 size={40} className="verify-spinner" />
        <p className="text-secondary" style={{ marginTop: 16 }}>Verifying document…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="verify-container">
      <div className="verify-card verify-card--fail">
        <div className="verify-icon verify-icon--fail"><ShieldX size={48} /></div>
        <h1 className="verify-title verify-title--fail">Verification Failed</h1>
        <p className="verify-desc">{error}</p>
        <Link to="/" className="btn btn-secondary" style={{ marginTop: 20 }}>Go Home</Link>
      </div>
    </div>
  );

  return (
    <div className="verify-container">
      <div className="verify-card verify-card--success">
        {/* Shield animation */}
        <div className="verify-icon verify-icon--success">
          <ShieldCheck size={52} />
        </div>

        <div className="verify-badge">✅ Verified by StudentVault</div>

        <h1 className="verify-title">{data.title}</h1>

        <span
          className="badge"
          style={{ background: `${CATEGORY_COLORS[data.category]}20`, color: CATEGORY_COLORS[data.category], marginBottom: 8 }}
        >
          {CATEGORY_LABELS[data.category] || data.category}
        </span>

        <div className="verify-meta">
          {data.ownerName && (
            <div className="verify-meta-row">
              <span className="verify-meta-label">Owner</span>
              <span className="verify-meta-value">{data.ownerName}</span>
            </div>
          )}
          {data.institution && (
            <div className="verify-meta-row">
              <Building2 size={14} />
              <span className="verify-meta-value">{data.institution}</span>
            </div>
          )}
          <div className="verify-meta-row">
            <Calendar size={14} />
            <span className="verify-meta-value">Uploaded {formatDate(data.uploadedAt)}</span>
          </div>
          <div className="verify-meta-row">
            <FileText size={14} />
            <span className="verify-meta-value">{formatFileSize(data.fileSize)} · {data.mimeType}</span>
          </div>
          {data.shareExpiresAt && (
            <div className="verify-meta-row">
              <span className="verify-meta-label">Link valid until</span>
              <span className="verify-meta-value">{formatDate(data.shareExpiresAt)}</span>
            </div>
          )}
        </div>

        <div className="verify-footer">
          <div className="verify-footer-brand">
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Verified by</span>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: 'var(--color-primary-light)' }}>StudentVault</span>
          </div>
          <a
            href={`/shared/${token}`}
            className="btn btn-secondary btn-sm"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink size={13} /> View Document
          </a>
        </div>
      </div>
    </div>
  );
}
