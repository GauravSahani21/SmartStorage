# 🎓 SmartStorage — DigiLocker for Students

A full-stack document management platform for students to securely upload, organize, share, and verify their academic documents using AI-powered categorization.

## ✨ Features

- 📂 **Document Management** — Upload, organize, and search academic documents
- 🤖 **AI Categorization** — Gemini AI auto-classifies documents (marksheet, certificate, etc.)
- 📊 **Analytics Dashboard** — Storage usage, upload trends, category breakdown
- 🔗 **Secure Sharing** — Shareable links with QR codes and optional watermarks
- 📅 **Academic Timeline** — Documents organized by year
- 🏠 **Study Rooms** — Collaborative document sharing rooms
- ✅ **Document Verification** — QR-code-based authenticity verification
- 🔒 **JWT Authentication** — Secure user accounts with bcrypt password hashing
- ☁️ **GridFS Storage** — Files stored directly in MongoDB (no S3 needed)

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, React Router 7 |
| Backend | Node.js, Express 5, MongoDB/Mongoose |
| Storage | MongoDB GridFS |
| AI | Google Gemini 1.5 Flash |
| Auth | JWT + bcryptjs |
| File Upload | Multer (memory storage) |
| PDF | pdf-lib (watermark), pdf-parse (text extraction) |

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- MongoDB Atlas account OR no setup needed (uses in-memory MongoDB automatically)

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env — at minimum set GEMINI_API_KEY
npm install
npm run dev
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env
# Edit .env — set VITE_API_URL=http://localhost:5005/api for local dev
npm install
npm run dev
```

## 🌐 Production Deployment

### Backend → Render

1. Push this repo to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Connect your GitHub repo
4. Set these settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install --omit=dev`
   - **Start Command**: `npm start`
5. Add environment variables in Render dashboard:
   - `MONGO_URI` — Your MongoDB Atlas connection string
   - `JWT_SECRET` — A long random secret (use `openssl rand -base64 32`)
   - `CLIENT_URL` — Your Vercel frontend URL (e.g. `https://smartstorage.vercel.app`)
   - `GEMINI_API_KEY` — From [Google AI Studio](https://aistudio.google.com/app/apikey)
   - `NODE_ENV` — `production`

### Frontend → Vercel

1. Import your GitHub repo on [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add environment variable:
   - `VITE_API_URL` — Your Render backend URL + `/api` (e.g. `https://smartstorage-api.onrender.com/api`)
4. Deploy!

### MongoDB Atlas Setup

1. Create a free cluster at [cloud.mongodb.com](https://cloud.mongodb.com)
2. Create a database user with read/write permissions
3. Add `0.0.0.0/0` to IP allowlist (for Render)
4. Copy the connection string and set it as `MONGO_URI`

## 📁 Project Structure

```
SmartStorage/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js  # Auth endpoints
│   │   └── documentController.js # Document CRUD + features
│   ├── middleware/
│   │   ├── authMiddleware.js  # JWT verification
│   │   └── upload.js          # Multer file upload config
│   ├── models/
│   │   ├── Document.js        # Document schema
│   │   ├── Room.js            # Study room schema
│   │   ├── User.js            # User schema
│   │   └── ViewLog.js         # Document view tracking
│   ├── routes/
│   │   ├── auth.js            # Auth routes
│   │   ├── documents.js       # Document routes
│   │   └── rooms.js           # Room routes
│   ├── utils/
│   │   ├── aiClassifier.js    # Gemini AI integration
│   │   ├── generateToken.js   # JWT token generation
│   │   ├── qr.js              # QR code generation
│   │   └── watermark.js       # PDF/image watermarking
│   ├── .env.example
│   ├── package.json
│   └── server.js              # Express app entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── context/           # React context (AuthContext)
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service layer
│   │   └── App.jsx            # Main app + routing
│   ├── .env.example
│   ├── vercel.json            # Vercel deployment config
│   └── package.json
│
├── render.yaml                # Render deployment config
├── .gitignore
└── README.md
```

## 🔐 Environment Variables

### Backend (`backend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes (prod) | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Secret for JWT signing |
| `CLIENT_URL` | Yes | Frontend URL for CORS (comma-separated for multiple) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `NODE_ENV` | No | `development` or `production` |
| `PORT` | No | Server port (default: 5000) |

### Frontend (`frontend/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API base URL |

## 📄 License

ISC
