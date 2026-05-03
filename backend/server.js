import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import roomRoutes from './routes/rooms.js';

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === 'production';

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS — only needed in dev (in prod, frontend is served from same origin)
if (!isProd) {
  const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error(`CORS: origin ${origin} not allowed`));
      },
      credentials: true,
    })
  );
}

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
});

// Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging
if (!isProd) {
  app.use(morgan('dev'));
}

// Health / keep-alive endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'StudentVault API is running 🎓' });
});
app.get('/ping', (req, res) => res.send('pong'));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',      authLimiter, authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/rooms',     roomRoutes);

// ── Global API error handler ──────────────────────────────────────────────────
app.use('/api', (err, req, res, next) => {
  console.error(err.stack);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
  }
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  });
});

// ── Serve React frontend in production ────────────────────────────────────────
if (isProd) {
  const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');

  // Serve static assets (JS, CSS, images, etc.)
  app.use(express.static(frontendDist));

  // Catch-all: send index.html for any non-API route (React Router support)
  app.get(/(.*)/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  // Dev: 404 for unknown routes
  app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });
}

const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`🚀 StudentVault API running on port ${PORT}`);
  if (isProd) console.log(`🌐 Serving React frontend from frontend/dist`);
});

export default app;
