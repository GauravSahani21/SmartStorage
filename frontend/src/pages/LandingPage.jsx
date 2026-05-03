import { Link } from 'react-router-dom';
import {
  GraduationCap, Shield, Share2, Search, Upload,
  Smartphone, Zap, Lock, Globe, ArrowRight, CheckCircle
} from 'lucide-react';
import './LandingPage.css';

const features = [
  { icon: Shield, title: 'Secure Storage', desc: 'Your documents are encrypted and stored safely in the cloud.' },
  { icon: Share2, title: 'Easy Sharing', desc: 'Share documents via time-limited links with anyone.' },
  { icon: Search, title: 'Smart Search', desc: 'Find any document instantly by name, category, or tag.' },
  { icon: Upload, title: 'Quick Upload', desc: 'Upload PDFs, images, assignments in seconds.' },
  { icon: Globe, title: 'Access Anywhere', desc: 'Login from any device and access all your documents.' },
  { icon: Zap, title: 'Lightning Fast', desc: 'Stream documents directly in the browser — no downloads needed.' },
];

const categories = [
  { emoji: '📊', label: 'Marksheets', color: '#6366f1' },
  { emoji: '🏆', label: 'Certificates', color: '#10b981' },
  { emoji: '📝', label: 'Assignments', color: '#f59e0b' },
  { emoji: '🪪', label: 'ID Cards', color: '#06b6d4' },
  { emoji: '📋', label: 'Admission', color: '#8b5cf6' },
  { emoji: '🧾', label: 'Fee Receipts', color: '#ec4899' },
];

export default function LandingPage() {
  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <GraduationCap size={22} />
          <span>StudentVault</span>
        </div>
        <div className="landing-nav-links">
          <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get Started Free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-badge">
          <Lock size={12} />
          100% Free · Secure · No Ads
        </div>
        <h1 className="landing-hero-title">
          Your Academic Documents,<br />
          <span className="landing-hero-gradient">Safe & Accessible Forever</span>
        </h1>
        <p className="landing-hero-desc">
          StudentVault is your personal digital locker for all academic documents.
          Store marksheets, certificates, assignments and more — access them from
          anywhere, anytime with just a login.
        </p>
        <div className="landing-hero-cta">
          <Link to="/register" className="btn btn-primary btn-lg">
            Create Free Account
            <ArrowRight size={18} />
          </Link>
          <Link to="/login" className="btn btn-secondary btn-lg">
            Sign In
          </Link>
        </div>

        {/* Trust badges */}
        <div className="landing-trust">
          {['500MB Free Storage', 'No Credit Card', 'Secure with JWT', 'Share Documents'].map((item) => (
            <div key={item} className="landing-trust-item">
              <CheckCircle size={14} />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {/* Hero visual */}
        <div className="landing-hero-visual">
          <div className="landing-hero-card">
            <div className="landing-hero-card-header">
              <div className="landing-hero-dots">
                <span /><span /><span />
              </div>
              <span className="landing-hero-card-title">📁 My Documents</span>
            </div>
            <div className="landing-hero-doc-list">
              {[
                { emoji: '📊', name: 'Class 12 Marksheet.pdf', cat: 'Marksheet', size: '1.2 MB' },
                { emoji: '🏆', name: 'Python Certification.pdf', cat: 'Certificate', size: '800 KB' },
                { emoji: '📝', name: 'ML Assignment Final.pdf', cat: 'Assignment', size: '2.4 MB' },
                { emoji: '🪪', name: 'College ID Card.jpg', cat: 'ID Card', size: '340 KB' },
              ].map((doc) => (
                <div key={doc.name} className="landing-hero-doc-item">
                  <span className="landing-hero-doc-emoji">{doc.emoji}</span>
                  <div className="landing-hero-doc-info">
                    <span className="landing-hero-doc-name">{doc.name}</span>
                    <span className="landing-hero-doc-cat">{doc.cat} · {doc.size}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="landing-section">
        <h2 className="landing-section-title">Store Every Type of Document</h2>
        <p className="landing-section-subtitle">Organized by category so you can find anything instantly</p>
        <div className="landing-categories">
          {categories.map(({ emoji, label, color }) => (
            <div key={label} className="landing-category-card" style={{ '--cat-color': color }}>
              <span className="landing-category-emoji">{emoji}</span>
              <span className="landing-category-label">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="landing-section landing-section-dark">
        <h2 className="landing-section-title">Everything You Need</h2>
        <p className="landing-section-subtitle">Built for students, by students</p>
        <div className="landing-features">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="landing-feature-card">
              <div className="landing-feature-icon">
                <Icon size={22} />
              </div>
              <h3 className="landing-feature-title">{title}</h3>
              <p className="landing-feature-desc">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="landing-cta-section">
        <h2 className="landing-cta-title">Ready to Go Paperless?</h2>
        <p className="landing-cta-subtitle">Join thousands of students who never lose a document again.</p>
        <Link to="/register" className="btn btn-primary btn-lg">
          Start for Free
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-logo">
          <GraduationCap size={18} />
          <span>StudentVault</span>
        </div>
        <p className="landing-footer-text">Your academic documents, always within reach.</p>
      </footer>
    </div>
  );
}
