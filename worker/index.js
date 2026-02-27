/**
 * Supplier Document Management System
 * Cloudflare Worker API Backend - VERSION 4
 * 
 * Bureau of Statistics — Procurement Unit
 * 
 * FEATURES:
 * 1. Multi-category support via supplier_categories junction table
 * 2. NIS/GRA expiration dates with automatic compliance calculation
 * 3. Compliance alert system with days remaining calculations
 * 4. CONTRACT MANAGEMENT MODULE (NEW)
 */

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};

const DOCUMENT_TYPES = [
    'business_registration',
    'nis_compliance',
    'gra_compliance',
    'tin_certificate'
];

const ALERT_CONFIG = {
    WARNING_THRESHOLD_DAYS: 30,
};

export default {
    async fetch(request, env, ctx) {
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        try {
            // ==================== PUBLIC AUTH ROUTES (no auth required) ====================
            if (path === '/api/auth/login' && request.method === 'POST') {
                return await handleLogin(request, env);
            }
            if (path === '/api/auth/logout' && request.method === 'POST') {
                return await handleLogout(request, env);
            }
            if (path === '/api/auth/setup-users' && request.method === 'POST') {
                return await setupUsersTable(env);
            }
            if (path === '/api/auth/setup-audit' && request.method === 'POST') {
                return await setupAuditTable(env);
            }
            if (path === '/api/auth/seed-users' && request.method === 'POST') {
                return await seedUsers(env);
            }
            // Legacy auth endpoint for backward compatibility
            if (path === '/api/auth/verify' && request.method === 'POST') {
                return await handleLegacyAuth(request, env);
            }
            // Setup endpoints (public for database initialization)
            if (path === '/api/setup/tasks' && request.method === 'POST') {
                return await setupTasksTable(env);
            }

            // All other routes require authentication
            const authResult = await verifyAuth(request, env);
            if (!authResult.authenticated) {
                return jsonResponse({ error: 'Unauthorized', requiresLogin: true }, 401);
            }

            // Store user info for audit logging
            const currentUser = authResult.user;

            // ==================== USER ROUTES ====================
            if (path === '/api/auth/me' && request.method === 'GET') {
                return jsonResponse({ user: currentUser });
            }
            if (path === '/api/auth/change-password' && request.method === 'POST') {
                return await handleChangePassword(request, env, currentUser);
            }
            if (path === '/api/users' && request.method === 'GET') {
                return await getUsers(env);
            }

            // ==================== AUDIT LOG ROUTES ====================
            if (path === '/api/audit-logs' && request.method === 'GET') {
                return await getAuditLogs(request, env);
            }
            if (path === '/api/audit-logs/recent' && request.method === 'GET') {
                return await getRecentAuditLogs(env);
            }

            // Check if user is view-only for write operations
            if (currentUser.role === 'view_only') {
                const writeMethod = ['POST', 'PUT', 'DELETE'].includes(request.method);
                const isWriteRoute = !path.includes('/api/auth/') && !path.includes('/api/audit-logs');
                if (writeMethod && isWriteRoute) {
                    return jsonResponse({ error: 'View-only users cannot make changes' }, 403);
                }
            }

            // Categories routes
            if (path === '/api/categories') {
                if (request.method === 'GET') return await getCategories(env);
                if (request.method === 'POST') return await createCategory(request, env, currentUser);
            }

            if (path.match(/^\/api\/categories\/\d+$/)) {
                const id = parseInt(path.split('/').pop());
                if (request.method === 'DELETE') return await deleteCategory(id, env, currentUser, request);
            }

            // Suppliers routes
            if (path === '/api/suppliers') {
                if (request.method === 'GET') return await getSuppliers(request, env);
                if (request.method === 'POST') return await createSupplier(request, env, currentUser);
            }

            if (path.match(/^\/api\/suppliers\/\d+$/)) {
                const id = parseInt(path.split('/').pop());
                if (request.method === 'GET') return await getSupplier(id, env);
                if (request.method === 'PUT') return await updateSupplier(id, request, env, currentUser);
                if (request.method === 'DELETE') return await deleteSupplier(id, env, currentUser, request);
            }

            // Document routes
            if (path.match(/^\/api\/suppliers\/\d+\/documents$/)) {
                const supplierId = parseInt(path.split('/')[3]);
                if (request.method === 'POST') return await uploadDocument(supplierId, request, env, currentUser);
            }

            if (path.match(/^\/api\/suppliers\/\d+\/documents\/[a-z_]+$/)) {
                const parts = path.split('/');
                const supplierId = parseInt(parts[3]);
                const docType = parts[5];
                if (request.method === 'GET') return await getDocumentFile(supplierId, docType, env);
                if (request.method === 'DELETE') return await deleteDocument(supplierId, docType, env, currentUser, request);
            }

            // ==================== CONTRACT ROUTES ====================
            if (path === '/api/contracts') {
                if (request.method === 'GET') return await getContracts(request, env);
                if (request.method === 'POST') return await createContract(request, env, currentUser);
            }

            if (path.match(/^\/api\/contracts\/\d+$/)) {
                const id = parseInt(path.split('/').pop());
                if (request.method === 'GET') return await getContract(id, env);
                if (request.method === 'PUT') return await updateContract(id, request, env, currentUser);
                if (request.method === 'DELETE') return await deleteContract(id, env, currentUser, request);
            }

            // Contract file routes
            if (path.match(/^\/api\/contracts\/\d+\/files$/)) {
                const contractId = parseInt(path.split('/')[3]);
                if (request.method === 'POST') return await uploadContractFile(contractId, request, env, currentUser);
            }

            if (path.match(/^\/api\/contracts\/\d+\/files\/\d+$/)) {
                const parts = path.split('/');
                const contractId = parseInt(parts[3]);
                const fileId = parseInt(parts[5]);
                if (request.method === 'GET') return await getContractFile(contractId, fileId, env);
                if (request.method === 'DELETE') return await deleteContractFile(contractId, fileId, env, currentUser, request);
            }

            // Statistics route
            if (path === '/api/statistics' && request.method === 'GET') {
                return await getStatistics(env);
            }

            // Alerts route
            if (path === '/api/alerts' && request.method === 'GET') {
                return await getAlerts(env);
            }

            // Acknowledged alerts routes
            if (path === '/api/alerts/acknowledged' && request.method === 'GET') {
                return await getAcknowledgedAlerts(env);
            }
            if (path === '/api/alerts/acknowledge' && request.method === 'POST') {
                return await acknowledgeAlert(request, env, currentUser);
            }
            if (path === '/api/alerts/unacknowledge' && request.method === 'POST') {
                return await unacknowledgeAlert(request, env, currentUser);
            }
            if (path === '/api/setup/acknowledged-alerts' && request.method === 'POST') {
                return await setupAcknowledgedAlertsTable(env);
            }

            // Seed routes
            if (path === '/api/seed/categories' && request.method === 'POST') {
                return await seedCategories(request, env);
            }

            // Database setup route (for initial setup)
            if (path === '/api/setup/contracts' && request.method === 'POST') {
                return await setupContractsTables(env);
            }

            // ==================== OUTSTANDING TASKS ROUTES ====================
            if (path === '/api/tasks') {
                if (request.method === 'GET') return await getTasks(request, env);
                if (request.method === 'POST') return await createTask(request, env, currentUser);
            }

            if (path.match(/^\/api\/tasks\/\d+$/)) {
                const id = parseInt(path.split('/').pop());
                if (request.method === 'GET') return await getTask(id, env);
                if (request.method === 'PUT') return await updateTask(id, request, env, currentUser);
                if (request.method === 'DELETE') return await deleteTask(id, env, currentUser, request);
            }

            // Task award document upload
            if (path.match(/^\/api\/tasks\/\d+\/award-document$/)) {
                const taskId = parseInt(path.split('/')[3]);
                if (request.method === 'POST') return await uploadTaskAwardDocument(taskId, request, env, currentUser);
                if (request.method === 'GET') return await getTaskAwardDocument(taskId, env);
                if (request.method === 'DELETE') return await deleteTaskAwardDocument(taskId, env, currentUser, request);
            }

            // Task suppliers (multi-supplier split)
            if (path.match(/^\/api\/tasks\/\d+\/suppliers$/)) {
                const taskId = parseInt(path.split('/')[3]);
                if (request.method === 'GET') return await getTaskSuppliers(taskId, env);
                if (request.method === 'POST') return await addTaskSupplier(taskId, request, env, currentUser);
                if (request.method === 'PUT') return await saveTaskSuppliers(taskId, request, env, currentUser);
            }

            if (path.match(/^\/api\/tasks\/\d+\/suppliers\/\d+$/)) {
                const parts = path.split('/');
                const taskId = parseInt(parts[3]);
                const supplierId = parseInt(parts[5]);
                if (request.method === 'DELETE') return await deleteTaskSupplier(taskId, supplierId, env, currentUser, request);
            }

            return jsonResponse({ error: 'Not found' }, 404);

        } catch (error) {
            console.error('API Error:', error);
            return jsonResponse({ error: error.message || 'Internal server error' }, 500);
        }
    }
};

// ==================== Authentication & User Management ====================

// Simple password hashing using SHA-256 (for Cloudflare Workers compatibility)
async function hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate a random salt
function generateSalt() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate a session token
function generateSessionToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Setup users and sessions tables
async function setupUsersTable(env) {
    try {
        // Create users table
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                full_name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                password_salt TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('admin', 'view_only')),
                must_change_password INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME
            )
        `).run();

        // Create sessions table
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_token TEXT UNIQUE NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `).run();

        // Create indexes
        await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token)`).run();
        await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)`).run();

        return jsonResponse({ success: true, message: 'Users and sessions tables created successfully' });
    } catch (error) {
        return jsonResponse({ error: error.message }, 500);
    }
}

// Setup audit log table in separate database
async function setupAuditTable(env) {
    try {
        await env.AUDIT_DB.prepare(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                user_name TEXT NOT NULL,
                action TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id INTEGER,
                entity_name TEXT,
                details TEXT,
                ip_address TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // Create indexes for faster queries
        await env.AUDIT_DB.prepare(`CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp)`).run();
        await env.AUDIT_DB.prepare(`CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id)`).run();
        await env.AUDIT_DB.prepare(`CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action)`).run();
        await env.AUDIT_DB.prepare(`CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type)`).run();

        return jsonResponse({ success: true, message: 'Audit log table created successfully' });
    } catch (error) {
        return jsonResponse({ error: error.message }, 500);
    }
}

// Seed initial users
async function seedUsers(env) {
    const users = [
        { username: 'ahing', full_name: 'Andrew Hing', role: 'admin' },
        { username: 'jsankar', full_name: 'Japheth Sankar', role: 'admin' },
        { username: 'jyong', full_name: 'Jonathan Yong', role: 'admin' },
        { username: 'rshim', full_name: 'Ryan Shim', role: 'admin' },
        { username: 'broopchand', full_name: 'Basmattie Roopchand', role: 'admin' },
        { username: 'elacruz', full_name: 'Errol La Cruez', role: 'view_only' }
    ];

    const results = [];
    for (const user of users) {
        try {
            // Check if user already exists
            const existing = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(user.username).first();
            if (existing) {
                results.push({ username: user.username, status: 'already exists' });
                continue;
            }

            // Create with temporary password (same as username for first login)
            const salt = generateSalt();
            const passwordHash = await hashPassword(user.username, salt);

            await env.DB.prepare(`
                INSERT INTO users (username, full_name, password_hash, password_salt, role, must_change_password)
                VALUES (?, ?, ?, ?, ?, 1)
            `).bind(user.username, user.full_name, passwordHash, salt, user.role).run();

            results.push({ username: user.username, status: 'created', tempPassword: user.username });
        } catch (error) {
            results.push({ username: user.username, status: 'error', error: error.message });
        }
    }

    return jsonResponse({ success: true, users: results });
}

// Handle user login
async function handleLogin(request, env) {
    try {
        const body = await request.json();
        const { username, password } = body;

        if (!username || !password) {
            return jsonResponse({ error: 'Username and password are required' }, 400);
        }

        // Find user
        const user = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username.toLowerCase()).first();
        if (!user) {
            return jsonResponse({ error: 'Invalid username or password' }, 401);
        }

        // Verify password
        const passwordHash = await hashPassword(password, user.password_salt);
        if (passwordHash !== user.password_hash) {
            return jsonResponse({ error: 'Invalid username or password' }, 401);
        }

        // Create session (expires in 7 days)
        const sessionToken = generateSessionToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        await env.DB.prepare(`
            INSERT INTO sessions (user_id, session_token, expires_at)
            VALUES (?, ?, ?)
        `).bind(user.id, sessionToken, expiresAt).run();

        // Update last login
        await env.DB.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').bind(user.id).run();

        // Log the login
        await logAudit(env, user.id, user.full_name, 'LOGIN', 'User', user.id, user.full_name, 'User logged in', request);

        return jsonResponse({
            success: true,
            token: sessionToken,
            user: {
                id: user.id,
                username: user.username,
                fullName: user.full_name,
                role: user.role,
                mustChangePassword: user.must_change_password === 1
            }
        });
    } catch (error) {
        return jsonResponse({ error: error.message }, 500);
    }
}

// Handle user logout
async function handleLogout(request, env) {
    try {
        const authHeader = request.headers.get('Authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);

            // Get user info before deleting session
            const session = await env.DB.prepare(`
                SELECT s.*, u.id as user_id, u.full_name
                FROM sessions s
                JOIN users u ON s.user_id = u.id
                WHERE s.session_token = ?
            `).bind(token).first();

            if (session) {
                await logAudit(env, session.user_id, session.full_name, 'LOGOUT', 'User', session.user_id, session.full_name, 'User logged out', request);
            }

            // Delete the session
            await env.DB.prepare('DELETE FROM sessions WHERE session_token = ?').bind(token).run();
        }

        return jsonResponse({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        return jsonResponse({ error: error.message }, 500);
    }
}

// Verify authentication and return user info
async function verifyAuth(request, env) {
    const authHeader = request.headers.get('Authorization');
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    } else {
        // Check for token in query string (for file downloads opened in new tab)
        const url = new URL(request.url);
        token = url.searchParams.get('token');
    }

    if (!token) {
        return { authenticated: false };
    }

    // Check if it's the legacy auth token
    if (token === env.AUTH_TOKEN) {
        return {
            authenticated: true,
            user: { id: 0, username: 'system', fullName: 'System', role: 'admin' }
        };
    }

    // Check session token
    try {
        const session = await env.DB.prepare(`
            SELECT s.*, u.id as user_id, u.username, u.full_name, u.role, u.must_change_password
            FROM sessions s
            JOIN users u ON s.user_id = u.id
            WHERE s.session_token = ? AND s.expires_at > datetime('now')
        `).bind(token).first();

        if (!session) {
            return { authenticated: false };
        }

        return {
            authenticated: true,
            user: {
                id: session.user_id,
                username: session.username,
                fullName: session.full_name,
                role: session.role,
                mustChangePassword: session.must_change_password === 1
            }
        };
    } catch (error) {
        console.error('Auth error:', error);
        return { authenticated: false };
    }
}

// Handle legacy auth (backward compatibility)
async function handleLegacyAuth(request, env) {
    const body = await request.json();
    const token = body.token;

    if (token === env.AUTH_TOKEN) {
        return jsonResponse({ success: true, message: 'Authentication successful' });
    }

    return jsonResponse({ success: false, error: 'Invalid token' }, 401);
}

// Handle password change
async function handleChangePassword(request, env, currentUser) {
    try {
        const body = await request.json();
        const { currentPassword, newPassword } = body;

        if (!newPassword || newPassword.length < 6) {
            return jsonResponse({ error: 'New password must be at least 6 characters' }, 400);
        }

        // Get user's current password info
        const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(currentUser.id).first();
        if (!user) {
            return jsonResponse({ error: 'User not found' }, 404);
        }

        // If not first login, verify current password
        if (!user.must_change_password) {
            if (!currentPassword) {
                return jsonResponse({ error: 'Current password is required' }, 400);
            }
            const currentHash = await hashPassword(currentPassword, user.password_salt);
            if (currentHash !== user.password_hash) {
                return jsonResponse({ error: 'Current password is incorrect' }, 401);
            }
        }

        // Hash new password with new salt
        const newSalt = generateSalt();
        const newHash = await hashPassword(newPassword, newSalt);

        await env.DB.prepare(`
            UPDATE users
            SET password_hash = ?, password_salt = ?, must_change_password = 0
            WHERE id = ?
        `).bind(newHash, newSalt, currentUser.id).run();

        await logAudit(env, currentUser.id, currentUser.fullName, 'PASSWORD_CHANGE', 'User', currentUser.id, currentUser.fullName, 'Password changed', request);

        return jsonResponse({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        return jsonResponse({ error: error.message }, 500);
    }
}

// Get all users (admin only - no passwords)
async function getUsers(env) {
    try {
        const result = await env.DB.prepare(`
            SELECT id, username, full_name, role, must_change_password, created_at, last_login
            FROM users
            ORDER BY full_name
        `).all();

        return jsonResponse({ users: result.results });
    } catch (error) {
        return jsonResponse({ error: error.message }, 500);
    }
}

// ==================== Audit Logging ====================

// Log an audit entry (IMMUTABLE - no delete/update functions)
async function logAudit(env, userId, userName, action, entityType, entityId, entityName, details, request) {
    try {
        const ipAddress = request?.headers?.get('CF-Connecting-IP') || 'unknown';
        
        // Get current time in Guyana (UTC-4)
        const now = new Date();
        const guyanaOffset = -4 * 60 * 60 * 1000; // -4 hours in milliseconds
        const guyanaTime = new Date(now.getTime() + guyanaOffset);
        const timestamp = guyanaTime.toISOString().replace('T', ' ').substring(0, 19);

        await env.AUDIT_DB.prepare(`
            INSERT INTO audit_logs (user_id, user_name, action, entity_type, entity_id, entity_name, details, ip_address, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(userId, userName, action, entityType, entityId || null, entityName || null, details || null, ipAddress, timestamp).run();
    } catch (error) {
        console.error('Failed to log audit entry:', error);
        // Don't throw - audit logging should not break the main operation
    }
}
// Get audit logs with filtering
async function getAuditLogs(request, env) {
    try {
        const url = new URL(request.url);
        const userId = url.searchParams.get('user_id');
        const action = url.searchParams.get('action');
        const entityType = url.searchParams.get('entity_type');
        const startDate = url.searchParams.get('start_date');
        const endDate = url.searchParams.get('end_date');
        const limit = parseInt(url.searchParams.get('limit')) || 100;
        const offset = parseInt(url.searchParams.get('offset')) || 0;

        let query = 'SELECT * FROM audit_logs WHERE 1=1';
        const params = [];

        if (userId) {
            query += ' AND user_id = ?';
            params.push(parseInt(userId));
        }
        if (action) {
            query += ' AND action = ?';
            params.push(action);
        }
        if (entityType) {
            query += ' AND entity_type = ?';
            params.push(entityType);
        }
        if (startDate) {
            query += ' AND timestamp >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND timestamp <= ?';
            params.push(endDate + ' 23:59:59');
        }

        // Get total count
        const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
        const countResult = await env.AUDIT_DB.prepare(countQuery).bind(...params).first();

        // Get paginated results
        query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const result = await env.AUDIT_DB.prepare(query).bind(...params).all();

        return jsonResponse({
            logs: result.results,
            total: countResult?.count || 0,
            limit,
            offset
        });
    } catch (error) {
        return jsonResponse({ error: error.message }, 500);
    }
}

// Get recent audit logs for sidebar widget
async function getRecentAuditLogs(env) {
    try {
        const result = await env.AUDIT_DB.prepare(`
            SELECT * FROM audit_logs
            ORDER BY timestamp DESC
            LIMIT 20
        `).all();

        return jsonResponse({ logs: result.results });
    } catch (error) {
        return jsonResponse({ error: error.message }, 500);
    }
}

// ==================== Alert Calculations ====================

function calculateDaysRemaining(dateString) {
    if (!dateString) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

function calculateAlertLevel(supplier, missingDocs, nisDaysRemaining, graDaysRemaining) {
    if (nisDaysRemaining !== null && nisDaysRemaining < 0) return 'critical';
    if (graDaysRemaining !== null && graDaysRemaining < 0) return 'critical';
    
    if (nisDaysRemaining !== null && nisDaysRemaining >= 0 && nisDaysRemaining <= ALERT_CONFIG.WARNING_THRESHOLD_DAYS) return 'warning';
    if (graDaysRemaining !== null && graDaysRemaining >= 0 && graDaysRemaining <= ALERT_CONFIG.WARNING_THRESHOLD_DAYS) return 'warning';
    
    if (missingDocs.length > 0) return 'action_needed';
    
    return null;
}

function getMissingDocuments(documents) {
    const uploadedTypes = documents.map(d => d.document_type);
    return DOCUMENT_TYPES.filter(type => !uploadedTypes.includes(type));
}

function buildAlertDetails(supplier, missingDocs, nisDaysRemaining, graDaysRemaining) {
    const alerts = [];
    
    if (nisDaysRemaining !== null && nisDaysRemaining < 0) {
        alerts.push({
            type: 'expired',
            field: 'nis',
            message: `NIS Compliance EXPIRED (${Math.abs(nisDaysRemaining)} days ago)`,
            date: supplier.nis_expiration_date
        });
    }
    if (graDaysRemaining !== null && graDaysRemaining < 0) {
        alerts.push({
            type: 'expired',
            field: 'gra',
            message: `GRA Compliance EXPIRED (${Math.abs(graDaysRemaining)} days ago)`,
            date: supplier.gra_expiration_date
        });
    }
    
    if (nisDaysRemaining !== null && nisDaysRemaining >= 0 && nisDaysRemaining <= ALERT_CONFIG.WARNING_THRESHOLD_DAYS) {
        alerts.push({
            type: 'expiring',
            field: 'nis',
            message: `NIS Compliance expires in ${nisDaysRemaining} day${nisDaysRemaining !== 1 ? 's' : ''}`,
            date: supplier.nis_expiration_date
        });
    }
    if (graDaysRemaining !== null && graDaysRemaining >= 0 && graDaysRemaining <= ALERT_CONFIG.WARNING_THRESHOLD_DAYS) {
        alerts.push({
            type: 'expiring',
            field: 'gra',
            message: `GRA Compliance expires in ${graDaysRemaining} day${graDaysRemaining !== 1 ? 's' : ''}`,
            date: supplier.gra_expiration_date
        });
    }
    
    if (missingDocs.length > 0) {
        const docNames = {
            'business_registration': 'Business Registration',
            'nis_compliance': 'NIS Compliance Certificate',
            'gra_compliance': 'GRA Compliance Certificate',
            'tin_certificate': 'TIN Certificate'
        };
        alerts.push({
            type: 'missing',
            field: 'documents',
            message: `Missing: ${missingDocs.map(d => docNames[d]).join(', ')}`,
            missing: missingDocs
        });
    }
    
    return alerts;
}

// ==================== Categories ====================

async function getCategories(env) {
    const result = await env.DB.prepare(
        'SELECT id, name, created_at FROM categories ORDER BY name ASC'
    ).all();

    return jsonResponse({ categories: result.results });
}

async function createCategory(request, env, currentUser) {
    const body = await request.json();
    const name = body.name?.trim();

    if (!name) {
        return jsonResponse({ error: 'Category name is required' }, 400);
    }

    const existing = await env.DB.prepare(
        'SELECT id FROM categories WHERE LOWER(name) = LOWER(?)'
    ).bind(name).first();

    if (existing) {
        return jsonResponse({ error: 'Category already exists' }, 400);
    }

    const result = await env.DB.prepare(
        'INSERT INTO categories (name, created_at) VALUES (?, datetime("now"))'
    ).bind(name).run();

    // Log audit entry
    await logAudit(env, currentUser.id, currentUser.fullName, 'CREATE', 'Category', result.meta.last_row_id, name, `Created category: ${name}`, request);

    return jsonResponse({
        success: true,
        category: { id: result.meta.last_row_id, name }
    }, 201);
}

async function deleteCategory(id, env, currentUser, request) {
    // Get category name for audit log
    const category = await env.DB.prepare('SELECT name FROM categories WHERE id = ?').bind(id).first();

    const supplierCount = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM supplier_categories WHERE category_id = ?'
    ).bind(id).first();

    if (supplierCount && supplierCount.count > 0) {
        return jsonResponse({
            error: 'Cannot delete category with associated suppliers'
        }, 400);
    }

    await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();

    // Log audit entry
    if (category) {
        await logAudit(env, currentUser.id, currentUser.fullName, 'DELETE', 'Category', id, category.name, `Deleted category: ${category.name}`, request);
    }

    return jsonResponse({ success: true });
}

async function seedCategories(request, env) {
    const body = await request.json();
    const categories = body.categories || [];

    const existing = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM categories'
    ).first();

    if (existing.count > 0) {
        return jsonResponse({ message: 'Categories already seeded', seeded: false });
    }

    const stmt = env.DB.prepare(
        'INSERT INTO categories (name, created_at) VALUES (?, datetime("now"))'
    );

    const batch = categories.map(name => stmt.bind(name));
    await env.DB.batch(batch);

    return jsonResponse({ success: true, seeded: true, count: categories.length });
}

// ==================== Suppliers ====================

async function getSuppliers(request, env) {
    const url = new URL(request.url);
    const categoryFilter = url.searchParams.get('category');
    const searchFilter = url.searchParams.get('search');

    let query = `
        SELECT DISTINCT
            s.id, s.name, s.address, s.telephone, s.email, 
            s.contact_person, s.category_id, 
            s.nis_expiration_date, s.gra_expiration_date,
            s.created_at, s.updated_at
        FROM suppliers s
    `;

    const bindings = [];

    if (categoryFilter) {
        query += ' INNER JOIN supplier_categories sc ON s.id = sc.supplier_id WHERE sc.category_id = ?';
        bindings.push(parseInt(categoryFilter));
    } else {
        query += ' WHERE 1=1';
    }

    if (searchFilter) {
        query += ' AND (s.name LIKE ? OR s.address LIKE ? OR s.telephone LIKE ?)';
        const searchTerm = `%${searchFilter}%`;
        bindings.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY s.name ASC';

    const stmt = env.DB.prepare(query);
    const result = bindings.length > 0
        ? await stmt.bind(...bindings).all()
        : await stmt.all();

    const suppliers = await Promise.all(result.results.map(async (supplier) => {
        const docs = await env.DB.prepare(
            'SELECT document_type, file_name, uploaded_at FROM documents WHERE supplier_id = ?'
        ).bind(supplier.id).all();

        const cats = await env.DB.prepare(`
            SELECT c.id, c.name 
            FROM categories c 
            INNER JOIN supplier_categories sc ON c.id = sc.category_id 
            WHERE sc.supplier_id = ?
        `).bind(supplier.id).all();

        const today = new Date().toISOString().split('T')[0];
        const nisCompliant = supplier.nis_expiration_date ? supplier.nis_expiration_date >= today : null;
        const graCompliant = supplier.gra_expiration_date ? supplier.gra_expiration_date >= today : null;
        
        const nisDaysRemaining = calculateDaysRemaining(supplier.nis_expiration_date);
        const graDaysRemaining = calculateDaysRemaining(supplier.gra_expiration_date);
        
        const missingDocuments = getMissingDocuments(docs.results);
        const alertLevel = calculateAlertLevel(supplier, missingDocuments, nisDaysRemaining, graDaysRemaining);
        const alertDetails = buildAlertDetails(supplier, missingDocuments, nisDaysRemaining, graDaysRemaining);

        return {
            ...supplier,
            documents: docs.results,
            categories: cats.results,
            category_ids: cats.results.map(c => c.id),
            nis_compliant: nisCompliant,
            gra_compliant: graCompliant,
            nis_days_remaining: nisDaysRemaining,
            gra_days_remaining: graDaysRemaining,
            missing_documents: missingDocuments,
            alert_level: alertLevel,
            alert_details: alertDetails
        };
    }));

    return jsonResponse({ suppliers });
}

async function getSupplier(id, env) {
    const supplier = await env.DB.prepare(`
        SELECT id, name, address, telephone, email, contact_person, 
               category_id, nis_expiration_date, gra_expiration_date,
               created_at, updated_at 
        FROM suppliers WHERE id = ?
    `).bind(id).first();

    if (!supplier) {
        return jsonResponse({ error: 'Supplier not found' }, 404);
    }

    const docs = await env.DB.prepare(
        'SELECT document_type, file_name, uploaded_at FROM documents WHERE supplier_id = ?'
    ).bind(id).all();

    const cats = await env.DB.prepare(`
        SELECT c.id, c.name 
        FROM categories c 
        INNER JOIN supplier_categories sc ON c.id = sc.category_id 
        WHERE sc.supplier_id = ?
    `).bind(id).all();

    const today = new Date().toISOString().split('T')[0];
    const nisCompliant = supplier.nis_expiration_date ? supplier.nis_expiration_date >= today : null;
    const graCompliant = supplier.gra_expiration_date ? supplier.gra_expiration_date >= today : null;
    
    const nisDaysRemaining = calculateDaysRemaining(supplier.nis_expiration_date);
    const graDaysRemaining = calculateDaysRemaining(supplier.gra_expiration_date);
    const missingDocuments = getMissingDocuments(docs.results);
    const alertLevel = calculateAlertLevel(supplier, missingDocuments, nisDaysRemaining, graDaysRemaining);
    const alertDetails = buildAlertDetails(supplier, missingDocuments, nisDaysRemaining, graDaysRemaining);

    return jsonResponse({
        supplier: {
            ...supplier,
            documents: docs.results,
            categories: cats.results,
            category_ids: cats.results.map(c => c.id),
            nis_compliant: nisCompliant,
            gra_compliant: graCompliant,
            nis_days_remaining: nisDaysRemaining,
            gra_days_remaining: graDaysRemaining,
            missing_documents: missingDocuments,
            alert_level: alertLevel,
            alert_details: alertDetails
        }
    });
}

async function createSupplier(request, env, currentUser) {
    const body = await request.json();

    const errors = validateSupplier(body);
    if (errors.length > 0) {
        return jsonResponse({ error: errors.join(', ') }, 400);
    }

    const result = await env.DB.prepare(`
        INSERT INTO suppliers (name, address, telephone, email, contact_person,
                              category_id, nis_expiration_date, gra_expiration_date,
                              created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))
    `).bind(
        body.name.trim(),
        body.address.trim(),
        body.telephone.trim(),
        body.email || null,
        body.contact_person || null,
        body.category_ids && body.category_ids.length > 0 ? body.category_ids[0] : (body.category_id || null),
        body.nis_expiration_date || null,
        body.gra_expiration_date || null
    ).run();

    const supplierId = result.meta.last_row_id;

    const categoryIds = body.category_ids || (body.category_id ? [body.category_id] : []);
    if (categoryIds.length > 0) {
        const catStmt = env.DB.prepare(
            'INSERT OR IGNORE INTO supplier_categories (supplier_id, category_id) VALUES (?, ?)'
        );
        const catBatch = categoryIds.map(catId => catStmt.bind(supplierId, catId));
        await env.DB.batch(catBatch);
    }

    const supplier = await env.DB.prepare('SELECT * FROM suppliers WHERE id = ?').bind(supplierId).first();

    // Log audit entry
    await logAudit(env, currentUser.id, currentUser.fullName, 'CREATE', 'Supplier', supplierId, body.name.trim(), `Created supplier: ${body.name.trim()}`, request);

    return jsonResponse({ success: true, supplier }, 201);
}

async function updateSupplier(id, request, env, currentUser) {
    const body = await request.json();

    const existing = await env.DB.prepare('SELECT id, name FROM suppliers WHERE id = ?').bind(id).first();
    if (!existing) {
        return jsonResponse({ error: 'Supplier not found' }, 404);
    }

    const errors = validateSupplier(body);
    if (errors.length > 0) {
        return jsonResponse({ error: errors.join(', ') }, 400);
    }

    await env.DB.prepare(`
        UPDATE suppliers
        SET name = ?, address = ?, telephone = ?, email = ?,
            contact_person = ?, category_id = ?,
            nis_expiration_date = ?, gra_expiration_date = ?,
            updated_at = datetime("now")
        WHERE id = ?
    `).bind(
        body.name.trim(),
        body.address.trim(),
        body.telephone.trim(),
        body.email || null,
        body.contact_person || null,
        body.category_ids && body.category_ids.length > 0 ? body.category_ids[0] : (body.category_id || null),
        body.nis_expiration_date || null,
        body.gra_expiration_date || null,
        id
    ).run();

    await env.DB.prepare('DELETE FROM supplier_categories WHERE supplier_id = ?').bind(id).run();

    const categoryIds = body.category_ids || (body.category_id ? [body.category_id] : []);
    if (categoryIds.length > 0) {
        const catStmt = env.DB.prepare(
            'INSERT OR IGNORE INTO supplier_categories (supplier_id, category_id) VALUES (?, ?)'
        );
        const catBatch = categoryIds.map(catId => catStmt.bind(id, catId));
        await env.DB.batch(catBatch);
    }

    const supplier = await env.DB.prepare('SELECT * FROM suppliers WHERE id = ?').bind(id).first();

    // Log audit entry
    await logAudit(env, currentUser.id, currentUser.fullName, 'UPDATE', 'Supplier', id, body.name.trim(), `Updated supplier: ${body.name.trim()}`, request);

    return jsonResponse({ success: true, supplier });
}

async function deleteSupplier(id, env, currentUser, request) {
    // Get supplier info for audit log
    const supplier = await env.DB.prepare('SELECT id, name FROM suppliers WHERE id = ?').bind(id).first();
    if (!supplier) {
        return jsonResponse({ error: 'Supplier not found' }, 404);
    }

    // Check if supplier has contracts
    const contractCount = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM contracts WHERE supplier_id = ?'
    ).bind(id).first();

    if (contractCount && contractCount.count > 0) {
        return jsonResponse({
            error: `Cannot delete supplier with ${contractCount.count} active contract(s). Delete or reassign contracts first.`
        }, 400);
    }

    const docs = await env.DB.prepare(
        'SELECT r2_key FROM documents WHERE supplier_id = ?'
    ).bind(id).all();

    for (const doc of docs.results) {
        try {
            await env.DOCUMENTS.delete(doc.r2_key);
        } catch (e) {
            console.error('Failed to delete R2 object:', e);
        }
    }

    await env.DB.prepare('DELETE FROM supplier_categories WHERE supplier_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM documents WHERE supplier_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM suppliers WHERE id = ?').bind(id).run();

    // Log audit entry
    await logAudit(env, currentUser.id, currentUser.fullName, 'DELETE', 'Supplier', id, supplier.name, `Deleted supplier: ${supplier.name}`, request);

    return jsonResponse({ success: true });
}

function validateSupplier(data) {
    const errors = [];

    if (!data.name?.trim()) errors.push('Supplier name is required');
    if (!data.address?.trim()) errors.push('Address is required');
    if (!data.telephone?.trim()) errors.push('Telephone is required');
    
    const categoryIds = data.category_ids || (data.category_id ? [data.category_id] : []);
    if (categoryIds.length === 0) {
        errors.push('At least one category is required');
    }

    return errors;
}

// ==================== Documents ====================

async function uploadDocument(supplierId, request, env, currentUser) {
    const supplier = await env.DB.prepare(
        'SELECT id, name FROM suppliers WHERE id = ?'
    ).bind(supplierId).first();

    if (!supplier) {
        return jsonResponse({ error: 'Supplier not found' }, 404);
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const documentType = formData.get('documentType');

    if (!DOCUMENT_TYPES.includes(documentType)) {
        return jsonResponse({ error: 'Invalid document type' }, 400);
    }

    if (!file || !(file instanceof File)) {
        return jsonResponse({ error: 'No file provided' }, 400);
    }

    if (file.type !== 'application/pdf') {
        return jsonResponse({ error: 'Only PDF files are allowed' }, 400);
    }

    if (file.size > 10 * 1024 * 1024) {
        return jsonResponse({ error: 'File size exceeds 10MB limit' }, 400);
    }

    const timestamp = Date.now();
    const sanitizedName = supplier.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const r2Key = `suppliers/${supplierId}/${sanitizedName}/${documentType}_${timestamp}.pdf`;

    await env.DOCUMENTS.put(r2Key, file.stream(), {
        httpMetadata: { contentType: 'application/pdf' },
        customMetadata: {
            supplierId: supplierId.toString(),
            documentType: documentType,
            originalName: file.name
        }
    });

    const oldDoc = await env.DB.prepare(
        'SELECT r2_key FROM documents WHERE supplier_id = ? AND document_type = ?'
    ).bind(supplierId, documentType).first();

    if (oldDoc) {
        try {
            await env.DOCUMENTS.delete(oldDoc.r2_key);
        } catch (e) {
            console.error('Failed to delete old R2 object:', e);
        }
        await env.DB.prepare(
            'DELETE FROM documents WHERE supplier_id = ? AND document_type = ?'
        ).bind(supplierId, documentType).run();
    }

    await env.DB.prepare(`
        INSERT INTO documents (supplier_id, document_type, file_name, r2_key, uploaded_at)
        VALUES (?, ?, ?, ?, datetime("now"))
    `).bind(supplierId, documentType, file.name, r2Key).run();

    await env.DB.prepare(
        'UPDATE suppliers SET updated_at = datetime("now") WHERE id = ?'
    ).bind(supplierId).run();

    // Log audit entry
    await logAudit(env, currentUser.id, currentUser.fullName, 'UPLOAD', 'Document', supplierId, supplier.name, `Uploaded ${documentType} document for supplier: ${supplier.name}`, request);

    return jsonResponse({ success: true, documentType, fileName: file.name });
}

async function getDocumentFile(supplierId, docType, env) {
    if (!DOCUMENT_TYPES.includes(docType)) {
        return jsonResponse({ error: 'Invalid document type' }, 400);
    }

    const doc = await env.DB.prepare(
        'SELECT r2_key, file_name FROM documents WHERE supplier_id = ? AND document_type = ?'
    ).bind(supplierId, docType).first();

    if (!doc) {
        return jsonResponse({ error: 'Document not found' }, 404);
    }

    const object = await env.DOCUMENTS.get(doc.r2_key);

    if (!object) {
        return jsonResponse({ error: 'Document file not found in storage' }, 404);
    }

    return new Response(object.body, {
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${doc.file_name}"`,
            'Cache-Control': 'private, max-age=3600'
        }
    });
}

async function deleteDocument(supplierId, docType, env, currentUser, request) {
    if (!DOCUMENT_TYPES.includes(docType)) {
        return jsonResponse({ error: 'Invalid document type' }, 400);
    }

    // Get supplier name for audit log
    const supplier = await env.DB.prepare('SELECT name FROM suppliers WHERE id = ?').bind(supplierId).first();

    const doc = await env.DB.prepare(
        'SELECT r2_key FROM documents WHERE supplier_id = ? AND document_type = ?'
    ).bind(supplierId, docType).first();

    if (!doc) {
        return jsonResponse({ error: 'Document not found' }, 404);
    }

    try {
        await env.DOCUMENTS.delete(doc.r2_key);
    } catch (e) {
        console.error('Failed to delete R2 object:', e);
    }

    await env.DB.prepare(
        'DELETE FROM documents WHERE supplier_id = ? AND document_type = ?'
    ).bind(supplierId, docType).run();

    // Log audit entry
    if (supplier) {
        await logAudit(env, currentUser.id, currentUser.fullName, 'DELETE', 'Document', supplierId, supplier.name, `Deleted ${docType} document for supplier: ${supplier.name}`, request);
    }

    return jsonResponse({ success: true });
}

// ==================== CONTRACTS MODULE ====================

async function setupContractsTables(env) {
    try {
        // Create contracts table
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS contracts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                contract_number TEXT UNIQUE NOT NULL,
                supplier_id INTEGER NOT NULL,
                description TEXT,
                amount REAL,
                start_date DATE,
                end_date DATE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
            )
        `).run();

        // Create contract_files table
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS contract_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                contract_id INTEGER NOT NULL,
                file_name TEXT NOT NULL,
                r2_key TEXT NOT NULL,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
            )
        `).run();

        // Create index for faster lookups
        await env.DB.prepare(`
            CREATE INDEX IF NOT EXISTS idx_contracts_supplier ON contracts(supplier_id)
        `).run();

        await env.DB.prepare(`
            CREATE INDEX IF NOT EXISTS idx_contracts_number ON contracts(contract_number)
        `).run();

        return jsonResponse({ success: true, message: 'Contract tables created successfully' });
    } catch (error) {
        return jsonResponse({ error: error.message }, 500);
    }
}

async function getContracts(request, env) {
    const url = new URL(request.url);
    const supplierFilter = url.searchParams.get('supplier_id');
    const searchFilter = url.searchParams.get('search');

    let query = `
        SELECT 
            c.id, c.contract_number, c.supplier_id, c.description, 
            c.amount, c.start_date, c.end_date, c.created_at, c.updated_at,
            s.name as supplier_name
        FROM contracts c
        LEFT JOIN suppliers s ON c.supplier_id = s.id
        WHERE 1=1
    `;

    const bindings = [];

    if (supplierFilter) {
        query += ' AND c.supplier_id = ?';
        bindings.push(parseInt(supplierFilter));
    }

    if (searchFilter) {
        query += ' AND (c.contract_number LIKE ? OR c.description LIKE ? OR s.name LIKE ?)';
        const searchTerm = `%${searchFilter}%`;
        bindings.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY c.created_at DESC';

    const stmt = env.DB.prepare(query);
    const result = bindings.length > 0
        ? await stmt.bind(...bindings).all()
        : await stmt.all();

    // Get file counts for each contract
    const contracts = await Promise.all(result.results.map(async (contract) => {
        const files = await env.DB.prepare(
            'SELECT id, file_name, uploaded_at FROM contract_files WHERE contract_id = ?'
        ).bind(contract.id).all();

        return {
            ...contract,
            files: files.results,
            file_count: files.results.length
        };
    }));

    return jsonResponse({ contracts });
}

async function getContract(id, env) {
    const contract = await env.DB.prepare(`
        SELECT 
            c.id, c.contract_number, c.supplier_id, c.description, 
            c.amount, c.start_date, c.end_date, c.created_at, c.updated_at,
            s.name as supplier_name
        FROM contracts c
        LEFT JOIN suppliers s ON c.supplier_id = s.id
        WHERE c.id = ?
    `).bind(id).first();

    if (!contract) {
        return jsonResponse({ error: 'Contract not found' }, 404);
    }

    const files = await env.DB.prepare(
        'SELECT id, file_name, uploaded_at FROM contract_files WHERE contract_id = ?'
    ).bind(id).all();

    return jsonResponse({
        contract: {
            ...contract,
            files: files.results
        }
    });
}

async function createContract(request, env, currentUser) {
    const body = await request.json();

    // Validate required fields
    const errors = validateContract(body);
    if (errors.length > 0) {
        return jsonResponse({ error: errors.join(', ') }, 400);
    }

    // Check if contract number is unique
    const existing = await env.DB.prepare(
        'SELECT id FROM contracts WHERE contract_number = ?'
    ).bind(body.contract_number.trim()).first();

    if (existing) {
        return jsonResponse({ error: 'Contract number already exists' }, 400);
    }

    // Verify supplier exists
    const supplier = await env.DB.prepare(
        'SELECT id FROM suppliers WHERE id = ?'
    ).bind(body.supplier_id).first();

    if (!supplier) {
        return jsonResponse({ error: 'Supplier not found' }, 400);
    }

    const result = await env.DB.prepare(`
        INSERT INTO contracts (
            contract_number, supplier_id, description, amount,
            start_date, end_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))
    `).bind(
        body.contract_number.trim(),
        body.supplier_id,
        body.description?.trim() || null,
        body.amount || null,
        body.start_date || null,
        body.end_date || null
    ).run();

    const contractId = result.meta.last_row_id;

    const contract = await env.DB.prepare(
        'SELECT * FROM contracts WHERE id = ?'
    ).bind(contractId).first();

    // Log audit entry
    await logAudit(env, currentUser.id, currentUser.fullName, 'CREATE', 'Contract', contractId, body.contract_number.trim(), `Created contract: ${body.contract_number.trim()}`, request);

    return jsonResponse({ success: true, contract }, 201);
}

async function updateContract(id, request, env, currentUser) {
    const body = await request.json();

    const existing = await env.DB.prepare(
        'SELECT id, contract_number FROM contracts WHERE id = ?'
    ).bind(id).first();

    if (!existing) {
        return jsonResponse({ error: 'Contract not found' }, 404);
    }

    // Validate
    const errors = validateContract(body);
    if (errors.length > 0) {
        return jsonResponse({ error: errors.join(', ') }, 400);
    }

    // Check uniqueness of contract number (excluding self)
    const duplicate = await env.DB.prepare(
        'SELECT id FROM contracts WHERE contract_number = ? AND id != ?'
    ).bind(body.contract_number.trim(), id).first();

    if (duplicate) {
        return jsonResponse({ error: 'Contract number already exists' }, 400);
    }

    // Verify supplier exists
    const supplier = await env.DB.prepare(
        'SELECT id FROM suppliers WHERE id = ?'
    ).bind(body.supplier_id).first();

    if (!supplier) {
        return jsonResponse({ error: 'Supplier not found' }, 400);
    }

    await env.DB.prepare(`
        UPDATE contracts
        SET contract_number = ?, supplier_id = ?, description = ?,
            amount = ?, start_date = ?, end_date = ?, updated_at = datetime("now")
        WHERE id = ?
    `).bind(
        body.contract_number.trim(),
        body.supplier_id,
        body.description?.trim() || null,
        body.amount || null,
        body.start_date || null,
        body.end_date || null,
        id
    ).run();

    const contract = await env.DB.prepare(
        'SELECT * FROM contracts WHERE id = ?'
    ).bind(id).first();

    // Log audit entry
    await logAudit(env, currentUser.id, currentUser.fullName, 'UPDATE', 'Contract', id, body.contract_number.trim(), `Updated contract: ${body.contract_number.trim()}`, request);

    return jsonResponse({ success: true, contract });
}

async function deleteContract(id, env, currentUser, request) {
    const contract = await env.DB.prepare(
        'SELECT id, contract_number FROM contracts WHERE id = ?'
    ).bind(id).first();

    if (!contract) {
        return jsonResponse({ error: 'Contract not found' }, 404);
    }

    // Delete associated files from R2
    const files = await env.DB.prepare(
        'SELECT r2_key FROM contract_files WHERE contract_id = ?'
    ).bind(id).all();

    for (const file of files.results) {
        try {
            await env.DOCUMENTS.delete(file.r2_key);
        } catch (e) {
            console.error('Failed to delete R2 object:', e);
        }
    }

    // Delete files records
    await env.DB.prepare(
        'DELETE FROM contract_files WHERE contract_id = ?'
    ).bind(id).run();

    // Delete contract
    await env.DB.prepare(
        'DELETE FROM contracts WHERE id = ?'
    ).bind(id).run();

    // Log audit entry
    await logAudit(env, currentUser.id, currentUser.fullName, 'DELETE', 'Contract', id, contract.contract_number, `Deleted contract: ${contract.contract_number}`, request);

    return jsonResponse({ success: true });
}

function validateContract(data) {
    const errors = [];

    if (!data.contract_number?.trim()) {
        errors.push('Contract number is required');
    }

    if (!data.supplier_id) {
        errors.push('Supplier is required');
    }

    if (data.amount !== undefined && data.amount !== null && isNaN(parseFloat(data.amount))) {
        errors.push('Amount must be a valid number');
    }

    return errors;
}

// ==================== Contract Files ====================

async function uploadContractFile(contractId, request, env, currentUser) {
    const contract = await env.DB.prepare(
        'SELECT id, contract_number FROM contracts WHERE id = ?'
    ).bind(contractId).first();

    if (!contract) {
        return jsonResponse({ error: 'Contract not found' }, 404);
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
        return jsonResponse({ error: 'No file provided' }, 400);
    }

    if (file.type !== 'application/pdf') {
        return jsonResponse({ error: 'Only PDF files are allowed' }, 400);
    }

    if (file.size > 10 * 1024 * 1024) {
        return jsonResponse({ error: 'File size exceeds 10MB limit' }, 400);
    }

    const timestamp = Date.now();
    const sanitizedNumber = contract.contract_number.replace(/[^a-zA-Z0-9]/g, '_');
    const r2Key = `contracts/${contractId}/${sanitizedNumber}/${timestamp}_${file.name}`;

    await env.DOCUMENTS.put(r2Key, file.stream(), {
        httpMetadata: { contentType: 'application/pdf' },
        customMetadata: {
            contractId: contractId.toString(),
            originalName: file.name
        }
    });

    const result = await env.DB.prepare(`
        INSERT INTO contract_files (contract_id, file_name, r2_key, uploaded_at)
        VALUES (?, ?, ?, datetime("now"))
    `).bind(contractId, file.name, r2Key).run();

    // Log audit entry
    await logAudit(env, currentUser.id, currentUser.fullName, 'UPLOAD', 'ContractFile', contractId, contract.contract_number, `Uploaded file "${file.name}" to contract: ${contract.contract_number}`, request);

    return jsonResponse({
        success: true,
        file: {
            id: result.meta.last_row_id,
            file_name: file.name
        }
    });
}

async function getContractFile(contractId, fileId, env) {
    const file = await env.DB.prepare(
        'SELECT r2_key, file_name FROM contract_files WHERE id = ? AND contract_id = ?'
    ).bind(fileId, contractId).first();

    if (!file) {
        return jsonResponse({ error: 'File not found' }, 404);
    }

    const object = await env.DOCUMENTS.get(file.r2_key);

    if (!object) {
        return jsonResponse({ error: 'File not found in storage' }, 404);
    }

    return new Response(object.body, {
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${file.file_name}"`,
            'Cache-Control': 'private, max-age=3600'
        }
    });
}

async function deleteContractFile(contractId, fileId, env, currentUser, request) {
    // Get contract info for audit log
    const contract = await env.DB.prepare('SELECT contract_number FROM contracts WHERE id = ?').bind(contractId).first();

    const file = await env.DB.prepare(
        'SELECT r2_key, file_name FROM contract_files WHERE id = ? AND contract_id = ?'
    ).bind(fileId, contractId).first();

    if (!file) {
        return jsonResponse({ error: 'File not found' }, 404);
    }

    try {
        await env.DOCUMENTS.delete(file.r2_key);
    } catch (e) {
        console.error('Failed to delete R2 object:', e);
    }

    await env.DB.prepare(
        'DELETE FROM contract_files WHERE id = ?'
    ).bind(fileId).run();

    // Log audit entry
    if (contract) {
        await logAudit(env, currentUser.id, currentUser.fullName, 'DELETE', 'ContractFile', contractId, contract.contract_number, `Deleted file "${file.file_name}" from contract: ${contract.contract_number}`, request);
    }

    return jsonResponse({ success: true });
}

// ==================== Statistics ====================

async function getStatistics(env) {
    const totalSuppliers = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM suppliers'
    ).first();

    const totalCategories = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM categories'
    ).first();

    const totalDocuments = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM documents'
    ).first();

    const compliantSuppliers = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM suppliers s
        WHERE (SELECT COUNT(*) FROM documents d WHERE d.supplier_id = s.id) = ?
    `).bind(DOCUMENT_TYPES.length).first();

    const today = new Date().toISOString().split('T')[0];
    
    const nisExpired = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM suppliers WHERE nis_expiration_date IS NOT NULL AND nis_expiration_date < ?'
    ).bind(today).first();

    const graExpired = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM suppliers WHERE gra_expiration_date IS NOT NULL AND gra_expiration_date < ?'
    ).bind(today).first();

    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + ALERT_CONFIG.WARNING_THRESHOLD_DAYS);
    const warningDateStr = warningDate.toISOString().split('T')[0];

    const needsAttention = await env.DB.prepare(`
        SELECT COUNT(DISTINCT s.id) as count FROM suppliers s
        LEFT JOIN documents d ON s.id = d.supplier_id
        WHERE 
            (s.nis_expiration_date IS NOT NULL AND s.nis_expiration_date <= ?)
            OR (s.gra_expiration_date IS NOT NULL AND s.gra_expiration_date <= ?)
            OR (SELECT COUNT(*) FROM documents WHERE supplier_id = s.id) < ?
    `).bind(warningDateStr, warningDateStr, DOCUMENT_TYPES.length).first();

    // Contract statistics
    let totalContracts = { count: 0 };
    let totalContractValue = { total: 0 };
    try {
        totalContracts = await env.DB.prepare(
            'SELECT COUNT(*) as count FROM contracts'
        ).first() || { count: 0 };

        totalContractValue = await env.DB.prepare(
            'SELECT COALESCE(SUM(amount), 0) as total FROM contracts'
        ).first() || { total: 0 };
    } catch (e) {
        // Tables might not exist yet
    }

    return jsonResponse({
        statistics: {
            totalSuppliers: totalSuppliers.count,
            totalCategories: totalCategories.count,
            totalDocuments: totalDocuments.count,
            compliantSuppliers: compliantSuppliers.count,
            nisExpired: nisExpired.count,
            graExpired: graExpired.count,
            needsAttention: needsAttention.count,
            totalContracts: totalContracts.count,
            totalContractValue: totalContractValue.total
        }
    });
}

// ==================== Alerts ====================

async function getAlerts(env) {
    const today = new Date().toISOString().split('T')[0];
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + ALERT_CONFIG.WARNING_THRESHOLD_DAYS);
    const warningDateStr = warningDate.toISOString().split('T')[0];

    const result = await env.DB.prepare(`
        SELECT DISTINCT s.id, s.name, s.nis_expiration_date, s.gra_expiration_date
        FROM suppliers s
        WHERE 
            (s.nis_expiration_date IS NOT NULL AND s.nis_expiration_date <= ?)
            OR (s.gra_expiration_date IS NOT NULL AND s.gra_expiration_date <= ?)
            OR (SELECT COUNT(*) FROM documents WHERE supplier_id = s.id) < ?
        ORDER BY 
            CASE 
                WHEN s.nis_expiration_date < ? OR s.gra_expiration_date < ? THEN 1
                WHEN s.nis_expiration_date <= ? OR s.gra_expiration_date <= ? THEN 2
                ELSE 3
            END,
            s.name ASC
    `).bind(warningDateStr, warningDateStr, DOCUMENT_TYPES.length, today, today, warningDateStr, warningDateStr).all();

    const alerts = await Promise.all(result.results.map(async (supplier) => {
        const docs = await env.DB.prepare(
            'SELECT document_type FROM documents WHERE supplier_id = ?'
        ).bind(supplier.id).all();

        const nisDaysRemaining = calculateDaysRemaining(supplier.nis_expiration_date);
        const graDaysRemaining = calculateDaysRemaining(supplier.gra_expiration_date);
        const missingDocs = getMissingDocuments(docs.results);
        const alertLevel = calculateAlertLevel(supplier, missingDocs, nisDaysRemaining, graDaysRemaining);
        const alertDetails = buildAlertDetails(supplier, missingDocs, nisDaysRemaining, graDaysRemaining);

        return {
            supplier_id: supplier.id,
            supplier_name: supplier.name,
            alert_level: alertLevel,
            alerts: alertDetails
        };
    }));

    return jsonResponse({
        alerts,
        summary: {
            critical: alerts.filter(a => a.alert_level === 'critical').length,
            warning: alerts.filter(a => a.alert_level === 'warning').length,
            action_needed: alerts.filter(a => a.alert_level === 'action_needed').length,
            total: alerts.length
        }
    });
}

// ==================== Acknowledged Alerts ====================

async function setupAcknowledgedAlertsTable(env) {
    try {
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS acknowledged_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                supplier_id INTEGER NOT NULL,
                alert_type TEXT NOT NULL,
                acknowledged_by TEXT,
                acknowledged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(supplier_id, alert_type)
            )
        `).run();

        await env.DB.prepare(`
            CREATE INDEX IF NOT EXISTS idx_acknowledged_alerts_supplier
            ON acknowledged_alerts(supplier_id)
        `).run();

        return jsonResponse({ success: true, message: 'Acknowledged alerts table created' });
    } catch (error) {
        console.error('Setup acknowledged alerts table error:', error);
        return jsonResponse({ error: error.message }, 500);
    }
}

async function getAcknowledgedAlerts(env) {
    try {
        const result = await env.DB.prepare(`
            SELECT supplier_id, alert_type, acknowledged_by, acknowledged_at
            FROM acknowledged_alerts
        `).all();

        return jsonResponse({ acknowledged: result.results || [] });
    } catch (error) {
        // Table might not exist yet
        return jsonResponse({ acknowledged: [] });
    }
}

async function acknowledgeAlert(request, env, currentUser) {
    try {
        const body = await request.json();
        const { supplier_id, alert_type } = body;

        if (!supplier_id || !alert_type) {
            return jsonResponse({ error: 'supplier_id and alert_type are required' }, 400);
        }

        // Ensure table exists first
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS acknowledged_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                supplier_id INTEGER NOT NULL,
                alert_type TEXT NOT NULL,
                acknowledged_by TEXT,
                acknowledged_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(supplier_id, alert_type)
            )
        `).run();

        // Use INSERT OR REPLACE to handle duplicates
        await env.DB.prepare(`
            INSERT OR REPLACE INTO acknowledged_alerts (supplier_id, alert_type, acknowledged_by, acknowledged_at)
            VALUES (?, ?, ?, datetime('now'))
        `).bind(supplier_id, alert_type, currentUser.fullName).run();

        return jsonResponse({ success: true, message: 'Alert acknowledged' });
    } catch (error) {
        console.error('Acknowledge alert error:', error);
        return jsonResponse({ error: error.message }, 500);
    }
}

async function unacknowledgeAlert(request, env, currentUser) {
    try {
        const body = await request.json();
        const { supplier_id, alert_type } = body;

        if (!supplier_id || !alert_type) {
            return jsonResponse({ error: 'supplier_id and alert_type are required' }, 400);
        }

        await env.DB.prepare(`
            DELETE FROM acknowledged_alerts WHERE supplier_id = ? AND alert_type = ?
        `).bind(supplier_id, alert_type).run();

        return jsonResponse({ success: true, message: 'Alert unacknowledged' });
    } catch (error) {
        console.error('Unacknowledge alert error:', error);
        return jsonResponse({ error: error.message }, 500);
    }
}

// ==================== OUTSTANDING TASKS MODULE (PSIP Format) ====================

async function setupTasksTable(env) {
    try {
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_code TEXT,
                title TEXT NOT NULL,
                budget_amount REAL,
                procurement_tier TEXT,
                completed_stages TEXT DEFAULT '[]',
                requires_contract INTEGER DEFAULT 0,
                linked_contract_id INTEGER,
                approver TEXT,
                award_number TEXT,
                award_document_r2_key TEXT,
                contractor_supplier TEXT,
                contract_sum REAL,
                assigned_person TEXT,
                remarks TEXT,
                start_date DATE,
                end_date DATE,
                expected_completion_date DATE,
                archived INTEGER DEFAULT 0,
                priority TEXT DEFAULT 'Normal',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `).run();

        // Add priority column if it doesn't exist (migration for existing databases)
        try {
            await env.DB.prepare(`ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'Normal'`).run();
        } catch (e) {
            // Column already exists, ignore
        }

        // Add single_source_procurement column if it doesn't exist
        try {
            await env.DB.prepare(`ALTER TABLE tasks ADD COLUMN single_source_procurement INTEGER DEFAULT 0`).run();
        } catch (e) {
            // Column already exists, ignore
        }

        // Add na_stages column if it doesn't exist (for N/A stages in single source procurement)
        try {
            await env.DB.prepare(`ALTER TABLE tasks ADD COLUMN na_stages TEXT DEFAULT '[]'`).run();
        } catch (e) {
            // Column already exists, ignore
        }

        await env.DB.prepare(`
            CREATE INDEX IF NOT EXISTS idx_tasks_tier ON tasks(procurement_tier)
        `).run();

        await env.DB.prepare(`
            CREATE INDEX IF NOT EXISTS idx_tasks_archived ON tasks(archived)
        `).run();

        // Create task_suppliers table for multi-supplier split
        await env.DB.prepare(`
            CREATE TABLE IF NOT EXISTS task_suppliers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                task_id INTEGER NOT NULL,
                supplier_name TEXT NOT NULL,
                amount REAL NOT NULL,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
            )
        `).run();

        await env.DB.prepare(`
            CREATE INDEX IF NOT EXISTS idx_task_suppliers_task_id ON task_suppliers(task_id)
        `).run();

        return jsonResponse({ success: true, message: 'Tasks table created successfully' });
    } catch (error) {
        return jsonResponse({ error: error.message }, 500);
    }
}

async function getTasks(request, env) {
    const url = new URL(request.url);
    const archivedFilter = url.searchParams.get('archived');
    const tierFilter = url.searchParams.get('procurement_tier');
    const assignedPersonFilter = url.searchParams.get('assigned_person');

    let query = 'SELECT * FROM tasks WHERE 1=1';
    const bindings = [];

    if (archivedFilter !== null) {
        query += ' AND archived = ?';
        bindings.push(archivedFilter === 'true' ? 1 : 0);
    }

    if (tierFilter) {
        query += ' AND procurement_tier = ?';
        bindings.push(tierFilter);
    }

    if (assignedPersonFilter) {
        query += ' AND assigned_person LIKE ?';
        bindings.push(`%${assignedPersonFilter}%`);
    }

    query += ' ORDER BY created_at DESC';

    const stmt = env.DB.prepare(query);
    const result = bindings.length > 0
        ? await stmt.bind(...bindings).all()
        : await stmt.all();

    return jsonResponse({ tasks: result.results });
}

async function getTask(id, env) {
    const task = await env.DB.prepare(
        'SELECT * FROM tasks WHERE id = ?'
    ).bind(id).first();

    if (!task) {
        return jsonResponse({ error: 'Task not found' }, 404);
    }

    return jsonResponse({ task });
}

async function createTask(request, env, currentUser) {
    const body = await request.json();

    const errors = validateTask(body);
    if (errors.length > 0) {
        return jsonResponse({ error: errors.join(', ') }, 400);
    }

    // Ensure completed_stages is a valid JSON string
    const completedStages = Array.isArray(body.completed_stages)
        ? JSON.stringify(body.completed_stages)
        : (body.completed_stages || '[]');

    // Ensure na_stages is a valid JSON string
    const naStages = Array.isArray(body.na_stages)
        ? JSON.stringify(body.na_stages)
        : (body.na_stages || '[]');

    const result = await env.DB.prepare(`
        INSERT INTO tasks (
            project_code, title, budget_amount, procurement_tier,
            completed_stages, na_stages, requires_contract, linked_contract_id,
            approver, award_number, award_document_r2_key,
            contractor_supplier, contract_sum, assigned_person,
            remarks, start_date, end_date, expected_completion_date,
            archived, priority, single_source_procurement, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, datetime("now"), datetime("now"))
    `).bind(
        body.project_code?.trim() || null,
        body.title.trim(),
        body.budget_amount || null,
        body.procurement_tier || null,
        completedStages,
        naStages,
        body.requires_contract ? 1 : 0,
        body.linked_contract_id || null,
        body.approver?.trim() || null,
        body.award_number?.trim() || null,
        body.award_document_r2_key || null,
        body.contractor_supplier?.trim() || null,
        body.contract_sum || null,
        body.assigned_person?.trim() || null,
        body.remarks?.trim() || null,
        body.start_date || null,
        body.end_date || null,
        body.expected_completion_date || null,
        body.priority || 'Normal',
        body.single_source_procurement ? 1 : 0
    ).run();

    const taskId = result.meta.last_row_id;
    const task = await env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(taskId).first();

    // Log audit entry
    await logAudit(env, currentUser.id, currentUser.fullName, 'CREATE', 'Task', taskId, body.title.trim(), `Created task: ${body.title.trim()}`, request);

    return jsonResponse({ success: true, task }, 201);
}

async function updateTask(id, request, env, currentUser) {
    const body = await request.json();

    const existing = await env.DB.prepare('SELECT id, title FROM tasks WHERE id = ?').bind(id).first();
    if (!existing) {
        return jsonResponse({ error: 'Task not found' }, 404);
    }

    const errors = validateTask(body);
    if (errors.length > 0) {
        return jsonResponse({ error: errors.join(', ') }, 400);
    }

    // Ensure completed_stages is a valid JSON string
    const completedStages = Array.isArray(body.completed_stages)
        ? JSON.stringify(body.completed_stages)
        : (body.completed_stages || '[]');

    // Ensure na_stages is a valid JSON string
    const naStages = Array.isArray(body.na_stages)
        ? JSON.stringify(body.na_stages)
        : (body.na_stages || '[]');

    await env.DB.prepare(`
        UPDATE tasks
        SET project_code = ?, title = ?, budget_amount = ?, procurement_tier = ?,
            completed_stages = ?, na_stages = ?, requires_contract = ?, linked_contract_id = ?,
            approver = ?, award_number = ?, award_document_r2_key = ?,
            contractor_supplier = ?, contract_sum = ?, assigned_person = ?,
            remarks = ?, start_date = ?, end_date = ?, expected_completion_date = ?,
            archived = ?, priority = ?, single_source_procurement = ?, updated_at = datetime("now")
        WHERE id = ?
    `).bind(
        body.project_code?.trim() || null,
        body.title.trim(),
        body.budget_amount || null,
        body.procurement_tier || null,
        completedStages,
        naStages,
        body.requires_contract ? 1 : 0,
        body.linked_contract_id || null,
        body.approver?.trim() || null,
        body.award_number?.trim() || null,
        body.award_document_r2_key || null,
        body.contractor_supplier?.trim() || null,
        body.contract_sum || null,
        body.assigned_person?.trim() || null,
        body.remarks?.trim() || null,
        body.start_date || null,
        body.end_date || null,
        body.expected_completion_date || null,
        body.archived ? 1 : 0,
        body.priority || 'Normal',
        body.single_source_procurement ? 1 : 0,
        id
    ).run();

    const task = await env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first();

    // Log audit entry
    await logAudit(env, currentUser.id, currentUser.fullName, 'UPDATE', 'Task', id, body.title.trim(), `Updated task: ${body.title.trim()}`, request);

    return jsonResponse({ success: true, task });
}

async function deleteTask(id, env, currentUser, request) {
    const task = await env.DB.prepare('SELECT id, title FROM tasks WHERE id = ?').bind(id).first();

    if (!task) {
        return jsonResponse({ error: 'Task not found' }, 404);
    }

    await env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run();

    // Log audit entry
    await logAudit(env, currentUser.id, currentUser.fullName, 'DELETE', 'Task', id, task.title, `Deleted task: ${task.title}`, request);

    return jsonResponse({ success: true });
}

function validateTask(data) {
    const errors = [];

    if (!data.title?.trim()) {
        errors.push('Title/Activity is required');
    }

    if (data.budget_amount !== undefined && data.budget_amount !== null && isNaN(parseFloat(data.budget_amount))) {
        errors.push('Budget amount must be a valid number');
    }

    if (data.contract_sum !== undefined && data.contract_sum !== null && isNaN(parseFloat(data.contract_sum))) {
        errors.push('Contract sum must be a valid number');
    }

    return errors;
}

// ==================== Task Award Document Functions ====================

async function uploadTaskAwardDocument(taskId, request, env, currentUser) {
    const task = await env.DB.prepare(
        'SELECT id, title FROM tasks WHERE id = ?'
    ).bind(taskId).first();

    if (!task) {
        return jsonResponse({ error: 'Task not found' }, 404);
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
        return jsonResponse({ error: 'No file provided' }, 400);
    }

    if (file.type !== 'application/pdf') {
        return jsonResponse({ error: 'Only PDF files are allowed' }, 400);
    }

    if (file.size > 10 * 1024 * 1024) {
        return jsonResponse({ error: 'File size exceeds 10MB limit' }, 400);
    }

    const timestamp = Date.now();
    const r2Key = `tasks/${taskId}/award_documents/${timestamp}_${file.name}`;

    await env.DOCUMENTS.put(r2Key, file.stream(), {
        httpMetadata: { contentType: 'application/pdf' },
        customMetadata: {
            taskId: taskId.toString(),
            originalName: file.name,
            type: 'award_document'
        }
    });

    // Update the task with the award document key
    await env.DB.prepare(`
        UPDATE tasks SET award_document_r2_key = ?, updated_at = datetime("now") WHERE id = ?
    `).bind(r2Key, taskId).run();

    // Log audit entry
    await logAudit(env, currentUser.id, currentUser.fullName, 'UPLOAD', 'TaskAwardDocument', taskId, task.title, `Uploaded award document "${file.name}" for task: ${task.title}`, request);

    return jsonResponse({
        success: true,
        award_document: {
            r2_key: r2Key,
            file_name: file.name
        }
    });
}

async function getTaskAwardDocument(taskId, env) {
    const task = await env.DB.prepare(
        'SELECT award_document_r2_key FROM tasks WHERE id = ?'
    ).bind(taskId).first();

    if (!task || !task.award_document_r2_key) {
        return jsonResponse({ error: 'Award document not found' }, 404);
    }

    const object = await env.DOCUMENTS.get(task.award_document_r2_key);

    if (!object) {
        return jsonResponse({ error: 'File not found in storage' }, 404);
    }

    const fileName = task.award_document_r2_key.split('/').pop();

    return new Response(object.body, {
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${fileName}"`,
            ...corsHeaders
        }
    });
}

async function deleteTaskAwardDocument(taskId, env, currentUser, request) {
    const task = await env.DB.prepare(
        'SELECT title, award_document_r2_key FROM tasks WHERE id = ?'
    ).bind(taskId).first();

    if (!task || !task.award_document_r2_key) {
        return jsonResponse({ error: 'Award document not found' }, 404);
    }

    // Delete from R2
    await env.DOCUMENTS.delete(task.award_document_r2_key);

    // Clear the reference in the database
    await env.DB.prepare(`
        UPDATE tasks SET award_document_r2_key = NULL, updated_at = datetime("now") WHERE id = ?
    `).bind(taskId).run();

    // Log audit entry
    await logAudit(env, currentUser.id, currentUser.fullName, 'DELETE', 'TaskAwardDocument', taskId, task.title, `Deleted award document for task: ${task.title}`, request);

    return jsonResponse({ success: true });
}

// ==================== Task Suppliers (Multi-Supplier Split) ====================

async function getTaskSuppliers(taskId, env) {
    const task = await env.DB.prepare('SELECT id FROM tasks WHERE id = ?').bind(taskId).first();
    if (!task) {
        return jsonResponse({ error: 'Task not found' }, 404);
    }

    const { results } = await env.DB.prepare(`
        SELECT id, task_id, supplier_name, amount, notes, created_at
        FROM task_suppliers
        WHERE task_id = ?
        ORDER BY created_at ASC
    `).bind(taskId).all();

    return jsonResponse({ suppliers: results || [] });
}

async function addTaskSupplier(taskId, request, env, currentUser) {
    const task = await env.DB.prepare('SELECT id, title FROM tasks WHERE id = ?').bind(taskId).first();
    if (!task) {
        return jsonResponse({ error: 'Task not found' }, 404);
    }

    const body = await request.json();

    if (!body.supplier_name?.trim()) {
        return jsonResponse({ error: 'Supplier name is required' }, 400);
    }

    if (body.amount === undefined || body.amount === null || isNaN(parseFloat(body.amount))) {
        return jsonResponse({ error: 'Valid amount is required' }, 400);
    }

    const result = await env.DB.prepare(`
        INSERT INTO task_suppliers (task_id, supplier_name, amount, notes, created_at)
        VALUES (?, ?, ?, ?, datetime("now"))
    `).bind(
        taskId,
        body.supplier_name.trim(),
        parseFloat(body.amount),
        body.notes?.trim() || null
    ).run();

    const supplierId = result.meta.last_row_id;
    const supplier = await env.DB.prepare('SELECT * FROM task_suppliers WHERE id = ?').bind(supplierId).first();

    // Log audit entry
    await logAudit(env, currentUser.id, currentUser.fullName, 'CREATE', 'TaskSupplier', supplierId, body.supplier_name.trim(), `Added supplier "${body.supplier_name.trim()}" to task: ${task.title}`, request);

    return jsonResponse({ success: true, supplier }, 201);
}

async function saveTaskSuppliers(taskId, request, env, currentUser) {
    const task = await env.DB.prepare('SELECT id, title FROM tasks WHERE id = ?').bind(taskId).first();
    if (!task) {
        return jsonResponse({ error: 'Task not found' }, 404);
    }

    const body = await request.json();
    const suppliers = body.suppliers || [];

    // Delete all existing suppliers for this task
    await env.DB.prepare('DELETE FROM task_suppliers WHERE task_id = ?').bind(taskId).run();

    // Insert new suppliers and calculate total
    const insertedSuppliers = [];
    let totalContractSum = 0;

    for (const supplier of suppliers) {
        if (!supplier.supplier_name?.trim() || !supplier.amount) continue;

        const amount = parseFloat(supplier.amount);
        totalContractSum += amount;

        const result = await env.DB.prepare(`
            INSERT INTO task_suppliers (task_id, supplier_name, amount, notes, created_at)
            VALUES (?, ?, ?, ?, datetime("now"))
        `).bind(
            taskId,
            supplier.supplier_name.trim(),
            amount,
            supplier.notes?.trim() || null
        ).run();

        const insertedId = result.meta.last_row_id;
        const insertedSupplier = await env.DB.prepare('SELECT * FROM task_suppliers WHERE id = ?').bind(insertedId).first();
        insertedSuppliers.push(insertedSupplier);
    }

    // Update the task's contract_sum with the total of all supplier amounts
    if (insertedSuppliers.length > 0) {
        await env.DB.prepare(`
            UPDATE tasks SET contract_sum = ?, updated_at = datetime("now") WHERE id = ?
        `).bind(totalContractSum, taskId).run();
    }

    // Log audit entry
    await logAudit(env, currentUser.id, currentUser.fullName, 'UPDATE', 'TaskSuppliers', taskId, task.title, `Updated suppliers for task: ${task.title} (${insertedSuppliers.length} suppliers, total: ${totalContractSum})`, request);

    return jsonResponse({ success: true, suppliers: insertedSuppliers, contractSum: totalContractSum });
}

async function deleteTaskSupplier(taskId, supplierId, env, currentUser, request) {
    const task = await env.DB.prepare('SELECT id, title FROM tasks WHERE id = ?').bind(taskId).first();
    if (!task) {
        return jsonResponse({ error: 'Task not found' }, 404);
    }

    const supplier = await env.DB.prepare('SELECT * FROM task_suppliers WHERE id = ? AND task_id = ?').bind(supplierId, taskId).first();
    if (!supplier) {
        return jsonResponse({ error: 'Supplier not found' }, 404);
    }

    await env.DB.prepare('DELETE FROM task_suppliers WHERE id = ?').bind(supplierId).run();

    // Log audit entry
    await logAudit(env, currentUser.id, currentUser.fullName, 'DELETE', 'TaskSupplier', supplierId, supplier.supplier_name, `Removed supplier "${supplier.supplier_name}" from task: ${task.title}`, request);

    return jsonResponse({ success: true });
}

// ==================== Utility ====================

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
        }
    });
}
