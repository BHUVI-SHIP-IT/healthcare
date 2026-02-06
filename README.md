# Campus Care - Vercel-Ready Health Request Management System

**Modern, serverless health request management system for educational institutions.**

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Create `frontend/.env`:

```env
VITE_SUPABASE_URL=https://mtzwvtfmvoajohrodegp.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 3. Run Development Server

```bash
npm run dev
```

Visit: **http://localhost:5173**

## 📦 Architecture

```
Frontend (React + Vite) → Supabase Edge Functions (Deno)
                       → Supabase Auth
                       → Supabase PostgreSQL (with RLS)
```

**Benefits:**
- ✅ No backend folder needed
- ✅ Deploy to Vercel in seconds
- ✅ Auto-scaling serverless functions
- ✅ Built-in authentication
- ✅ Database-level security (RLS)

## 🎯 Features

- **Role-Based Access Control**: 7 user roles (Student, Class Advisor, Doctor, HOD, Receptionist, Gate Authority, Admin)
- **Complete Workflow**: From health request submission to exit authorization
- **Real-Time Updates**: Supabase real-time subscriptions
- **Premium UI**: Dark mode, glassmorphism, smooth animations
- **Secure**: Row Level Security policies on all tables

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete deployment instructions.

**Quick deploy to Vercel:**

```bash
cd frontend
vercel --prod
```

## 📚 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Deploy to production
- [Implementation Plan](./brain/implementation_plan.md) - Architecture details
- [Walkthrough](./brain/walkthrough.md) - Feature documentation

## 🛠️ Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- Supabase Client

**Backend (Serverless):**
- Supabase Edge Functions (Deno)
- Supabase Auth
- Supabase PostgreSQL

**Deployment:**
- Vercel (Frontend)
- Supa base (Functions + Database)

## 📄 License

MIT
