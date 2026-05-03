import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { documentsAPI } from '../services/api';
import { formatFileSize, formatDate, CATEGORY_LABELS } from '../utils/helpers';
import {
  ArrowLeft, Download, Share2, Trash2, Pencil, X,
  CalendarDays, Building2, Tag, Copy, FileText,
  ImageIcon, FileArchive, Link2, ShieldOff,
  Sparkles, Eye, QrCode, Shield, ChevronDown, ChevronUp,
  Clock, MapPin, Monitor, Users
} from 'lucide-react';
import toast from 'react-hot-toast';
import './DocumentViewer.css';

export default function DocumentViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [blobUrl, setBlobUrl] = useState(null);
  const blobRef = useRef(null);
  const [isRoomAccess, setIsRoomAccess] = useState(false); // viewing via room, not owner

  // Feature states
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState('');
  const [showSummary, setShowSummary] = useState(false);
  const [viewLogs, setViewLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [shareWatermark, setShareWatermark] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const fileUrl = documentsAPI.getFile(id);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await documentsAPI.getOne(id);
        setDoc(data);
        setIsRoomAccess(!!data._roomAccess); // set by backend for non-owners
        setEditForm({
          title: data.title, description: data.description,
          year: data.year, institution: data.institution,
          tags: data.tags?.join(', ') || ''
        });
        if (data.isShared && data.shareToken) {
          setShareLink(`${window.location.origin}/shared/${data.shareToken}`);
          if (data.qrCode) setQrCode(data.qrCode);
        }
        if (data.aiSummary) { setSummary(data.aiSummary); }

        // Pre-fetch file blob for authenticated preview
        if (data.mimeType?.startsWith('image/') || data.mimeType === 'application/pdf') {
          const token = localStorage.getItem('studentvault_token');
          const resp = await fetch(documentsAPI.getFile(data._id || id), {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (resp.ok) {
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            blobRef.current = url;
            setBlobUrl(url);
          }
        }
      } catch {
        toast.error('Document not found');
        navigate('/documents');
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { if (blobRef.current) URL.revokeObjectURL(blobRef.current); };
  }, [id]);

  // ── Share ──────────────────────────────────────────────────────────────────
  const handleShare = async () => {
    setSharing(true);
    try {
      const { data } = await documentsAPI.share(id, {
        expiryDays: 7,
        watermark: shareWatermark,
      });
      setShareLink(data.shareLink);
      if (data.qrCode) setQrCode(data.qrCode);
      setDoc((p) => ({ ...p, isShared: true, shareToken: data.shareToken, qrCode: data.qrCode }));
      await navigator.clipboard.writeText(data.shareLink).catch(() => {});
      toast.success('Share link created & copied!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate link');
    } finally {
      setSharing(false);
    }
  };

  const handleRevokeShare = async () => {
    try {
      await documentsAPI.revokeShare(id);
      setShareLink('');
      setQrCode('');
      setDoc((p) => ({ ...p, isShared: false }));
      toast.success('Share link revoked');
    } catch {
      toast.error('Failed to revoke');
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirm(`Delete "${doc?.title}"? This cannot be undone.`)) return;
    try {
      await documentsAPI.delete(id);
      toast.success('Document deleted');
      navigate('/documents');
    } catch {
      toast.error('Delete failed');
    }
  };

  // ── Edit ───────────────────────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    try {
      const { data } = await documentsAPI.update(id, {
        ...editForm,
        tags: editForm.tags,
      });
      setDoc(data);
      setEditing(false);
      toast.success('Document updated');
    } catch {
      toast.error('Update failed');
    }
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = doc.originalName;
    a.click();
  };

  // ── AI Summarize ───────────────────────────────────────────────────────────
  const handleSummarize = async () => {
    if (summary) { setShowSummary((v) => !v); return; }
    setSummarizing(true);
    setShowSummary(true);
    try {
      const { data } = await documentsAPI.summarize(id);
      setSummary(data.summary);
      toast.success(data.cached ? 'Summary loaded from cache' : '✨ AI summary ready!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Summarization failed';
      toast.error(msg);
      setShowSummary(false);
    } finally {
      setSummarizing(false);
    }
  };

  // ── View Logs ──────────────────────────────────────────────────────────────
  const handleLoadLogs = async () => {
    if (showLogs) { setShowLogs(false); return; }
    setLoadingLogs(true);
    setShowLogs(true);
    try {
      const { data } = await documentsAPI.getViewLogs(id);
      setViewLogs(data);
    } catch {
      toast.error('Failed to load view logs');
    } finally {
      setLoadingLogs(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page-container">
        <div className="skeleton" style={{ height: '600px', borderRadius: '20px' }} />
      </div>
    );
  }

  const isImage = doc?.mimeType?.startsWith('image/');
  const isPdf   = doc?.mimeType === 'application/pdf';
  const canSummarize = isPdf;

  return (
    <div className="page-container animate-fade-in">
      <button className="viewer-back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={16} /> Back
      </button>

      {/* Room-access read-only banner */}
      {isRoomAccess && (
        <div className="viewer-room-banner">
          <Users size={14} />
          <span>Shared with you via a Room &mdash; <strong>Read Only</strong>. You can preview and download this document.</span>
        </div>
      )}

      <div className="viewer-layout">
        {/* ── Preview Panel ── */}
        <div className="viewer-preview">
          {isImage ? (
            blobUrl ? (
              <img src={blobUrl} alt={doc.title} className="viewer-image" />
            ) : (
              <div className="viewer-no-preview">
                <ImageIcon size={40} strokeWidth={1.2} />
                <p>Loading preview…</p>
              </div>
            )
          ) : isPdf ? (
            blobUrl ? (
              <iframe src={blobUrl} title={doc.title} className="viewer-iframe" />
            ) : (
              <div className="viewer-no-preview">
                <FileText size={40} strokeWidth={1.2} />
                <p>Loading PDF…</p>
              </div>
            )
          ) : (
            <div className="viewer-no-preview">
              <FileArchive size={48} strokeWidth={1} style={{ color: 'var(--color-primary-light)', opacity: 0.6 }} />
              <p>Preview not available for this file type.</p>
              <button className="btn btn-primary" onClick={handleDownload}>
                <Download size={16} /> Download to View
              </button>
            </div>
          )}
        </div>

        {/* ── Info Panel ── */}
        <div className="viewer-info">
          {!editing ? (
            <>
              <div className="viewer-info-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`badge badge-${doc.category}`}>
                    {CATEGORY_LABELS[doc.category] || doc.category}
                  </span>
                  {doc.aiCategorized && (
                    <span className="viewer-ai-badge" title="AI categorized">
                      <Sparkles size={10} /> AI
                    </span>
                  )}
                </div>
                {!isRoomAccess && (
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)} id="viewer-edit-btn">
                    <Pencil size={13} /> Edit
                  </button>
                )}
              </div>

              <h1 className="viewer-title">{doc.title}</h1>
              {doc.description && <p className="viewer-desc">{doc.description}</p>}

              <div className="viewer-meta">
                {doc.institution && (
                  <div className="viewer-meta-item">
                    <Building2 size={14} />
                    <span>{doc.institution}</span>
                  </div>
                )}
                {doc.year && (
                  <div className="viewer-meta-item">
                    <CalendarDays size={14} />
                    <span>{doc.year}</span>
                  </div>
                )}
                <div className="viewer-meta-item">
                  <CalendarDays size={14} />
                  <span>Uploaded {formatDate(doc.createdAt)}</span>
                </div>
                <div className="viewer-meta-item">
                  <span className="text-muted">Size:</span>
                  <span>{formatFileSize(doc.fileSize)}</span>
                </div>
                {doc.expiresAt && (
                  <div className="viewer-meta-item" style={{ color: 'var(--color-warning)' }}>
                    <Clock size={14} />
                    <span>Expires {formatDate(doc.expiresAt)}</span>
                  </div>
                )}
              </div>

              {doc.tags?.length > 0 && (
                <div className="viewer-tags">
                  {doc.tags.map((t) => (
                    <span key={t} className="doc-card-tag"><Tag size={10} />{t}</span>
                  ))}
                </div>
              )}

              {/* ── AI Summary ── */}
              {canSummarize && (
                <div className="viewer-ai-section">
                  <button
                    className={`btn w-full ${showSummary ? 'btn-ghost' : 'btn-ai'}`}
                    onClick={handleSummarize}
                    disabled={summarizing}
                  >
                    <Sparkles size={15} />
                    {summarizing ? 'AI is reading…' :
                      summary ? (showSummary ? 'Hide AI Summary' : 'Show AI Summary') :
                      '✨ Summarize with AI'}
                  </button>

                  {showSummary && (
                    <div className="viewer-summary-box">
                      {summarizing ? (
                        <div className="viewer-summary-loading">
                          <div className="spinner" />
                          <p>Gemini is reading your document…</p>
                        </div>
                      ) : (
                        <div className="viewer-summary-content">
                          {summary.split('\n').filter(Boolean).map((line, i) => (
                            <p key={i} className="viewer-summary-line">{line}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* ── Edit Form ── */
            <div className="viewer-edit-form">
              <div className="flex justify-between items-center mb-4">
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem' }}>Edit Document</h2>
                <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}><X size={14} /></button>
              </div>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={editForm.title} onChange={(e) => setEditForm((p) => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={3} value={editForm.description} onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Institution</label>
                <input className="form-input" value={editForm.institution} onChange={(e) => setEditForm((p) => ({ ...p, institution: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Year</label>
                <input className="form-input" value={editForm.year} onChange={(e) => setEditForm((p) => ({ ...p, year: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Tags (comma-separated)</label>
                <input className="form-input" value={editForm.tags} onChange={(e) => setEditForm((p) => ({ ...p, tags: e.target.value }))} />
              </div>
              <button className="btn btn-primary w-full" onClick={handleSaveEdit}>Save Changes</button>
            </div>
          )}

          <div className="divider" />

          {/* ── Actions ── */}
          <div className="viewer-actions">
            <button className="btn btn-secondary w-full" onClick={handleDownload} id="viewer-download-btn">
              <Download size={16} /> Download
            </button>

            {/* Share section — owner only */}
            {!isRoomAccess && (
              doc.isShared && shareLink ? (
                <div className="viewer-share-box">
                  {/* Link row */}
                  <div className="viewer-share-link-row">
                    <Link2 size={13} style={{ color: 'var(--color-success)', flexShrink: 0 }} />
                    <input className="viewer-share-link-input" value={shareLink} readOnly />
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => { navigator.clipboard.writeText(shareLink); toast.success('Copied!'); }}
                      title="Copy link"
                    >
                      <Copy size={14} />
                    </button>
                  </div>

                  {/* QR Code */}
                  {qrCode && (
                    <div className="viewer-qr-section">
                      <button className="viewer-qr-toggle" onClick={() => setShowQr((v) => !v)}>
                        <QrCode size={13} /> {showQr ? 'Hide QR Code' : 'Show QR Code'}
                        {showQr ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                      {showQr && (
                        <div className="viewer-qr-box">
                          <img src={qrCode} alt="QR Code" className="viewer-qr-img" />
                          <p className="viewer-qr-hint">Scan to verify this document</p>
                          <a href={`/verify/${doc.shareToken}`} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm w-full">
                            <Shield size={13} /> Open Verify Page
                          </a>
                          <a href={qrCode} download={`${doc.title}-qr.png`} className="btn btn-ghost btn-sm w-full">
                            <Download size={13} /> Download QR
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* View Logs */}
                  <button className="viewer-logs-toggle" onClick={handleLoadLogs}>
                    <Eye size={13} /> {showLogs ? 'Hide' : 'Show'} View Logs
                    {showLogs ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                  {showLogs && (
                    <div className="viewer-logs-box">
                      {loadingLogs ? (
                        <div style={{ textAlign: 'center', padding: 16 }}><div className="spinner" /></div>
                      ) : viewLogs.length === 0 ? (
                        <p className="text-muted text-sm" style={{ textAlign: 'center', padding: 12 }}>No views yet</p>
                      ) : (
                        viewLogs.map((log) => (
                          <div key={log._id} className="viewer-log-item">
                            <Monitor size={12} style={{ flexShrink: 0, color: 'var(--color-primary-light)' }} />
                            <div className="viewer-log-info">
                              <span className="viewer-log-ip">{log.ip || 'Unknown IP'}</span>
                              <span className="viewer-log-time">{formatDate(log.viewedAt)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  <button className="btn btn-danger btn-sm w-full" onClick={handleRevokeShare}>
                    <ShieldOff size={14} /> Revoke Share Link
                  </button>
                </div>
              ) : (
                <div className="viewer-share-pre">
                  <label className="viewer-watermark-toggle">
                    <input type="checkbox" checked={shareWatermark} onChange={(e) => setShareWatermark(e.target.checked)} />
                    <Shield size={13} />
                    <span>Add watermark protection</span>
                  </label>
                  <button className="btn btn-secondary w-full" onClick={handleShare} disabled={sharing} id="viewer-share-btn">
                    <Share2 size={16} />
                    {sharing ? 'Generating…' : 'Share Document'}
                  </button>
                </div>
              )
            )}

            {/* Delete — owner only */}
            {!isRoomAccess && (
              <button className="btn btn-danger w-full" onClick={handleDelete} id="viewer-delete-btn">
                <Trash2 size={16} /> Delete Document
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
