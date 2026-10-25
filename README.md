# AEVORIX - Centralized EHR Platform

**AEVORIX** is a modern Electronic Health Record (EHR) platform featuring:
- **Role-Based Access Control (RBAC)** - Granular permissions for Doctors, Nurses, Labs, Pharmacists, Admins
- **SHA-256 Blockchain Data Integrity** - Immutable audit trail for all medical records
- **Explainable AI (XAI)** - Transparent AI decision explanations for clinical decisions
- **RAG-based Medical Querying** - Natural language queries against patient records
- **NFC/Biometric Ready** - Hardware integration scaffolded for future deployment

## Architecture

```
AEVORIX/
├── frontend/          # React + Vite + Tailwind CSS + Lucide React
├── backend/           # Node.js + Express + Supabase (PostgreSQL)
├── docs/              # Documentation
└── schema.sql         # Database schema (in backend/)
```

## Tech Stack

### Frontend
- **React 18** with Vite
- **Tailwind CSS** with custom design tokens
- **Lucide React** for icons
- **ESLint + Prettier** configured

### Backend
- **Node.js + Express** REST API
- **Supabase (PostgreSQL)** for database
- **Row Level Security (RLS)** for data access control
- **JWT** authentication
- **PostgreSQL triggers** for blockchain logging

### Design Tokens
| Token | Value | Usage |
|-------|-------|-------|
| Background | `#F8FAFC` | Page background |
| Card Surface | `#FFFFFF` | Card backgrounds |
| Card Border | `#E2E8F0` | Card borders |
| Primary | `#1E8885` | Buttons, accents |
| Primary Hover | `#176B69` | Button hover |
| Verification BG | `#E6F4EA` | Success badges |
| Verification Text | `#137333` | Success badge text |
| Alert BG | `#FCE8E6` | Warning badges |
| Alert Text | `#C5221F` | Warning badge text |

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free tier works)
- Git

### 1. Clone & Install
```bash
git clone https://github.com/neeraj-k-r/AEVORIX.git
cd AEVORIX
npm run install:all
```

### 2. Supabase Setup
1. Create a new Supabase project
2. Go to **SQL Editor** in Supabase Dashboard
3. Copy and run the contents of `backend/schema.sql`
4. Get your API keys from **Settings > API**

### 3. Environment Configuration
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your Supabase credentials

# Frontend (optional - uses Vite defaults)
cp frontend/.env.example frontend/.env  # if needed
```

### 4. Run Development Servers
```bash
# Runs both frontend (port 5173) and backend (port 3001)
npm run dev

# Or individually:
npm run dev:frontend  # Frontend only
npm run dev:backend   # Backend only
```

### 5. Access the Application
- **Frontend**: http://localhost:5173
- **Backend Health**: http://localhost:3001/health
- **API Base**: http://localhost:3001/api

## Test Credentials (Seeded Data)

### Test Patient
- **Patient Code**: `AEV-2026-8941`
- **Name**: Rahul Sharma
- **Blood Group**: O+
- **Allergies**: Penicillin, Peanuts
- **NFC UID**: `04:A3:B2:C1:D0:9E`

### Test Users (Password: `password123`)
| Email | Role |
|-------|------|
| dr.rao@aevorix.com | Doctor |
| nurse.mehta@aevorix.com | Nurse |
| lab.kumar@aevorix.com | Lab |
| pharma.shah@aevorix.com | Pharmacist |
| admin@aevorix.com | Admin |

## API Endpoints

### Authentication (Mock Hardware)
```
POST /api/auth/nfc-scan          # Mock NFC card scan
POST /api/auth/biometric-scan    # Mock biometric scan
```

### Patients
```
GET /api/patients/:patientCode           # Get patient profile
GET /api/patients/:patientCode/records   # Get all records (diagnoses, prescriptions, labs)
```

### Blockchain Verification
```
GET /api/blockchain/verify/:recordType/:recordId  # Verify record integrity
```

### AI Features
```
POST /api/ai/explain    # XAI explanation for clinical decisions
POST /api/ai/query      # RAG-based medical query
```

### Audit Logs
```
GET /api/access-logs/:patientCode  # Get access history
```

## Database Schema

Key tables:
- **users** - Staff accounts with roles
- **patients** - Patient demographics + NFC
- **diagnoses** - Clinical diagnoses with hashes
- **prescriptions** - Medications with hashes
- **lab_results** - Lab tests with hashes
- **blockchain_ledger** - Immutable audit trail
- **access_logs** - Complete access audit trail

All clinical records auto-populate `blockchain_ledger` via PostgreSQL triggers with SHA-256 hashes.

## Hardware Integration (Future)

The backend includes mock endpoints for hardware integration:
- **NFC Reader**: `POST /api/auth/nfc-scan` with `{ nfc_uid }`
- **Biometric Scanner**: `POST /api/auth/biometric-scan` with `{ patient_code, biometric_hash }`

Replace mock implementations with actual hardware SDK calls when ready.

## Deployment

### Frontend (Vercel/Netlify)
```bash
npm run build:frontend
# Deploy frontend/dist folder
```

### Backend (Railway/Render/Fly.io)
```bash
# Set environment variables in platform
# Deploy with: npm start
```

### Database
- Supabase handles PostgreSQL hosting
- Run migrations via Supabase Dashboard or CLI

## Project Structure Details

### Frontend
```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API clients
│   ├── contexts/       # React contexts (Auth, etc.)
│   └── utils/          # Helpers
├── index.html
├── tailwind.config.js
└── vite.config.js
```

### Backend
```
backend/
├── routes/             # Express route handlers
├── middleware/         # Auth, validation, error handling
├── services/           # Business logic (blockchain, AI, etc.)
├── utils/              # Helpers (hashing, validation)
├── config/             # Configuration
├── schema.sql          # Database schema
└── index.js            # Entry point
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT License - see LICENSE file for details.

## Support

- **Issues**: GitHub Issues
- **Documentation**: `/docs` folder
- **Email**: support@aevorix.com

---

**AEVORIX** - Building the future of healthcare data integrity 🏥🔗🤖