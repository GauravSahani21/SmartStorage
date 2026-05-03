import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { documentsAPI } from '../services/api';
import { formatFileSize, CATEGORY_LABELS } from '../utils/helpers';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import { TrendingUp, HardDrive, FolderOpen, AlertTriangle } from 'lucide-react';
import './AnalyticsPage.css';

const CATEGORY_COLORS = {
  marksheet: '#6366f1', certificate: '#10b981', assignment: '#f59e0b',
  id_card: '#06b6d4', admission: '#8b5cf6', fee_receipt: '#ec4899', other: '#94a3b8',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    documentsAPI.getStats()
      .then(r => setStats(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page-container">
      <div className="grid-2">
        {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 16 }} />)}
      </div>
    </div>
  );

  const pieData = (stats.categoryBreakdown || []).map(c => ({
    name: CATEGORY_LABELS[c._id] || c._id,
    value: c.count,
    size: c.size,
    color: CATEGORY_COLORS[c._id] || '#94a3b8',
  }));

  const barData = (stats.uploadsByMonth || []).map(m => ({
    name: MONTHS[(m._id.month - 1)],
    uploads: m.count,
  }));

  const storagePercent = Math.min(100, Math.round((stats.storageUsed / stats.storageLimit) * 100));

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="an-header-icon"><TrendingUp size={22} /></div>
          <div>
            <h1 className="page-title">Analytics</h1>
            <p className="page-subtitle">Insights into your document vault</p>
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="card">
          <p className="text-muted text-xs" style={{ marginBottom: 4 }}>Total Documents</p>
          <p className="an-kpi">{stats.totalDocuments}</p>
        </div>
        <div className="card">
          <p className="text-muted text-xs" style={{ marginBottom: 4 }}>Storage Used</p>
          <p className="an-kpi">{formatFileSize(stats.storageUsed)}</p>
          <p className="text-muted text-xs">{storagePercent}% of {formatFileSize(stats.storageLimit)}</p>
        </div>
        <div className="card">
          <p className="text-muted text-xs" style={{ marginBottom: 4 }}>Categories</p>
          <p className="an-kpi">{pieData.length}</p>
        </div>
        <div className={`card ${stats.expiringCount > 0 ? 'an-expiry-card' : ''}`}>
          <p className="text-muted text-xs" style={{ marginBottom: 4 }}>Expiring Soon</p>
          <p className="an-kpi" style={{ color: stats.expiringCount > 0 ? 'var(--color-warning)' : undefined }}>
            {stats.expiringCount}
          </p>
          {stats.expiringCount > 0 && (
            <Link to="/documents" className="text-xs" style={{ color: 'var(--color-warning)' }}>
              <AlertTriangle size={11} style={{ display: 'inline' }} /> View docs
            </Link>
          )}
        </div>
      </div>

      {/* Charts row */}
      <div className="grid-2" style={{ marginBottom: 28 }}>
        {/* Donut chart */}
        <div className="card">
          <h3 className="an-chart-title"><FolderOpen size={15} /> Storage by Category</h3>
          {pieData.length === 0 ? <p className="text-muted text-sm">No data yet</p> : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip
                    formatter={(v, n, p) => [`${v} docs (${formatFileSize(p.payload.size)})`, p.payload.name]}
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="an-legend">
                {pieData.map((d, i) => (
                  <div key={i} className="an-legend-item">
                    <span className="an-legend-dot" style={{ background: d.color }} />
                    <span className="text-sm">{d.name}</span>
                    <span className="text-muted text-xs">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bar chart */}
        <div className="card">
          <h3 className="an-chart-title"><TrendingUp size={15} /> Uploads — Last 12 Months</h3>
          {barData.length === 0 ? <p className="text-muted text-sm">No data yet</p> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-card)', borderRadius: 8 }}
                  labelStyle={{ color: 'var(--text-primary)' }}
                />
                <Bar dataKey="uploads" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Storage bar */}
      <div className="card">
        <div className="an-storage-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HardDrive size={16} style={{ color: 'var(--color-primary-light)' }} />
            <span className="font-semibold">Storage Usage</span>
          </div>
          <span className="text-secondary text-sm">{formatFileSize(stats.storageUsed)} / {formatFileSize(stats.storageLimit)}</span>
        </div>
        <div className="storage-bar" style={{ height: 12, marginTop: 12 }}>
          <div className={`storage-bar-fill ${storagePercent >= 80 ? 'warning' : ''}`} style={{ width: `${storagePercent}%` }} />
        </div>
        <p className="text-muted text-xs" style={{ marginTop: 8 }}>{storagePercent}% used · {formatFileSize(stats.storageLimit - stats.storageUsed)} remaining</p>
      </div>
    </div>
  );
}
