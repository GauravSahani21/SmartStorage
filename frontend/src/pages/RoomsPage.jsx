import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomsAPI } from '../services/api';
import { Users, Plus, X, Hash, Clock, LogIn, Trash2, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import './RoomsPage.css';

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : null;
}

export default function RoomsPage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [joinCode, setJoinCode] = useState('');
  const [creating, setCreating] = useState(false);

  const load = async () => {
    try {
      const r = await roomsAPI.getAll();
      setRooms(r.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name.trim()) return toast.error('Room name required');
    setCreating(true);
    try {
      const r = await roomsAPI.create(form);
      setRooms(prev => [r.data, ...prev]);
      setShowCreate(false);
      setForm({ name: '', description: '' });
      toast.success('Room created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create room');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    try {
      const r = await roomsAPI.join(joinCode.trim());
      navigate(`/rooms/${r.data.roomId}`);
      toast.success('Joined room!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid invite code');
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this room?')) return;
    try {
      await roomsAPI.delete(id);
      setRooms(prev => prev.filter(r => r._id !== id));
      toast.success('Room deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="rm-header-icon"><Users size={22} /></div>
            <div>
              <h1 className="page-title">Share Rooms</h1>
              <p className="page-subtitle">Collaborate with classmates — share documents in group rooms</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowJoin(true)}>
              <LogIn size={14} /> Join Room
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
              <Plus size={14} /> Create Room
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid-auto">
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 16 }} />)}
        </div>
      ) : rooms.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Users size={32} /></div>
          <h2 className="empty-state-title">No Rooms Yet</h2>
          <p className="empty-state-desc">Create a room to share documents with classmates, or join one with an invite code.</p>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Plus size={15} /> Create Your First Room</button>
        </div>
      ) : (
        <div className="grid-auto">
          {rooms.map(room => (
            <div key={room._id} className="rm-card" onClick={() => navigate(`/rooms/${room._id}`)}>
              <div className="rm-card-header">
                <div className="rm-card-icon"><FolderOpen size={18} /></div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {room.inviteCode && (
                    <span className="rm-invite-code"><Hash size={10} />{room.inviteCode}</span>
                  )}
                  <button className="rm-delete-btn" onClick={(e) => handleDelete(room._id, e)}><Trash2 size={13} /></button>
                </div>
              </div>
              <h3 className="rm-card-name">{room.name}</h3>
              {room.description && <p className="rm-card-desc">{room.description}</p>}
              <div className="rm-card-meta">
                <span><Users size={12} /> {room.members?.length || 0} members</span>
                <span><FolderOpen size={12} /> {room.documents?.length || 0} docs</span>
              </div>
              {room.expiresAt && (
                <div className="rm-expiry"><Clock size={11} /> Expires {formatDate(room.expiresAt)}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create Room</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}><X size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Room Name *</label>
                <input className="form-input" placeholder="e.g. CS4A Group Project" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" rows={2} placeholder="What's this room for?" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <button className="btn btn-primary w-full" onClick={handleCreate} disabled={creating}>
                {creating ? 'Creating…' : 'Create Room'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Modal */}
      {showJoin && (
        <div className="modal-overlay" onClick={() => setShowJoin(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Join a Room</h2>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowJoin(false)}><X size={14} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Invite Code</label>
                <input className="form-input" placeholder="Enter 8-character invite code" value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} style={{ textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace' }} />
              </div>
              <button className="btn btn-primary w-full" onClick={handleJoin}>Join Room</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
