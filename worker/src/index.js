/**
 * Supplier Document Management System
 * Cloudflare Worker API Backend
 * 
 * Bureau of Statistics — Procurement Unit
 * 
 * This Worker handles all API requests for supplier management,
 * document storage, and authentication.
 */

// CORS headers for all responses
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
};

// Document types
const DOCUMENT_TYPES = [
    'business_registration',
    'nis_compliance',
    'gra_compliance',
    'tin_certificate'
];

/**
 * Main request handler
 */
export default {
    async fetch(request, env, ctx) {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);
        const path = url.pathname;

        try {
            // Route handling
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
                if (request.method === 'GET') return await getDocumentUrl(supplierId, docType, env);
                if (request.method === 'DELETE') return await deleteDocument(supplierId, docType, env);
            }

            // Statistics route
            if (path === '/api/statistics' && request.method === 'GET') {
                return await getStatistics(env);
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

    // Verify against stored token
    // In production, use a more secure method
    if (token === env.AUTH_TOKEN) {
        return jsonResponse({ success: true, message: 'Authentication successful' });
    }

    return jsonResponse({ success: false, error: 'Invalid token' }, 401);
}

async function verifyAuth(request, env) {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { authenticated: false };
    }

    const token = authHeader.substring(7);

    if (token === env.AUTH_TOKEN) {
        return { authenticated: true };
    }

    return { authenticated: false };
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

    // Check for duplicate
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
    // Check if category has suppliers
    const supplierCount = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM suppliers WHERE category_id = ?'
    ).bind(id).first();

    if (supplierCount.count > 0) {
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

    // Check if categories already exist
    const existing = await env.DB.prepare(
        'SELECT COUNT(*) as count FROM categories'
    ).first();

    if (existing.count > 0) {
        return jsonResponse({ message: 'Categories already seeded', seeded: false });
    }

    // Insert default categories
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
        SELECT 
            s.id, s.name, s.address, s.telephone, s.email, 
            s.contact_person, s.category_id, s.created_at, s.updated_at
        FROM suppliers s
        WHERE 1=1
    `;
    const bindings = [];

    if (categoryFilter) {
        query += ' AND s.category_id = ?';
        bindings.push(parseInt(categoryFilter));
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

    // Get documents for each supplier
    const suppliers = await Promise.all(result.results.map(async (supplier) => {
        const docs = await env.DB.prepare(
            'SELECT document_type, file_name, uploaded_at FROM documents WHERE supplier_id = ?'
        ).bind(supplier.id).all();
        
        return { ...supplier, documents: docs.results };
    }));

    return jsonResponse({ suppliers });
}

async function getSupplier(id, env) {
    const supplier = await env.DB.prepare(
        `SELECT id, name, address, telephone, email, contact_person, 
                category_id, created_at, updated_at 
         FROM suppliers WHERE id = ?`
    ).bind(id).first();

    if (!supplier) {
        return jsonResponse({ error: 'Supplier not found' }, 404);
    }

    const docs = await env.DB.prepare(
        'SELECT document_type, file_name, uploaded_at FROM documents WHERE supplier_id = ?'
    ).bind(id).all();

    supplier.documents = docs.results;

    return jsonResponse({ supplier });
}

async function createSupplier(request, env) {
    const body = await request.json();

    // Validation
    const errors = validateSupplier(body);
    if (errors.length > 0) {
        return jsonResponse({ error: errors.join(', ') }, 400);
    }

    const result = await env.DB.prepare(`
        INSERT INTO suppliers (name, address, telephone, email, contact_person, category_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime("now"), datetime("now"))
    `).bind(
        body.name.trim(),
        body.address.trim(),
        body.telephone.trim(),
        body.email || null,
        body.contact_person || null,
        body.category_id
    ).run();

    const supplier = await env.DB.prepare(
        'SELECT * FROM suppliers WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    return jsonResponse({ success: true, supplier }, 201);
}

async function updateSupplier(id, request, env) {
    const body = await request.json();

    // Check supplier exists
    const existing = await env.DB.prepare(
        'SELECT id FROM suppliers WHERE id = ?'
    ).bind(id).first();

    if (!existing) {
        return jsonResponse({ error: 'Supplier not found' }, 404);
    }

    // Validation
    const errors = validateSupplier(body);
    if (errors.length > 0) {
        return jsonResponse({ error: errors.join(', ') }, 400);
    }

    await env.DB.prepare(`
        UPDATE suppliers 
        SET name = ?, address = ?, telephone = ?, email = ?, 
            contact_person = ?, category_id = ?, updated_at = datetime("now")
        WHERE id = ?
    `).bind(
        body.name.trim(),
        body.address.trim(),
        body.telephone.trim(),
        body.email || null,
        body.contact_person || null,
        body.category_id,
        id
    ).run();

    const supplier = await env.DB.prepare(
        'SELECT * FROM suppliers WHERE id = ?'
    ).bind(id).first();

    return jsonResponse({ success: true, supplier });
}

async function deleteSupplier(id, env) {
    // Get supplier documents for R2 cleanup
    const docs = await env.DB.prepare(
        'SELECT r2_key FROM documents WHERE supplier_id = ?'
    ).bind(id).all();

    // Delete documents from R2
    for (const doc of docs.results) {
        try {
            await env.R2_BUCKET.delete(doc.r2_key);
        } catch (e) {
            console.error('Failed to delete R2 object:', e);
        }
    }

    // Delete from database
    await env.DB.prepare('DELETE FROM documents WHERE supplier_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM suppliers WHERE id = ?').bind(id).run();

    return jsonResponse({ success: true });
}

function validateSupplier(data) {
    const errors = [];

    if (!data.name?.trim()) errors.push('Supplier name is required');
    if (!data.address?.trim()) errors.push('Address is required');
    if (!data.telephone?.trim()) errors.push('Telephone is required');
    if (!data.category_id) errors.push('Category is required');

    return errors;
}

// ==================== Documents ====================

async function uploadDocument(supplierId, request, env) {
    // Check supplier exists
    const supplier = await env.DB.prepare(
        'SELECT id, name FROM suppliers WHERE id = ?'
    ).bind(supplierId).first();

    if (!supplier) {
        return jsonResponse({ error: 'Supplier not found' }, 404);
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file');
    const documentType = formData.get('documentType');

    // Validate document type
    if (!DOCUMENT_TYPES.includes(documentType)) {
        return jsonResponse({ error: 'Invalid document type' }, 400);
    }

    // Validate file
    if (!file || !(file instanceof File)) {
        return jsonResponse({ error: 'No file provided' }, 400);
    }

    if (file.type !== 'application/pdf') {
        return jsonResponse({ error: 'Only PDF files are allowed' }, 400);
    }

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
        return jsonResponse({ error: 'File size exceeds 10MB limit' }, 400);
    }

    // Generate unique R2 key
    const timestamp = Date.now();
    const sanitizedName = supplier.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const r2Key = `suppliers/${supplierId}/${sanitizedName}/${documentType}_${timestamp}.pdf`;

    // Upload to R2
    await env.R2_BUCKET.put(r2Key, file.stream(), {
        httpMetadata: {
            contentType: 'application/pdf'
        },
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
            await env.R2_BUCKET.delete(oldDoc.r2_key);
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

    // Update supplier updated_at
    await env.DB.prepare(
        'UPDATE suppliers SET updated_at = datetime("now") WHERE id = ?'
    ).bind(supplierId).run();

    return jsonResponse({ success: true, documentType, fileName: file.name });
}

async function getDocumentUrl(supplierId, docType, env) {
    // Validate document type
    if (!DOCUMENT_TYPES.includes(docType)) {
        return jsonResponse({ error: 'Invalid document type' }, 400);
    }

    const doc = await env.DB.prepare(
        'SELECT r2_key, file_name FROM documents WHERE supplier_id = ? AND document_type = ?'
    ).bind(supplierId, docType).first();

    if (!doc) {
        return jsonResponse({ error: 'Document not found' }, 404);
    }

    // Generate signed URL (valid for 1 hour)
    // For R2, we need to use a presigned URL or serve directly
    // Here we'll create a temporary redirect to the R2 object
    
    const object = await env.R2_BUCKET.get(doc.r2_key);
    
    if (!object) {
        return jsonResponse({ error: 'Document file not found in storage' }, 404);
    }

    // Return the object directly as a PDF
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

    // Delete from R2
    try {
        await env.R2_BUCKET.delete(doc.r2_key);
    } catch (e) {
        console.error('Failed to delete R2 object:', e);
    }

    // Delete from database
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

    // Get compliant suppliers (those with all 4 document types)
    const compliantSuppliers = await env.DB.prepare(`
        SELECT COUNT(*) as count FROM suppliers s
        WHERE (SELECT COUNT(*) FROM documents d WHERE d.supplier_id = s.id) = ?
    `).bind(DOCUMENT_TYPES.length).first();

    return jsonResponse({
        statistics: {
            totalSuppliers: totalSuppliers.count,
            totalCategories: totalCategories.count,
            totalDocuments: totalDocuments.count,
            compliantSuppliers: compliantSuppliers.count
        }
    });
}

// ==================== Utility Functions ====================

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
        }
    });
}
