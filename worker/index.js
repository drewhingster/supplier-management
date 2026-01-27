/**
 * Supplier Document Management System
 * Cloudflare Worker API Backend - VERSION 3
 * 
 * Bureau of Statistics — Procurement Unit
 * 
 * UPDATES:
 * 1. Multi-category support via supplier_categories junction table
 * 2. NIS/GRA expiration dates with automatic compliance calculation
 * 3. Token auth via query parameter for document viewing
 * 4. Compliance alert system with days remaining calculations
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

// Alert configuration
const ALERT_CONFIG = {
    WARNING_THRESHOLD_DAYS: 30,  // Days before expiration to show warning
};

export default {
    async fetch(request, env, ctx) {
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        try {
            // Auth endpoint (no auth required)
            if (path === '/api/auth/verify' && request.method === 'POST') {
                return await handleAuth(request, env);
            }

            // All other routes require authentication
            const authResult = await verifyAuth(request, env);
            if (!authResult.authenticated) {
                return jsonResponse({ error: 'Unauthorized' }, 401);
            }

            // Categories routes
            if (path === '/api/categories') {
                if (request.method === 'GET') return await getCategories(env);
                if (request.method === 'POST') return await createCategory(request, env);
            }

            if (path.match(/^\/api\/categories\/\d+$/)) {
                const id = parseInt(path.split('/').pop());
                if (request.method === 'DELETE') return await deleteCategory(id, env);
            }

            // Suppliers routes
            if (path === '/api/suppliers') {
                if (request.method === 'GET') return await getSuppliers(request, env);
                if (request.method === 'POST') return await createSupplier(request, env);
            }

            if (path.match(/^\/api\/suppliers\/\d+$/)) {
                const id = parseInt(path.split('/').pop());
                if (request.method === 'GET') return await getSupplier(id, env);
                if (request.method === 'PUT') return await updateSupplier(id, request, env);
                if (request.method === 'DELETE') return await deleteSupplier(id, env);
            }

            // Document routes
            if (path.match(/^\/api\/suppliers\/\d+\/documents$/)) {
                const supplierId = parseInt(path.split('/')[3]);
                if (request.method === 'POST') return await uploadDocument(supplierId, request, env);
            }

            if (path.match(/^\/api\/suppliers\/\d+\/documents\/[a-z_]+$/)) {
                const parts = path.split('/');
                const supplierId = parseInt(parts[3]);
                const docType = parts[5];
                if (request.method === 'GET') return await getDocumentFile(supplierId, docType, env);
                if (request.method === 'DELETE') return await deleteDocument(supplierId, docType, env);
            }

            // Statistics route
            if (path === '/api/statistics' && request.method === 'GET') {
                return await getStatistics(env);
            }

            // Alerts route
            if (path === '/api/alerts' && request.method === 'GET') {
                return await getAlerts(env);
            }

            // Seed routes
            if (path === '/api/seed/categories' && request.method === 'POST') {
                return await seedCategories(request, env);
            }

            return jsonResponse({ error: 'Not found' }, 404);

        } catch (error) {
            console.error('API Error:', error);
            return jsonResponse({ error: error.message || 'Internal server error' }, 500);
        }
    }
};

// ==================== Authentication ====================

async function handleAuth(request, env) {
    const body = await request.json();
    const token = body.token;

    if (token === env.AUTH_TOKEN) {
        return jsonResponse({ success: true, message: 'Authentication successful' });
    }

    return jsonResponse({ success: false, error: 'Invalid token' }, 401);
}

async function verifyAuth(request, env) {
    // Check Authorization header first
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        if (token === env.AUTH_TOKEN) {
            return { authenticated: true };
        }
    }

    // Also check query parameter (for direct document access)
    const url = new URL(request.url);
    const queryToken = url.searchParams.get('token');
    if (queryToken && queryToken === env.AUTH_TOKEN) {
        return { authenticated: true };
    }

    return { authenticated: false };
}

// ==================== Alert Calculations ====================

/**
 * Calculate days remaining until a date
 * Returns negative number if date has passed
 */
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

/**
 * Determine alert level for a supplier
 * Returns: 'critical', 'warning', 'action_needed', or null
 */
function calculateAlertLevel(supplier, missingDocs, nisDaysRemaining, graDaysRemaining) {
    // Critical: Any compliance expired
    if (nisDaysRemaining !== null && nisDaysRemaining < 0) return 'critical';
    if (graDaysRemaining !== null && graDaysRemaining < 0) return 'critical';
    
    // Warning: Expiring within threshold
    if (nisDaysRemaining !== null && nisDaysRemaining >= 0 && nisDaysRemaining <= ALERT_CONFIG.WARNING_THRESHOLD_DAYS) return 'warning';
    if (graDaysRemaining !== null && graDaysRemaining >= 0 && graDaysRemaining <= ALERT_CONFIG.WARNING_THRESHOLD_DAYS) return 'warning';
    
    // Action needed: Missing documents
    if (missingDocs.length > 0) return 'action_needed';
    
    return null;
}

/**
 * Get list of missing documents for a supplier
 */
function getMissingDocuments(documents) {
    const uploadedTypes = documents.map(d => d.document_type);
    return DOCUMENT_TYPES.filter(type => !uploadedTypes.includes(type));
}

/**
 * Build alert details for a supplier
 */
function buildAlertDetails(supplier, missingDocs, nisDaysRemaining, graDaysRemaining) {
    const alerts = [];
    
    // Expired compliance
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
    
    // Expiring soon
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
    
    // Missing documents
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

async function createCategory(request, env) {
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

    return jsonResponse({
        success: true,
        category: { id: result.meta.last_row_id, name }
    }, 201);
}

async function deleteCategory(id, env) {
    // Check if category has suppliers (via junction table)
    const supplierCount = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM supplier_categories WHERE category_id = ?'
    ).bind(id).first();

    if (supplierCount && supplierCount.count > 0) {
        return jsonResponse({
            error: 'Cannot delete category with associated suppliers'
        }, 400);
    }

    await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();

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

    // Join with supplier_categories if filtering by category
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

    // Get documents and categories for each supplier
    const suppliers = await Promise.all(result.results.map(async (supplier) => {
        // Get documents
        const docs = await env.DB.prepare(
            'SELECT document_type, file_name, uploaded_at FROM documents WHERE supplier_id = ?'
        ).bind(supplier.id).all();

        // Get categories via junction table
        const cats = await env.DB.prepare(`
            SELECT c.id, c.name 
            FROM categories c 
            INNER JOIN supplier_categories sc ON c.id = sc.category_id 
            WHERE sc.supplier_id = ?
        `).bind(supplier.id).all();

        // Calculate compliance status and days remaining
        const today = new Date().toISOString().split('T')[0];
        const nisCompliant = supplier.nis_expiration_date ? supplier.nis_expiration_date >= today : null;
        const graCompliant = supplier.gra_expiration_date ? supplier.gra_expiration_date >= today : null;
        
        // Calculate days remaining
        const nisDaysRemaining = calculateDaysRemaining(supplier.nis_expiration_date);
        const graDaysRemaining = calculateDaysRemaining(supplier.gra_expiration_date);
        
        // Get missing documents
        const missingDocuments = getMissingDocuments(docs.results);
        
        // Calculate alert level
        const alertLevel = calculateAlertLevel(supplier, missingDocuments, nisDaysRemaining, graDaysRemaining);
        
        // Build alert details
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

    // Get documents
    const docs = await env.DB.prepare(
        'SELECT document_type, file_name, uploaded_at FROM documents WHERE supplier_id = ?'
    ).bind(id).all();

    // Get categories
    const cats = await env.DB.prepare(`
        SELECT c.id, c.name 
        FROM categories c 
        INNER JOIN supplier_categories sc ON c.id = sc.category_id 
        WHERE sc.supplier_id = ?
    `).bind(id).all();

    // Calculate compliance and alerts
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

async function createSupplier(request, env) {
    const body = await request.json();

    const errors = validateSupplier(body);
    if (errors.length > 0) {
        return jsonResponse({ error: errors.join(', ') }, 400);
    }

    // Insert supplier
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

    // Insert category relationships
    const categoryIds = body.category_ids || (body.category_id ? [body.category_id] : []);
    if (categoryIds.length > 0) {
        const catStmt = env.DB.prepare(
            'INSERT OR IGNORE INTO supplier_categories (supplier_id, category_id) VALUES (?, ?)'
        );
        const catBatch = categoryIds.map(catId => catStmt.bind(supplierId, catId));
        await env.DB.batch(catBatch);
    }

    // Get the created supplier
    const supplier = await env.DB.prepare('SELECT * FROM suppliers WHERE id = ?').bind(supplierId).first();

    return jsonResponse({ success: true, supplier }, 201);
}

async function updateSupplier(id, request, env) {
    const body = await request.json();

    const existing = await env.DB.prepare('SELECT id FROM suppliers WHERE id = ?').bind(id).first();
    if (!existing) {
        return jsonResponse({ error: 'Supplier not found' }, 404);
    }

    const errors = validateSupplier(body);
    if (errors.length > 0) {
        return jsonResponse({ error: errors.join(', ') }, 400);
    }

    // Update supplier
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

    // Update category relationships
    // First delete existing
    await env.DB.prepare('DELETE FROM supplier_categories WHERE supplier_id = ?').bind(id).run();

    // Then insert new ones
    const categoryIds = body.category_ids || (body.category_id ? [body.category_id] : []);
    if (categoryIds.length > 0) {
        const catStmt = env.DB.prepare(
            'INSERT OR IGNORE INTO supplier_categories (supplier_id, category_id) VALUES (?, ?)'
        );
        const catBatch = categoryIds.map(catId => catStmt.bind(id, catId));
        await env.DB.batch(catBatch);
    }

    const supplier = await env.DB.prepare('SELECT * FROM suppliers WHERE id = ?').bind(id).first();

    return jsonResponse({ success: true, supplier });
}

async function deleteSupplier(id, env) {
    // Get documents for R2 cleanup
    const docs = await env.DB.prepare(
        'SELECT r2_key FROM documents WHERE supplier_id = ?'
    ).bind(id).all();

    // Delete from R2
    for (const doc of docs.results) {
        try {
            await env.DOCUMENTS.delete(doc.r2_key);
        } catch (e) {
            console.error('Failed to delete R2 object:', e);
        }
    }

    // Delete from database (cascade will handle supplier_categories and documents)
    await env.DB.prepare('DELETE FROM supplier_categories WHERE supplier_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM documents WHERE supplier_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM suppliers WHERE id = ?').bind(id).run();

    return jsonResponse({ success: true });
}

function validateSupplier(data) {
    const errors = [];

    if (!data.name?.trim()) errors.push('Supplier name is required');
    if (!data.address?.trim()) errors.push('Address is required');
    if (!data.telephone?.trim()) errors.push('Telephone is required');
    
    // Categories can be empty or provided
    const categoryIds = data.category_ids || (data.category_id ? [data.category_id] : []);
    if (categoryIds.length === 0) {
        errors.push('At least one category is required');
    }

    return errors;
}

// ==================== Documents ====================

async function uploadDocument(supplierId, request, env) {
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

    // Upload to R2
    await env.DOCUMENTS.put(r2Key, file.stream(), {
        httpMetadata: { contentType: 'application/pdf' },
        customMetadata: {
            supplierId: supplierId.toString(),
            documentType: documentType,
            originalName: file.name
        }
    });

    // Delete old document if exists
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

    // Save document metadata
    await env.DB.prepare(`
        INSERT INTO documents (supplier_id, document_type, file_name, r2_key, uploaded_at)
        VALUES (?, ?, ?, ?, datetime("now"))
    `).bind(supplierId, documentType, file.name, r2Key).run();

    // Update supplier timestamp
    await env.DB.prepare(
        'UPDATE suppliers SET updated_at = datetime("now") WHERE id = ?'
    ).bind(supplierId).run();

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

async function deleteDocument(supplierId, docType, env) {
    if (!DOCUMENT_TYPES.includes(docType)) {
        return jsonResponse({ error: 'Invalid document type' }, 400);
    }

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

    // Get compliance stats based on expiration dates
    const today = new Date().toISOString().split('T')[0];
    
    const nisExpired = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM suppliers WHERE nis_expiration_date IS NOT NULL AND nis_expiration_date < ?'
    ).bind(today).first();

    const graExpired = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM suppliers WHERE gra_expiration_date IS NOT NULL AND gra_expiration_date < ?'
    ).bind(today).first();

    // Count suppliers needing attention
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

    return jsonResponse({
        statistics: {
            totalSuppliers: totalSuppliers.count,
            totalCategories: totalCategories.count,
            totalDocuments: totalDocuments.count,
            compliantSuppliers: compliantSuppliers.count,
            nisExpired: nisExpired.count,
            graExpired: graExpired.count,
            needsAttention: needsAttention.count
        }
    });
}

// ==================== Alerts ====================

async function getAlerts(env) {
    const today = new Date().toISOString().split('T')[0];
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + ALERT_CONFIG.WARNING_THRESHOLD_DAYS);
    const warningDateStr = warningDate.toISOString().split('T')[0];

    // Get all suppliers that need attention
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

    // Build detailed alerts for each supplier
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
