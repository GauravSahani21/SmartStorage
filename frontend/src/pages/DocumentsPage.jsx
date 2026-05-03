import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { documentsAPI } from '../services/api';
import { CATEGORIES, SORT_OPTIONS } from '../utils/helpers';
import DocumentCard from '../components/DocumentCard';
import { Upload, LayoutGrid, List, Search, Filter, X, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import './DocumentsPage.css';

export default function DocumentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [availableCategories, setAvailableCategories] = useState([]);

  // Filters from URL
  const category = searchParams.get('category') || 'all';
  const search = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';
  const year = searchParams.get('year') || '';

  const [localSearch, setLocalSearch] = useState(search);

  // Fetch unique categories from stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await documentsAPI.getStats();
        if (data.categoryBreakdown) {
          const cats = data.categoryBreakdown.map(c => c._id).filter(Boolean);
          setAvailableCategories([...new Set(cats)]);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };
    fetchStats();
  }, []);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { sort };
      if (category !== 'all') params.category = category;
      if (search) params.search = search;
      if (year) params.year = year;
      const { data } = await documentsAPI.getAll(params);
      setDocs(data);
    } catch {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [category, search, sort, year]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchParams({});
    setLocalSearch('');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setParam('search', localSearch.trim());
  };

  const handleDelete = (id) => {
    setDocs((p) => p.filter((d) => d._id !== id));
  };

  const hasFilters = category !== 'all' || search || year;

  return (
    <div className="page-container animate-fade-in">
      <div className="docs-header">
        <div>
          <h1 className="page-title">My Documents</h1>
          <p className="page-subtitle">{docs.length} document{docs.length !== 1 ? 's' : ''}</p>
        </div>
        <Link to="/upload" className="btn btn-primary" id="docs-upload-btn">
          <Upload size={16} />
          Upload
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="docs-filter-bar">
        {/* Search */}
        <form className="docs-search-form" onSubmit={handleSearchSubmit}>
          <Search size={15} className="docs-search-icon" />
          <input
            id="docs-search-input"
            type="text"
            className="docs-search-input"
            placeholder="Search by title, institution, tag…"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
          {localSearch && (
            <button type="button" className="docs-search-clear" onClick={() => { setLocalSearch(''); setParam('search', ''); }}>
              <X size={14} />
            </button>
          )}
        </form>

        <select
          id="docs-category-filter"
          className="form-select docs-select"
          value={category}
          onChange={(e) => setParam('category', e.target.value)}
        >
          <option value="all">All Categories</option>
          {availableCategories.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat] || cat.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </option>
          ))}
        </select>

        {/* Year filter */}
        <select
          id="docs-year-filter"
          className="form-select docs-select"
          value={year}
          onChange={(e) => setParam('year', e.target.value)}
        >
          <option value="">All Years</option>
          {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          id="docs-sort"
          className="form-select docs-select"
          value={sort}
          onChange={(e) => setParam('sort', e.target.value)}
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* View toggle */}
        <div className="docs-view-toggle">
          <button
            id="docs-grid-view"
            className={`docs-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            id="docs-list-view"
            className={`docs-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
          >
            <List size={16} />
          </button>
        </div>

        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={clearFilters}>
            <Filter size={14} />
            Clear
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className={viewMode === 'grid' ? 'grid-auto' : 'docs-list'}>
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: viewMode === 'grid' ? '220px' : '70px', borderRadius: '16px' }} />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><FolderOpen size={36} /></div>
          <p className="empty-state-title">No documents found</p>
          <p className="empty-state-desc">
            {hasFilters ? 'Try adjusting your filters.' : 'Upload your first document to get started!'}
          </p>
          {!hasFilters && (
            <Link to="/upload" className="btn btn-primary">
              <Upload size={15} /> Upload Now
            </Link>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid-auto' : 'docs-list'}>
          {docs.map((doc) => (
            <DocumentCard
              key={doc._id}
              doc={doc}
              onDelete={handleDelete}
              onRefresh={fetchDocs}
              listMode={viewMode === 'list'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
