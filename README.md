# 🚀 GrowEasy AI-Powered CSV Importer

An intelligent CSV importer that uses **Groq AI (llama-3.3-70b)** to extract CRM lead data from any CSV format — Facebook Leads, Google Ads exports, spreadsheets, or custom formats — and maps them to the GrowEasy CRM schema.

## ✨ Features

- 🧠 **AI-Powered Field Mapping** — Groq LLM intelligently maps arbitrary column names to CRM fields
- 📁 **Drag & Drop Upload** — Beautiful drag & drop + file picker
- 👀 **Virtualized CSV Preview** — High-performance table for large CSVs (TanStack Virtual)
- ⚡ **Streaming Progress** — Server-Sent Events (SSE) for real-time batch progress
- 🔄 **Auto-Retry** — Failed batches automatically retry up to 3× with exponential backoff
- 🌑 **Dark Mode UI** — Premium glassmorphism design
- 🍞 **Toast Notifications** — react-hot-toast for all feedback
- 📤 **Export Results** — Download extracted CRM records as CSV
- 🧪 **Unit Tests** — Jest test suite for core services

## 🏗️ Architecture

```
groweasy-csv-importer/
├── frontend/          # Next.js 14 + Tailwind CSS + TypeScript
│   ├── app/           # App Router pages
│   ├── components/    # UploadStep, PreviewStep, ConfirmStep, ResultStep
│   ├── lib/           # API client (SSE streaming)
│   └── types/         # Shared TypeScript types
│
├── backend/           # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/    # POST /api/import
│   │   ├── services/  # csvParser, aiExtractor (Groq), batchProcessor
│   │   └── types/     # CRM field types + Zod schemas
│   └── src/__tests__/ # Jest unit tests
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- A [Groq API key](https://console.groq.com) (free tier available)

### 1. Clone & Setup Backend

```bash
cd backend

# Copy env file and add your key
cp .env.example .env
# Edit .env: GROQ_API_KEY=your_key_here

# Install dependencies
npm install

# Start dev server
npm run dev
```

Backend runs on **http://localhost:4000**

### 2. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs on **http://localhost:3000**

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | **Required** — Your Groq API key | — |
| `PORT` | Port to listen on | `4000` |
| `FRONTEND_URL` | CORS allowed origin | `http://localhost:3000` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:4000/api` |

## 🧪 Running Tests

```bash
cd backend
npm test
# or with coverage
npm run test -- --coverage
```

## 📡 API Reference

### `POST /api/import`

Accepts a CSV file and streams extraction progress via SSE.

**Request:** `multipart/form-data` with `file` field (CSV, max 20MB)

**SSE Events:**

```jsonc
// Start
{ "type": "start", "total_rows": 150 }

// Progress (per batch)
{ "type": "progress", "batch": 1, "total_batches": 8, "processed": 20, "total_rows": 150, "message": "Processing batch 1 of 8…" }

// Error (with retry info)
{ "type": "error", "batch": 3, "message": "Rate limit hit", "retrying": true }

// Complete
{ "type": "complete", "data": { "imported": [...], "skipped": [...], "stats": {...} } }
```

## 🎯 CRM Fields Extracted

| Field | Description |
|-------|-------------|
| `created_at` | Lead creation date |
| `name` | Full name |
| `email` | Primary email |
| `country_code` | Country dialling code |
| `mobile_without_country_code` | Mobile number |
| `company` | Company name |
| `city` / `state` / `country` | Location |
| `lead_owner` | Assigned agent |
| `crm_status` | `GOOD_LEAD_FOLLOW_UP` \| `DID_NOT_CONNECT` \| `BAD_LEAD` \| `SALE_DONE` |
| `crm_note` | Notes, remarks, extra contacts |
| `data_source` | `leads_on_demand` \| `meridian_tower` \| `eden_park` \| `varah_swamy` \| `sarjapur_plots` |
| `possession_time` | Property possession time |
| `description` | Additional description |

## 🛠️ Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| AI | Groq (llama-3.3-70b-versatile) |
| CSV (FE) | Papa Parse |
| CSV (BE) | csv-parse |
| Virtualisation | @tanstack/react-virtual |
| Toasts | react-hot-toast |
| Validation | Zod |
| Tests | Jest + ts-jest |

---

Built with ❤️ for the GrowEasy assignment.
