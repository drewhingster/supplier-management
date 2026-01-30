/**
 * Supplier Document Management System
 * API Client - VERSION 4 (with Contracts)
 * 
 * Bureau of Statistics — Procurement Unit
 */

class SupplierAPI {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.token = localStorage.getItem('auth_token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('auth_token', token);
    }

    getToken() {
        return this.token || localStorage.getItem('auth_token');
    }

    logout() {
        this.token = null;
        localStorage.removeItem('auth_token');
    }

    isAuthenticated() {
        return !!this.getToken();
    }

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

    async getCategories() {
        const response = await this.request('/categories');
        return response.categories || [];
    }

    async createCategory(name) {
        return await this.request('/categories', {
            method: 'POST',
            body: JSON.stringify({ name })
        });
    }

    async deleteCategory(id) {
        return await this.request(`/categories/${id}`, {
            method: 'DELETE'
        });
    }

    async seedCategories() {
        return await this.request('/seed/categories', {
            method: 'POST',
            body: JSON.stringify({
                categories: CONFIG.DEFAULT_CATEGORIES
            })
        });
    }

    // ==================== Suppliers ====================

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

    async getSupplier(id) {
        const response = await this.request(`/suppliers/${id}`);
        return response.supplier;
    }

    async createSupplier(data) {
        return await this.request('/suppliers', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateSupplier(id, data) {
        return await this.request(`/suppliers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteSupplier(id) {
        return await this.request(`/suppliers/${id}`, {
            method: 'DELETE'
        });
    }

    // ==================== Supplier Documents ====================

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

    getDocumentDirectUrl(supplierId, documentType) {
        const token = this.getToken();
        return `${this.baseUrl}/suppliers/${supplierId}/documents/${documentType}?token=${encodeURIComponent(token)}`;
    }

    async deleteDocument(supplierId, documentType) {
        return await this.request(`/suppliers/${supplierId}/documents/${documentType}`, {
            method: 'DELETE'
        });
    }

    // ==================== Contracts ====================

    async getContracts(filters = {}) {
        let endpoint = '/contracts';
        const params = new URLSearchParams();

        if (filters.supplier_id) params.append('supplier_id', filters.supplier_id);
        if (filters.search) params.append('search', filters.search);

        if (params.toString()) {
            endpoint += `?${params.toString()}`;
        }

        const response = await this.request(endpoint);
        return response.contracts || [];
    }

    async getContract(id) {
        const response = await this.request(`/contracts/${id}`);
        return response.contract;
    }

    async createContract(data) {
        return await this.request('/contracts', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateContract(id, data) {
        return await this.request(`/contracts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteContract(id) {
        return await this.request(`/contracts/${id}`, {
            method: 'DELETE'
        });
    }

    // ==================== Contract Files ====================

    async uploadContractFile(contractId, file) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.baseUrl}/contracts/${contractId}/files`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.token}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Upload failed' }));
            throw new Error(error.error || 'Failed to upload contract file');
        }

        return response.json();
    }

    getContractFileUrl(contractId, fileId) {
        const token = this.getToken();
        return `${this.baseUrl}/contracts/${contractId}/files/${fileId}?token=${encodeURIComponent(token)}`;
    }

    async deleteContractFile(contractId, fileId) {
        return await this.request(`/contracts/${contractId}/files/${fileId}`, {
            method: 'DELETE'
        });
    }

    // ==================== Setup ====================

    async setupContractsTables() {
        return await this.request('/setup/contracts', {
            method: 'POST'
        });
    }

    // ==================== Statistics ====================

    async getStatistics() {
        const response = await this.request('/statistics');
        return response.statistics;
    }
}

// Create global API instance
const api = new SupplierAPI(CONFIG.API_BASE_URL);
