/**
 * Supplier Document Management System
 * API Module
 * 
 * Handles all communication with the Cloudflare Worker backend
 * Bureau of Statistics — Procurement Unit
 */

class SupplierAPI {
    constructor() {
        this.baseUrl = CONFIG.API_BASE_URL;
        this.token = null;
    }

    /**
     * Set the authentication token
     * @param {string} token - The auth token
     */
    setToken(token) {
        this.token = token;
        localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
        
        // Set session expiry
        const expiry = Date.now() + CONFIG.SESSION_TIMEOUT;
        localStorage.setItem(CONFIG.STORAGE_KEYS.SESSION_EXPIRY, expiry.toString());
    }

    /**
     * Get the stored authentication token
     * @returns {string|null}
     */
    getToken() {
        if (this.token) return this.token;
        
        const storedToken = localStorage.getItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        const expiry = localStorage.getItem(CONFIG.STORAGE_KEYS.SESSION_EXPIRY);
        
        if (storedToken && expiry && Date.now() < parseInt(expiry)) {
            this.token = storedToken;
            return this.token;
        }
        
        this.clearToken();
        return null;
    }

    /**
     * Clear the authentication token
     */
    clearToken() {
        this.token = null;
        localStorage.removeItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.SESSION_EXPIRY);
    }

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!this.getToken();
    }

    /**
     * Make an authenticated API request
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>}
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const headers = {
            ...options.headers
        };

        // Add auth token if available
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // Add JSON content type for non-FormData requests
        if (options.body && !(options.body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            // Handle 401 Unauthorized
            if (response.status === 401) {
                this.clearToken();
                throw new Error('Session expired. Please log in again.');
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Request failed with status ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    }

    // ==================== Authentication ====================

    /**
     * Authenticate with the API
     * @param {string} token - Access token
     * @returns {Promise<Object>}
     */
    async authenticate(token) {
        const response = await this.request('/auth/verify', {
            method: 'POST',
            body: JSON.stringify({ token })
        });
        
        if (response.success) {
            this.setToken(token);
        }
        
        return response;
    }

    /**
     * Logout and clear session
     */
    logout() {
        this.clearToken();
    }

    // ==================== Categories ====================

    /**
     * Get all categories
     * @returns {Promise<Array>}
     */
    async getCategories() {
        const response = await this.request('/categories');
        return response.categories || [];
    }

    /**
     * Create a new category
     * @param {string} name - Category name
     * @returns {Promise<Object>}
     */
    async createCategory(name) {
        return await this.request('/categories', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
    }

    /**
     * Delete a category
     * @param {number} id - Category ID
     * @returns {Promise<Object>}
     */
    async deleteCategory(id) {
        return await this.request(`/categories/${id}`, {
            method: 'DELETE'
        });
    }

    // ==================== Suppliers ====================

    /**
     * Get all suppliers
     * @param {Object} filters - Optional filters
     * @returns {Promise<Array>}
     */
    async getSuppliers(filters = {}) {
        const params = new URLSearchParams();
        
        if (filters.category) params.append('category', filters.category);
        if (filters.search) params.append('search', filters.search);
        if (filters.compliant !== undefined) params.append('compliant', filters.compliant);
        
        const queryString = params.toString();
        const endpoint = queryString ? `/suppliers?${queryString}` : '/suppliers';
        
        const response = await this.request(endpoint);
        return response.suppliers || [];
    }

    /**
     * Get a single supplier by ID
     * @param {number} id - Supplier ID
     * @returns {Promise<Object>}
     */
    async getSupplier(id) {
        const response = await this.request(`/suppliers/${id}`);
        return response.supplier;
    }

    /**
     * Create a new supplier
     * @param {Object} supplierData - Supplier information
     * @returns {Promise<Object>}
     */
    async createSupplier(supplierData) {
        return await this.request('/suppliers', {
            method: 'POST',
            body: JSON.stringify(supplierData)
        });
    }

    /**
     * Update an existing supplier
     * @param {number} id - Supplier ID
     * @param {Object} supplierData - Updated supplier information
     * @returns {Promise<Object>}
     */
    async updateSupplier(id, supplierData) {
        return await this.request(`/suppliers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(supplierData)
        });
    }

    /**
     * Delete a supplier
     * @param {number} id - Supplier ID
     * @returns {Promise<Object>}
     */
    async deleteSupplier(id) {
        return await this.request(`/suppliers/${id}`, {
            method: 'DELETE'
        });
    }

    // ==================== Documents ====================

    /**
     * Upload a document for a supplier
     * @param {number} supplierId - Supplier ID
     * @param {string} documentType - Type of document
     * @param {File} file - PDF file to upload
     * @returns {Promise<Object>}
     */
    async uploadDocument(supplierId, documentType, file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);

        return await this.request(`/suppliers/${supplierId}/documents`, {
            method: 'POST',
            body: formData
        });
    }

    /**
     * Get document download URL
     * @param {number} supplierId - Supplier ID
     * @param {string} documentType - Type of document
     * @returns {Promise<Object>}
     */
    async getDocumentUrl(supplierId, documentType) {
        return await this.request(`/suppliers/${supplierId}/documents/${documentType}`);
    }

    /**
     * Delete a document
     * @param {number} supplierId - Supplier ID
     * @param {string} documentType - Type of document
     * @returns {Promise<Object>}
     */
    async deleteDocument(supplierId, documentType) {
        return await this.request(`/suppliers/${supplierId}/documents/${documentType}`, {
            method: 'DELETE'
        });
    }

    // ==================== Statistics ====================

    /**
     * Get dashboard statistics
     * @returns {Promise<Object>}
     */
    async getStatistics() {
        const response = await this.request('/statistics');
        return response.statistics || {};
    }

    // ==================== Seed Data ====================

    /**
     * Seed default categories if none exist
     * @returns {Promise<Object>}
     */
    async seedCategories() {
        return await this.request('/seed/categories', {
            method: 'POST',
            body: JSON.stringify({ categories: CONFIG.DEFAULT_CATEGORIES })
        });
    }
}

// Create singleton instance
const api = new SupplierAPI();
