import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { documentsAPI } from '../services/api';
import {
  FileText, Trash2, Share2, Eye, MoreVertical,
  Calendar, Building, Tag, Download
} from 'lucide-react';
import { formatFileSize, formatRelativeTime, getFileIcon, CATEGORY_LABELS, truncate } from '../utils/helpers';
import toast from 'react-hot-toast';
import './DocumentCard.css';

export default function DocumentCard({ doc, onDelete, onRefresh }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleShare = async (e) => {
    e.stopPropagation();
    setSharing(true);
    try {
      const { data } = await documentsAPI.share(doc._id, { expiryDays: 7 });
      await navigator.clipboard.writeText(data.shareLink);
      toast.success('Share link copied to clipboard!');
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate link');
    } finally {
      setSharing(false);
      setMenuOpen(false);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      await documentsAPI.delete(doc._id);
      toast.success('Document deleted');
      onDelete?.(doc._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
      setMenuOpen(false);
    }
  };

  const handleView = () => {
    navigate(`/documents/${doc._id}`);
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    const url = documentsAPI.getFile(doc._id);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.originalName;
    a.click();
    setMenuOpen(false);
  };

  return (
    <div className="doc-card animate-slide-up" onClick={handleView}>
      {/* File Icon / Preview */}
      <div className="doc-card-icon">
        <span className="doc-card-emoji">{getFileIcon(doc.mimeType)}</span>
        <span className={`badge badge-${doc.category}`}>
          {CATEGORY_LABELS[doc.category] || doc.category}
        </span>
      </div>

      {/* Info */}
      <div className="doc-card-body">
        <h3 className="doc-card-title" title={doc.title}>{truncate(doc.title, 36)}</h3>

        {doc.description && (
          <p className="doc-card-desc">{truncate(doc.description, 60)}</p>
        )}

        <div className="doc-card-meta">
          {doc.institution && (
            <span className="doc-card-meta-item">
              <Building size={11} />
              {truncate(doc.institution, 24)}
            </span>
          )}
          {doc.year && (
            <span className="doc-card-meta-item">
              <Calendar size={11} />
              {doc.year}
            </span>
          )}
        </div>

        {doc.tags?.length > 0 && (
          <div className="doc-card-tags">
            {doc.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="doc-card-tag">
                <Tag size={9} />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="doc-card-footer">
        <div className="doc-card-footer-left">
          <span className="doc-card-size">{formatFileSize(doc.fileSize)}</span>
          <span className="doc-card-date">{formatRelativeTime(doc.createdAt)}</span>
        </div>

        <div className="doc-card-actions" onClick={(e) => e.stopPropagation()}>
          <button className="doc-card-action-btn" onClick={handleView} title="View">
            <Eye size={15} />
          </button>
          <button className="doc-card-action-btn" onClick={handleShare} disabled={sharing} title="Share">
            <Share2 size={15} />
          </button>
          <button className="doc-card-action-btn" onClick={handleDownload} title="Download">
            <Download size={15} />
          </button>
          <button
            className="doc-card-action-btn danger"
            onClick={handleDelete}
            disabled={deleting}
            title="Delete"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Shared indicator */}
      {doc.isShared && (
        <div className="doc-card-shared-badge">
          <Share2 size={10} />
          Shared
        </div>
      )}
    </div>
  );
}
