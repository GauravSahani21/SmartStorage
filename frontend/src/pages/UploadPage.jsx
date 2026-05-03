import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { documentsAPI } from '../services/api';
import { CATEGORIES } from '../utils/helpers';
import { Upload, File, X, CheckCircle, AlertCircle, CloudUpload, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import './UploadPage.css';

const ACCEPTED = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
};

export default function UploadPage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [uploadedDoc, setUploadedDoc] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', category: 'other',
    year: '', institution: '', tags: '', expiresAt: '',
  });
  const [error, setError] = useState('');

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      toast.error(rejected[0].errors[0]?.message || 'Invalid file');
      return;
    }
    const f = accepted[0];
    setFile(f);
    if (!form.title) {
      const name = f.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setForm((p) => ({ ...p, title: name }));
    }
    setError('');
  }, [form.title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: ACCEPTED, maxFiles: 1, maxSize: 10 * 1024 * 1024,
  });

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a file to upload'); return; }
    if (!form.title.trim()) { setError('Document title is required'); return; }

    setUploading(true);
    setProgress(0);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('title', form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('category', form.category);
      fd.append('year', form.year);
      fd.append('institution', form.institution.trim());
      fd.append('tags', form.tags.trim());
      if (form.expiresAt) fd.append('expiresAt', form.expiresAt);

      const { data } = await documentsAPI.upload(fd, (pct) => setProgress(pct));
      setUploadedDoc(data);
      setDone(true);
      toast.success('Document uploaded! 🎉');
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setForm({ title: '', description: '', category: 'other', year: '', institution: '', tags: '', expiresAt: '' });
    setDone(false);
    setError('');
    setUploadedDoc(null);
    setProgress(0);
  };

  if (done && uploadedDoc) {
    return (
      <div className="page-container">
        <div className="upload-success">
          <div className="upload-success-icon"><CheckCircle size={52} /></div>
          <h2>Upload Successful!</h2>
          <p>Your document has been stored securely.</p>

          {uploadedDoc.aiCategorized && (
            <div className="upload-ai-result">
              <Sparkles size={14} />
              <span>AI categorized as <strong>{uploadedDoc.category}</strong></span>
              {uploadedDoc.tags?.length > 0 && (
                <span className="text-muted"> · tags: {uploadedDoc.tags.join(', ')}</span>
              )}
            </div>
          )}

          <div className="upload-success-actions">
            <button className="btn btn-primary" onClick={resetForm}>
              <Upload size={16} /> Upload Another
            </button>
            <button className="btn btn-secondary" onClick={() => navigate(`/documents/${uploadedDoc._id}`)}>
              View Document
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/documents')}>
              All Documents
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Upload Document</h1>
        <p className="page-subtitle">Add a new document to your vault</p>
      </div>

      <div className="upload-layout">
        {/* Drop Zone */}
        <div className="upload-drop-section">
          <div
            {...getRootProps()}
            id="upload-dropzone"
            className={`upload-dropzone ${isDragActive ? 'active' : ''} ${file ? 'has-file' : ''}`}
          >
            <input {...getInputProps()} />
            {file ? (
              <div className="upload-file-preview">
                <div className="upload-file-icon"><File size={32} /></div>
                <div className="upload-file-info">
                  <p className="upload-file-name">{file.name}</p>
                  <p className="upload-file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <button
                  type="button"
                  className="upload-file-remove"
                  onClick={(e) => { e.stopPropagation(); setFile(null); setProgress(0); }}
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="upload-dropzone-inner">
                <div className="upload-dropzone-icon"><CloudUpload size={40} /></div>
                <p className="upload-dropzone-title">
                  {isDragActive ? 'Drop your file here!' : 'Drag & drop your document'}
                </p>
                <p className="upload-dropzone-subtitle">or click to browse files</p>
                <p className="upload-dropzone-hint">PDF, JPG, PNG, WEBP, DOC, DOCX · Max 10MB</p>
              </div>
            )}
          </div>

          {uploading && (
            <div className="upload-progress">
              <div className="upload-progress-header">
                <span>Uploading…</span>
                <span>{progress}%</span>
              </div>
              <div className="upload-progress-bar">
                <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              {progress === 100 && (
                <div className="upload-ai-processing">
                  <Sparkles size={14} />
                  <span>AI is categorizing your document…</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form */}
        <form className="upload-form" onSubmit={handleSubmit}>
          {error && (
            <div className="upload-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="upload-title">Document Title *</label>
            <input id="upload-title" type="text" name="title" className="form-input"
              placeholder="e.g. Class 12 Marksheet 2024" value={form.title} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="upload-description">Description</label>
            <textarea id="upload-description" name="description" className="form-input"
              placeholder="Optional description…" rows={3} value={form.description}
              onChange={handleChange} style={{ resize: 'vertical' }} />
          </div>

          <div className="upload-form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="upload-category">
                Category
                {form.category === 'other' && (
                  <span className="upload-ai-hint"><Sparkles size={10} /> AI will auto-detect</span>
                )}
              </label>
              <select id="upload-category" name="category" className="form-select"
                value={form.category} onChange={handleChange}>
                {CATEGORIES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="upload-year">Academic Year</label>
              <select id="upload-year" name="year" className="form-select"
                value={form.year} onChange={handleChange}>
                <option value="">Select Year</option>
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="upload-institution">Institution</label>
            <input id="upload-institution" type="text" name="institution" className="form-input"
              placeholder="e.g. IIT Delhi, DU, CBSE" value={form.institution} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="upload-tags">Tags (comma-separated)</label>
            <input id="upload-tags" type="text" name="tags" className="form-input"
              placeholder="e.g. science, board, 2024" value={form.tags} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="upload-expires">
              Expiry Date
              <span className="upload-field-hint"> (optional)</span>
            </label>
            <input id="upload-expires" type="date" name="expiresAt" className="form-input"
              value={form.expiresAt} onChange={handleChange}
              min={new Date().toISOString().split('T')[0]} />
          </div>

          <button
            id="upload-submit-btn"
            type="submit"
            className="btn btn-primary w-full"
            disabled={uploading || !file}
            style={{ padding: '14px', fontSize: '0.95rem', marginTop: '8px' }}
          >
            {uploading ? (
              <><span className="spinner" /> {progress < 100 ? `Uploading ${progress}%` : 'Processing…'}</>
            ) : (
              <><Upload size={17} /> Upload Document</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
