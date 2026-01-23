/**
 * Supplier Document Management System
 * API Client - VERSION 2
 * 
 * Bureau of Statistics — Procurement Unit
 */

class SupplierAPI {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.token = localStorage.getItem('auth_token');
    }

    /**
     * Store authentication token
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    }

    /**
     * Get stored token
     */
    getToken() {
        return this.token || localStorage.getItem('auth_token');
    }

    /**
     * Clear authentication
     */
    logout() {
        this.token = null;
        localStorage.removeItem('auth_token');
    }

    /**
     * Check if authenticated
     */
    isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Make authenticated API request
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP error! status: ${response.status}`);
        }

        return response.json();
    }

    /**
     * Authenticate with token
     */
    async authenticate(token) {
        const response = await fetch(`${this.baseUrl}/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });

        const data = await response.json();

        if (data.success) {
            this.setToken(token);
        }

        return data;
    }

    // ==================== Categories ====================

    /**
     * Get all categories
     */
    async getCategories() {
        const response = await this.request('/categories');
        return response.categories || [];
    }

    /**
     * Create a new category
     */
    async createCategory(name) {
        return await this.request('/categories', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
    }

    /**
     * Delete a category
     */
    async deleteCategory(id) {
        return await this.request(`/categories/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * Seed default categories
     */
    async seedCategories() {
        return await this.request('/seed/categories', {
            method: 'POST',
            body: JSON.stringify({
                categories: CONFIG.DEFAULT_CATEGORIES
            })
        });
    }

    // ==================== Suppliers ====================

    /**
     * Get all suppliers with optional filters
     */
    async getSuppliers(filters = {}) {
        let endpoint = '/suppliers';
        const params = new URLSearchParams();

        if (filters.category) params.append('category', filters.category);
        if (filters.search) params.append('search', filters.search);

        if (params.toString()) {
            endpoint += `?${params.toString()}`;
        }

        const response = await this.request(endpoint);
        return response.suppliers || [];
    }

    /**
     * Get a single supplier by ID
     */
    async getSupplier(id) {
        const response = await this.request(`/suppliers/${id}`);
        return response.supplier;
    }

    /**
     * Create a new supplier
     */
    async createSupplier(data) {
        return await this.request('/suppliers', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * Update an existing supplier
     */
    async updateSupplier(id, data) {
        return await this.request(`/suppliers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * Delete a supplier
     */
    async deleteSupplier(id) {
        return await this.request(`/suppliers/${id}`, {
            method: 'DELETE'
        });
    }

    // ==================== Documents ====================

    /**
     * Upload a document for a supplier
     */
    async uploadDocument(supplierId, documentType, file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);

        const response = await fetch(`${this.baseUrl}/suppliers/${supplierId}/documents`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(error.error || 'Failed to upload document');
        }

        return response.json();
    }

    /**
     * Get direct URL for document (for viewing/downloading)
     * This returns the URL string, not a fetch request
     * The worker serves the PDF directly at this endpoint
     */
    getDocumentDirectUrl(supplierId, documentType) {
        const token = this.getToken();
        return `${this.baseUrl}/suppliers/${supplierId}/documents/${documentType}?token=${encodeURIComponent(token)}`;
    }

    /**
     * Get document URL (legacy method)
     */
    async getDocumentUrl(supplierId, documentType) {
        return await this.request(`/suppliers/${supplierId}/documents/${documentType}`);
    }

    /**
     * Delete a document
     */
    async deleteDocument(supplierId, documentType) {
        return await this.request(`/suppliers/${supplierId}/documents/${documentType}`, {
            method: 'DELETE'
        });
    }

    // ==================== Statistics ====================

    /**
     * Get dashboard statistics
     */
    async getStatistics() {
        const response = await this.request('/statistics');
        return response.statistics;
    }
}

// Create global API instance
const api = new SupplierAPI(CONFIG.API_BASE_URL);
