import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { roomsAPI, documentsAPI } from '../services/api';
import { formatFileSize, CATEGORY_LABELS } from '../utils/helpers';
import {
  ArrowLeft, Users, Hash, FolderOpen, Plus, X,
  FileText, Trash2, Copy, Clock, Building2
} from 'lucide-react';
import toast from 'react-hot-toast';
import './RoomDetailPage.css';

function fmt(d) {
  return d ? new Date(d).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' }) : '';
}

const CAT_COLORS = {
  marksheet:'#6366f1', certificate:'#10b981', assignment:'#f59e0b',
  id_card:'#06b6d4', admission:'#8b5cf6', fee_receipt:'#ec4899', other:'#94a3b8',
};

export default function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [myDocs, setMyDocs] = useState([]);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [adding, setAdding] = useState(null); // docId being added

  useEffect(() => {
    Promise.all([
      roomsAPI.getOne(id),
      documentsAPI.getAll(),
    ]).then(([roomRes, docsRes]) => {
      setRoom(roomRes.data);
      setMyDocs(docsRes.data);
    }).catch(() => {
      toast.error('Room not found');
      navigate('/rooms');
    }).finally(() => setLoading(false));
  }, [id]);

  const handleAddDoc = async (docId) => {
    setAdding(docId);
    try {
      await roomsAPI.addDocument(id, docId);
      // Refresh room
      const r = await roomsAPI.getOne(id);
      setRoom(r.data);
      toast.success('Document added to room!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add document');
    } finally {
      setAdding(null);
    }
  };

  const copyInviteCode = () => {
    navigator.clipboard.writeText(room.inviteCode);
    toast.success('Invite code copied!');
  };

  if (loading) return (
    <div className="page-container">
      <div className="skeleton" style={{ height: 400, borderRadius: 20 }} />
    </div>
  );

  if (!room) return null;

  // Documents already in room (IDs)
  const roomDocIds = new Set((room.documents || []).map(d => d._id || d));
  // Docs user can add (not already in room)
  const addableDocs = myDocs.filter(d => !roomDocIds.has(d._id));

  return (
    <div className="page-container animate-fade-in">
      {/* Back */}
      <button className="viewer-back-btn" onClick={() => navigate('/rooms')}>
        <ArrowLeft size={16} /> All Rooms
      </button>

      {/* Room Header */}
      <div className="rd-header">
        <div className="rd-header-left">
          <div className="rd-room-icon"><FolderOpen size={24} /></div>
          <div>
            <h1 className="page-title">{room.name}</h1>
            {room.description && <p className="page-subtitle">{room.description}</p>}
          </div>
        </div>

        <div className="rd-header-meta">
          {room.inviteCode && (
            <button className="rd-invite-btn" onClick={copyInviteCode} title="Copy invite code">
              <Hash size={13} />
              <span className="rd-invite-code">{room.inviteCode}</span>
              <Copy size={11} style={{ opacity: 0.5 }} />
            </button>
          )}
          <div className="rd-meta-pills">
            <span className="rd-pill"><Users size={12} /> {room.members?.length || 0} members</span>
            <span className="rd-pill"><FolderOpen size={12} /> {room.documents?.length || 0} docs</span>
          </div>
        </div>
      </div>

      <div className="rd-layout">
        {/* Documents in Room */}
        <div className="rd-main">
          <div className="rd-section-header">
            <h2 className="rd-section-title">Shared Documents</h2>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddDoc(v => !v)}>
              <Plus size={14} /> Add Document
            </button>
          </div>

          {/* Add document selector */}
          {showAddDoc && (
            <div className="rd-add-panel">
              <div className="rd-add-header">
                <span className="text-secondary text-sm">Your documents — click to share in this room</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setShowAddDoc(false)}><X size={13} /></button>
              </div>
              {addableDocs.length === 0 ? (
                <p className="text-muted text-sm" style={{ padding: 12 }}>All your documents are already in this room.</p>
              ) : (
                <div className="rd-add-list">
                  {addableDocs.map(doc => (
                    <button
                      key={doc._id}
                      className="rd-add-item"
                      onClick={() => handleAddDoc(doc._id)}
                      disabled={adding === doc._id}
                    >
                      <div className="rd-add-icon" style={{ background: `${CAT_COLORS[doc.category]}18`, color: CAT_COLORS[doc.category] }}>
                        <FileText size={15} />
                      </div>
                      <div style={{ flex: 1, textAlign: 'left' }}>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{doc.title}</p>
                        <p className="text-xs text-muted">{CATEGORY_LABELS[doc.category] || doc.category} · {formatFileSize(doc.fileSize)}</p>
                      </div>
                      {adding === doc._id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Plus size={14} style={{ color: 'var(--color-primary-light)', flexShrink: 0 }} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Room doc list */}
          {room.documents?.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 200 }}>
              <div className="empty-state-icon"><FolderOpen size={28} /></div>
              <h3 className="empty-state-title">No documents yet</h3>
              <p className="empty-state-desc">Add documents from your vault to share with the group.</p>
            </div>
          ) : (
            <div className="rd-doc-list">
              {room.documents.map(doc => (
                <Link
                  key={doc._id}
                  to={`/documents/${doc._id}`}
                  className="rd-doc-card"
                >
                  <div className="rd-doc-icon" style={{ background: `${CAT_COLORS[doc.category]}18`, color: CAT_COLORS[doc.category] }}>
                    <FileText size={18} />
                  </div>
                  <div className="rd-doc-info">
                    <p className="rd-doc-title">{doc.title}</p>
                    <div className="rd-doc-meta">
                      <span className="badge" style={{ background: `${CAT_COLORS[doc.category]}18`, color: CAT_COLORS[doc.category], fontSize: '0.68rem', padding: '1px 8px' }}>
                        {CATEGORY_LABELS[doc.category] || doc.category}
                      </span>
                      <span className="text-muted text-xs">{formatFileSize(doc.fileSize)}</span>
                      {doc.year && <span className="text-muted text-xs">{doc.year}</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Members sidebar */}
        <div className="rd-sidebar">
          <h2 className="rd-section-title" style={{ marginBottom: 12 }}>Members</h2>
          <div className="rd-members-list">
            {room.members?.map(member => (
              <div key={member._id} className="rd-member-item">
                <div className="rd-member-avatar">
                  {(member.name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <p className="rd-member-name">{member.name}</p>
                  {member.email && <p className="rd-member-email">{member.email}</p>}
                </div>
                {room.owner?._id === member._id && (
                  <span className="rd-owner-badge">Owner</span>
                )}
              </div>
            ))}
          </div>

          {room.expiresAt && (
            <div className="rd-expiry-notice">
              <Clock size={13} />
              <span>Expires {fmt(room.expiresAt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
