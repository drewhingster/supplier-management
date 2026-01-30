/**
 * Supplier Document Management System - API Client
 * Bureau of Statistics - Procurement Unit
 * 
 * Updated: January 2026 (Added Contract Management Methods)
 * 
 * This file handles all communication with the Cloudflare Worker backend.
 * Import CONFIG from config.js before using this module.
 */

const API = {
    // ============================================================
    // CONFIGURATION & HELPERS
    // ============================================================
    
    token: null,

    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    },

    getToken() {
        if (!this.token) {
            this.token = localStorage.getItem('auth_token');
        }
        return this.token;
    },

    clearToken() {
        this.token = null;
        localStorage.removeItem('auth_token');
    },

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    async handleResponse(response) {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || `HTTP error ${response.status}`);
        }
        return data;
    },

    // ============================================================
    // AUTHENTICATION
    // ============================================================

    async verifyToken(token) {
        const response = await fetch(`${CONFIG.API_BASE_URL}/auth/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
        });
        return this.handleResponse(response);
    },

    // ============================================================
    // CATEGORIES
    // ============================================================

    async getCategories() {
        const response = await fetch(`${CONFIG.API_BASE_URL}/categories`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },

    async createCategory(name) {
        const response = await fetch(`${CONFIG.API_BASE_URL}/categories`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ name })
        });
        return this.handleResponse(response);
    },

    async deleteCategory(id) {
        const response = await fetch(`${CONFIG.API_BASE_URL}/categories/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },

    async seedCategories() {
        const response = await fetch(`${CONFIG.API_BASE_URL}/seed/categories`, {
            method: 'POST',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },

    // ============================================================
    // SUPPLIERS
    // ============================================================

    async getSuppliers(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.category) queryParams.append('category', params.category);
        if (params.search) queryParams.append('search', params.search);

        const url = `${CONFIG.API_BASE_URL}/suppliers${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await fetch(url, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },

    async getSupplier(id) {
        const response = await fetch(`${CONFIG.API_BASE_URL}/suppliers/${id}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },

    async createSupplier(data) {
        const response = await fetch(`${CONFIG.API_BASE_URL}/suppliers`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    },

    async updateSupplier(id, data) {
        const response = await fetch(`${CONFIG.API_BASE_URL}/suppliers/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    },

    async deleteSupplier(id) {
        const response = await fetch(`${CONFIG.API_BASE_URL}/suppliers/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },

    // ============================================================
    // SUPPLIER DOCUMENTS
    // ============================================================

    async uploadDocument(supplierId, documentType, file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_type', documentType);

        const response = await fetch(`${CONFIG.API_BASE_URL}/suppliers/${supplierId}/documents`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: formData
        });
        return this.handleResponse(response);
    },

    getDocumentUrl(supplierId, documentType) {
        return `${CONFIG.API_BASE_URL}/suppliers/${supplierId}/documents/${documentType}?token=${encodeURIComponent(this.getToken())}`;
    },

    async deleteDocument(supplierId, documentType) {
        const response = await fetch(`${CONFIG.API_BASE_URL}/suppliers/${supplierId}/documents/${documentType}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },

    // ============================================================
    // CONTRACTS (NEW)
    // ============================================================

    /**
     * Get all contracts with optional filtering
     * @param {Object} params - Optional query parameters
     * @param {string} params.supplier_id - Filter by supplier ID
     * @param {string} params.search - Search query
     * @returns {Promise<{contracts: Array}>}
     */
    async getContracts(params = {}) {
        const queryParams = new URLSearchParams();
        if (params.supplier_id) queryParams.append('supplier_id', params.supplier_id);
        if (params.search) queryParams.append('search', params.search);

        const url = `${CONFIG.API_BASE_URL}/contracts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        const response = await fetch(url, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },

    /**
     * Get a single contract by ID
     * @param {number} id - Contract ID
     * @returns {Promise<{contract: Object}>}
     */
    async getContract(id) {
        const response = await fetch(`${CONFIG.API_BASE_URL}/contracts/${id}`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },

    /**
     * Create a new contract
     * @param {Object} data - Contract data
     * @param {string} data.contract_number - Unique contract number
     * @param {number} data.supplier_id - Supplier ID
     * @param {string} data.description - Contract description
     * @param {number} data.amount - Contract amount
     * @param {string} data.start_date - Start date (YYYY-MM-DD)
     * @param {string} data.end_date - End date (YYYY-MM-DD)
     * @param {Array} data.files - Array of file objects with {name, data (base64), size}
     * @returns {Promise<{success: boolean, id: number}>}
     */
    async createContract(data) {
        const response = await fetch(`${CONFIG.API_BASE_URL}/contracts`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    },

    /**
     * Update an existing contract
     * @param {number} id - Contract ID
     * @param {Object} data - Updated contract data
     * @returns {Promise<{success: boolean}>}
     */
    async updateContract(id, data) {
        const response = await fetch(`${CONFIG.API_BASE_URL}/contracts/${id}`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    },

    /**
     * Delete a contract
     * @param {number} id - Contract ID
     * @returns {Promise<{success: boolean}>}
     */
    async deleteContract(id) {
        const response = await fetch(`${CONFIG.API_BASE_URL}/contracts/${id}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },

    // ============================================================
    // CONTRACT FILES (NEW)
    // ============================================================

    /**
     * Upload a file to a contract using FormData
     * @param {number} contractId - Contract ID
     * @param {File} file - File object to upload
     * @returns {Promise<{success: boolean, file: Object}>}
     */
    async uploadContractFile(contractId, file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${CONFIG.API_BASE_URL}/contracts/${contractId}/files`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.getToken()}`
            },
            body: formData
        });
        return this.handleResponse(response);
    },

    /**
     * Get URL for viewing/downloading a contract file
     * @param {number} contractId - Contract ID
     * @param {number} fileId - File ID
     * @returns {string} - URL with authentication token
     */
    getContractFileUrl(contractId, fileId) {
        return `${CONFIG.API_BASE_URL}/contracts/${contractId}/files/${fileId}?token=${encodeURIComponent(this.getToken())}`;
    },

    /**
     * Get contract file (returns file data)
     * @param {number} contractId - Contract ID
     * @param {number} fileId - File ID
     * @returns {Promise<{url: string, name: string}>}
     */
    async getContractFile(contractId, fileId) {
        // Return the direct URL for download
        return {
            url: this.getContractFileUrl(contractId, fileId),
            name: `contract_${contractId}_file_${fileId}.pdf`
        };
    },

    /**
     * Delete a contract file
     * @param {number} contractId - Contract ID
     * @param {number} fileId - File ID
     * @returns {Promise<{success: boolean}>}
     */
    async deleteContractFile(contractId, fileId) {
        const response = await fetch(`${CONFIG.API_BASE_URL}/contracts/${contractId}/files/${fileId}`, {
            method: 'DELETE',
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },

    // ============================================================
    // STATISTICS & ALERTS
    // ============================================================

    /**
     * Get dashboard statistics
     * @returns {Promise<{statistics: Object}>}
     */
    async getStatistics() {
        const response = await fetch(`${CONFIG.API_BASE_URL}/statistics`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    },

    /**
     * Get compliance alerts (expiring/expired NIS, GRA, contracts)
     * @returns {Promise<{alerts: Array}>}
     */
    async getAlerts() {
        const response = await fetch(`${CONFIG.API_BASE_URL}/alerts`, {
            headers: this.getHeaders()
        });
        return this.handleResponse(response);
    }
};

// Make API available globally
window.API = API;
