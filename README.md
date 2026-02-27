# Supplier Management System

**Bureau of Statistics — Procurement Unit**  
Ministry of Finance, Guyana

A web-based procurement and supplier management platform designed for government use.

---

## 📋 Overview

This system helps the Bureau of Statistics Procurement Unit manage:
- **Suppliers** - Vendor database with compliance tracking
- **Contracts** - Contract management and document storage
- **Procurement Tasks** - Track procurement items through workflow stages
- **Documents** - Store and manage NIS certificates, GRA compliance, business registrations
- **Audit Trail** - Full activity logging for accountability

---

## ✨ Features

### Supplier Management
- Add, edit, and search suppliers
- Track compliance documents (NIS, GRA, Business Registration)
- Categorize suppliers by type
- View document expiration dates

### Contract Management
- Create and manage contracts
- Link contracts to suppliers
- Upload contract documents
- Track contract values and dates

### Procurement Tasks
- ClickUp-style task interface
- Workflow stages based on procurement tier
- Budget tracking with automatic tier assignment
- Multi-supplier split for shared procurements
- Priority and status tracking
- Start/due date management

### Security & Audit
- User authentication with role-based access
- Password change enforcement on first login
- Full audit trail of all actions
- Session management

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | HTML, CSS, JavaScript (Vanilla) |
| Backend API | Cloudflare Workers |
| Database | Cloudflare D1 (SQLite) |
| File Storage | Cloudflare R2 |
| Hosting | Cloudflare Pages |
| Fonts | Google Fonts (Source Serif 4, DM Sans) |

---

## 📁 Project Structure

```
supplier-management/
├── index.html          # Main application HTML
├── css/
│   └── styles.css      # All styling
├── js/
│   ├── app.js          # Main application logic
│   ├── api.js          # API client for backend calls
│   └── config.js       # Configuration (API URL)
├── worker/
│   └── index.js        # Cloudflare Worker (backend API)
├── images/
│   └── logo.png.jpg    # Bureau of Statistics logo
├── wrangler.toml       # Cloudflare Worker configuration
├── package.json        # Node.js dependencies
├── manifest.json       # PWA manifest
├── sw.js               # Service worker for offline support
└── DEPLOYMENT.md       # Deployment instructions
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or later)
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/drewhingster/supplier-management.git
   cd supplier-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Login to Cloudflare**
   ```bash
   npx wrangler login
   ```

4. **Run locally**
   ```bash
   npx wrangler dev
   ```

### Deployment

**Deploy the Worker (Backend API):**
```bash
npm run deploy:worker
```

**Deploy the Frontend:**
Push to GitHub - Cloudflare Pages auto-deploys from the `main` branch.
```bash
git add .
git commit -m "Your changes"
git push
```

---

## 👤 User Guide

### Logging In
1. Enter your username and password
2. First-time users must change their password

### Adding a Supplier
1. Click "Add Supplier" button
2. Fill in company details
3. Upload compliance documents (NIS, GRA, Business Registration)
4. Click "Save Supplier"

### Creating a Procurement Task
1. Go to "Procurement Tasks" section
2. Click "Add Procurement Item"
3. Enter task details and budget
4. System auto-assigns procurement tier based on budget
5. Track progress through workflow stages

### Procurement Tiers (Auto-assigned by Budget)
| Tier | Budget Range |
|------|--------------|
| Cash Advance | Up to $500,000 |
| Single Quote | $500,001 - $1,500,000 |
| 3 Quote/RFQ | $1,500,001 - $6,000,000 |
| Ministerial | $6,000,001 - $15,000,000 |
| NPTA | $15,000,001 - $100,000,000 |
| Public Tender | Over $100,000,000 |

---

## 🔐 User Roles

| Role | Permissions |
|------|-------------|
| Admin | Full access - create, edit, delete, manage users |
| Editor | Create and edit suppliers, contracts, tasks |
| Viewer | Read-only access to all data |

---

## 📞 Support

For technical issues, contact the system administrator.

---

## 📄 License

Internal use only - Bureau of Statistics, Ministry of Finance, Guyana.

