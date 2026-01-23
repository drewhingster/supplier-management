# Supplier Document Management System

## Bureau of Statistics — Procurement Unit

A comprehensive, production-ready web application for managing supplier compliance documents, built on Cloudflare's infrastructure for reliability, security, and global performance.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Initial Setup](#initial-setup)
5. [Database Setup](#database-setup)
6. [R2 Storage Setup](#r2-storage-setup)
7. [Authentication Setup](#authentication-setup)
8. [Deployment](#deployment)
9. [GitHub Integration](#github-integration)
10. [Environment Variables](#environment-variables)
11. [Usage Guide](#usage-guide)
12. [API Reference](#api-reference)
13. [Troubleshooting](#troubleshooting)
14. [Security Considerations](#security-considerations)

---

## Overview

The Supplier Document Management System (SDMS) enables the Bureau of Statistics Procurement Unit to:

- **Manage Suppliers**: Add, edit, and track supplier information including contact details and categorization
- **Track Compliance Documents**: Upload, store, and manage PDF compliance certificates (Business Registration, NIS, GRA, TIN)
- **Ensure Data Integrity**: Maintain accurate records with proper categorization and document status tracking
- **Support Procurement Processes**: Quick access to supplier compliance status for procurement decisions

### Key Features

- ✅ Responsive, mobile-friendly interface
- ✅ PDF-only document uploads with validation
- ✅ Category-based supplier organization
- ✅ Real-time search and filtering
- ✅ Compliance status tracking
- ✅ Secure token-based authentication
- ✅ Persistent cloud storage

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLOUDFLARE EDGE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────────────────────┐   │
│  │  Cloudflare      │    │     Cloudflare Workers           │   │
│  │  Pages           │───▶│     (API Backend)                │   │
│  │  (Frontend)      │    │                                  │   │
│  │                  │    │  - Authentication                │   │
│  │  - HTML/CSS/JS   │    │  - Supplier CRUD                 │   │
│  │  - Static Assets │    │  - Category Management           │   │
│  └──────────────────┘    │  - Document Handling             │   │
│                          │                                  │   │
│                          └───────────┬───────────┬──────────┘   │
│                                      │           │              │
│                          ┌───────────▼───┐ ┌─────▼──────────┐   │
│                          │   D1 Database │ │   R2 Storage   │   │
│                          │   (SQLite)    │ │   (Documents)  │   │
│                          │               │ │                │   │
│                          │ - Suppliers   │ │ - PDF Files    │   │
│                          │ - Categories  │ │ - Organized    │   │
│                          │ - Doc Meta    │ │   by Supplier  │   │
│                          └───────────────┘ └────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | HTML5, CSS3, Vanilla JS | User interface |
| Hosting | Cloudflare Pages | Static site hosting with global CDN |
| Backend API | Cloudflare Workers | Serverless API endpoints |
| Database | Cloudflare D1 | Structured data storage (SQLite) |
| File Storage | Cloudflare R2 | PDF document storage |
| Authentication | Bearer Token | Simple, secure access control |

---

## Prerequisites

Before beginning setup, ensure you have:

1. **Cloudflare Account** (Free tier works)
   - Sign up at [dash.cloudflare.com](https://dash.cloudflare.com)

2. **Node.js** (v16 or higher)
   - Download from [nodejs.org](https://nodejs.org)

3. **Wrangler CLI** (Cloudflare's CLI tool)
   ```bash
   npm install -g wrangler
   ```

4. **Git** (for version control and deployment)
   - Download from [git-scm.com](https://git-scm.com)

5. **GitHub Account** (for automated deployments)

---

## Initial Setup

### Step 1: Clone or Create Repository

```bash
# Create a new directory
mkdir supplier-management
cd supplier-management

# Initialize git repository
git init
```

### Step 2: Copy Project Files

Copy all files from the provided structure into your project directory:

```
supplier-management/
├── frontend/
│   ├── index.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── config.js
│       ├── api.js
│       └── app.js
├── worker/
│   ├── src/
│   │   └── index.js
│   ├── schema.sql
│   ├── wrangler.toml
│   └── package.json
├── README.md
└── .gitignore
```

### Step 3: Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window for authentication.

---

## Database Setup

### Step 1: Create D1 Database

```bash
cd worker
wrangler d1 create supplier-management-db
```

You'll receive output like:
```
✅ Successfully created DB 'supplier-management-db'

[[d1_databases]]
binding = "DB"
database_name = "supplier-management-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### Step 2: Update wrangler.toml

Copy the `database_id` from the output and update `worker/wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "supplier-management-db"
database_id = "YOUR_ACTUAL_DATABASE_ID_HERE"
```

### Step 3: Initialize Database Schema

```bash
# For production
wrangler d1 execute supplier-management-db --file=./schema.sql

# For local development
wrangler d1 execute supplier-management-db --local --file=./schema.sql
```

---

## R2 Storage Setup

### Step 1: Create R2 Bucket

```bash
wrangler r2 bucket create supplier-documents
```

The bucket name in `wrangler.toml` should match:
```toml
[[r2_buckets]]
binding = "R2_BUCKET"
bucket_name = "supplier-documents"
```

### Step 2: Configure CORS (Optional)

If you need cross-origin access, configure CORS via the Cloudflare dashboard:

1. Go to R2 > supplier-documents > Settings > CORS
2. Add allowed origins as needed

---

## Authentication Setup

### Step 1: Generate Secure Token

Generate a secure, random token:

```bash
# Using OpenSSL
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Example output: `K7j9x2mP1qR5vL8nT3wY6cH4bN0fG2sE9aD5iU7oM1k=`

### Step 2: Set Token as Secret

```bash
cd worker
wrangler secret put AUTH_TOKEN
```

When prompted, paste your generated token.

### Step 3: Create Local Development Token

Create a `.dev.vars` file in the `worker/` directory (this file should NOT be committed):

```env
AUTH_TOKEN=your-development-token-here
```

Add `.dev.vars` to `.gitignore`:
```
.dev.vars
```

---

## Deployment

### Deploy Worker (API)

```bash
cd worker
npm install
wrangler deploy
```

Note the Worker URL (e.g., `https://supplier-management-api.your-account.workers.dev`)

### Deploy Frontend (Cloudflare Pages)

#### Option A: Direct Upload (Manual)

1. Go to Cloudflare Dashboard > Pages
2. Click "Create a project" > "Direct Upload"
3. Upload the `frontend/` folder
4. Configure custom domain if needed

#### Option B: GitHub Integration (Recommended)

1. Push your code to GitHub
2. Go to Cloudflare Dashboard > Pages
3. Click "Create a project" > "Connect to Git"
4. Select your repository
5. Configure build settings:
   - Build command: (leave empty)
   - Build output directory: `frontend`
   - Root directory: `/`

### Update Frontend API URL

Update `frontend/js/config.js` with your Worker URL:

```javascript
API_BASE_URL: 'https://supplier-management-api.your-account.workers.dev/api'
```

Or configure a custom domain/subdomain.

---

## GitHub Integration

### Repository Structure

```
.github/
└── workflows/
    └── deploy.yml  (optional for CI/CD)
frontend/
worker/
.gitignore
README.md
```

### Recommended .gitignore

```gitignore
# Dependencies
node_modules/
.npm

# Cloudflare
.wrangler/
.dev.vars

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
```

### GitHub Actions (Optional CI/CD)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-worker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Deploy Worker
        working-directory: ./worker
        run: |
          npm install
          npx wrangler deploy
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CF_API_TOKEN }}
```

---

## Environment Variables

### Worker Environment Variables

| Variable | Type | Description |
|----------|------|-------------|
| `AUTH_TOKEN` | Secret | Authentication token for API access |
| `DB` | Binding | D1 database binding (auto-configured) |
| `R2_BUCKET` | Binding | R2 bucket binding (auto-configured) |

### Frontend Configuration

All frontend configuration is in `frontend/js/config.js`:

| Setting | Description |
|---------|-------------|
| `API_BASE_URL` | Worker API endpoint URL |
| `DOCUMENT_TYPES` | List of required compliance documents |
| `DEFAULT_CATEGORIES` | Initial supplier categories |
| `UPLOAD.MAX_SIZE_MB` | Maximum upload file size |
| `SESSION_TIMEOUT` | Token session duration |

---

## Usage Guide

### First-Time Setup

1. Navigate to your deployed application URL
2. Enter the authentication token
3. Default categories will be automatically seeded

### Adding a Supplier

1. Click "Add Supplier" button
2. Fill in required fields:
   - Supplier Name
   - Address
   - Telephone Number
   - Category
3. Optionally upload compliance documents
4. Click "Save Supplier"

### Managing Documents

1. Click on a supplier card to view details
2. Click "Edit Supplier" to update information
3. Upload or replace documents as needed
4. Documents can be viewed by clicking the document cards

### Managing Categories

1. Click "Categories" button in header
2. Add new categories using the form
3. Delete unused categories (only if no suppliers assigned)

---

## API Reference

### Authentication

All API requests (except `/auth/verify`) require:
```
Authorization: Bearer YOUR_TOKEN
```

### Endpoints

#### Authentication
- `POST /api/auth/verify` - Verify token

#### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category
- `DELETE /api/categories/:id` - Delete category

#### Suppliers
- `GET /api/suppliers` - List suppliers (with optional filters)
- `POST /api/suppliers` - Create supplier
- `GET /api/suppliers/:id` - Get supplier details
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

#### Documents
- `POST /api/suppliers/:id/documents` - Upload document
- `GET /api/suppliers/:id/documents/:type` - Get document
- `DELETE /api/suppliers/:id/documents/:type` - Delete document

#### Statistics
- `GET /api/statistics` - Get dashboard statistics

#### Seeding
- `POST /api/seed/categories` - Seed default categories

---

## Troubleshooting

### Common Issues

#### "Unauthorized" Error
- Verify AUTH_TOKEN is correctly set
- Check token hasn't expired
- Ensure Bearer prefix in Authorization header

#### Database Errors
- Confirm database was created: `wrangler d1 list`
- Verify schema was applied: `wrangler d1 execute supplier-management-db --command "SELECT name FROM sqlite_master WHERE type='table'"`

#### Document Upload Fails
- Check file is PDF format
- Verify file size under 10MB
- Ensure R2 bucket exists: `wrangler r2 bucket list`

#### CORS Errors
- Verify Worker CORS headers are correct
- Check frontend API URL matches Worker URL

### Logs and Debugging

```bash
# View Worker logs in real-time
cd worker
wrangler tail

# View local development logs
wrangler dev
```

---

## Security Considerations

### Implemented Security Measures

1. **Token-based Authentication**: All write operations require valid token
2. **Input Validation**: All inputs validated server-side
3. **File Type Validation**: Only PDF uploads allowed
4. **File Size Limits**: 10MB maximum per document
5. **SQL Injection Prevention**: Parameterized queries
6. **CORS Configuration**: Controlled cross-origin access

### Recommended Additional Measures

1. **Custom Domain**: Use HTTPS with custom domain
2. **Token Rotation**: Periodically rotate AUTH_TOKEN
3. **Rate Limiting**: Implement via Cloudflare dashboard
4. **IP Allowlisting**: Restrict access to known IPs
5. **Audit Logging**: Implement activity logging
6. **Backup Strategy**: Regular D1 backups

### Compliance with Procurement Act 2003

The system supports compliance with Guyana's Procurement Act 2003 by:

- Maintaining accurate supplier records (Section 27)
- Tracking compliance documentation
- Supporting transparent procurement processes
- Enabling audit trails for procurement decisions

---

## Support

For technical support or feature requests, contact the Bureau of Statistics IT Department.

---

*Document Version: 1.0.0*
*Last Updated: January 2025*
*Bureau of Statistics — Procurement Unit*
