# Google Authentication Setup Guide

This guide explains how to set up Google Sign-In restricted to Bureau of Statistics email addresses.

---

## 📋 Overview

With Google Authentication, users will:
1. Click "Sign in with Google"
2. Select their Bureau email account (e.g., `name@statisticsguyana.gov.gy`)
3. Be automatically logged into the system
4. No need to remember separate passwords

**Benefits:**
- ✅ No passwords to manage
- ✅ Secure (Google handles authentication)
- ✅ Only Bureau emails can sign in
- ✅ Users already have Google accounts for email

---

## 🔧 Setup Steps

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name it: `Bureau of Statistics Procurement`
4. Click "Create"

### Step 2: Enable Google Sign-In API

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for "Google Identity Services" or "Google Sign-In"
3. Click **Enable**

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **Internal** (if using Google Workspace) or **External**
3. Fill in:
   - App name: `Bureau of Statistics Procurement System`
   - User support email: Your admin email
   - Developer contact: Your admin email
4. Click **Save and Continue**
5. Skip scopes (defaults are fine)
6. Click **Save and Continue**

### Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Procurement System Web Client`
5. **Authorized JavaScript origins:**
   ```
   https://supplier-management.pages.dev
   http://localhost:8787
   ```
6. **Authorized redirect URIs:**
   ```
   https://supplier-management.pages.dev
   http://localhost:8787
   ```
7. Click **Create**
8. **Save the Client ID** - you'll need this!

### Step 5: Restrict to Bureau Email Domain

**Option A: Google Workspace (Recommended)**
If your Bureau uses Google Workspace:
1. In OAuth consent screen, choose "Internal"
2. Only users with `@statisticsguyana.gov.gy` emails can sign in

**Option B: Manual Verification (If not using Workspace)**
The system will check the email domain after sign-in and reject non-Bureau emails.

---

## 💻 Implementation

Once you have your **Google Client ID**, I can implement:

1. **Add "Sign in with Google" button** to the login page
2. **Verify Google tokens** on the backend (Worker)
3. **Check email domain** to ensure only Bureau emails work
4. **Auto-create user accounts** for new Bureau employees
5. **Keep existing username/password** as backup option

---

## ❓ Questions I Need from You

Before implementing, please tell me:

1. **What is your Bureau email domain?**
   - Example: `@statisticsguyana.gov.gy` or `@finance.gov.gy`

2. **Do you use Google Workspace?**
   - If yes, this is easier to restrict to your domain

3. **Should username/password login remain as an option?**
   - Recommended: Keep it as backup for emergencies

4. **When new users sign in with Google, what role should they get?**
   - Options: Viewer (safest), Editor, or require admin approval

---

## 🔒 Security Notes

- Google tokens are verified on the server (cannot be faked)
- Email domain is checked server-side (cannot be bypassed)
- Sessions expire after 24 hours (configurable)
- All logins are logged in the audit trail

---

## 📞 Next Steps

1. Create Google Cloud project (follow steps above)
2. Get your **Client ID**
3. Tell me your **Bureau email domain**
4. I'll implement the Google Sign-In feature!

