# Deployment Guide

## Setup Required (One-time)

### 1. Install Git
Download and install Git from: https://git-scm.com/download/win

### 2. Install Node.js and npm
Download and install from: https://nodejs.org/ (LTS version recommended)

### 3. Install Wrangler CLI
```bash
npm install
```

### 4. Authenticate with Cloudflare
```bash
npx wrangler login
```

### 5. Update wrangler.toml
Replace `YOUR_DATABASE_ID` in `wrangler.toml` with your actual D1 database ID.

To find your database ID:
```bash
npx wrangler d1 list
```

## Workflow with AI Assistant

### When AI Makes Changes:

1. **AI will show you** what files were changed
2. **You review** the changes
3. **You decide** whether to:
   - Push to GitHub (triggers Cloudflare Pages auto-deploy)
   - Deploy worker to Cloudflare Workers
   - Roll back changes

### Commands AI Can Run For You:

**Deploy Worker:**
```bash
npm run deploy:worker
```

**Push to GitHub:**
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

**Test Worker Locally:**
```bash
npm run dev
```

## Manual Deployment

### Deploy Worker Only:
```bash
npm run deploy:worker
```

### Deploy Frontend (via GitHub):
1. Commit and push changes to GitHub
2. Cloudflare Pages automatically deploys

## Rollback

### Rollback Git Changes (before commit):
```bash
git restore <file>
```

### Rollback Worker Deployment:
Use Cloudflare Dashboard → Workers → Rollback to previous version

