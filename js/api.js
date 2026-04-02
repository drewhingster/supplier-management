/**
 * Supplier Document Management System
 * API Client - VERSION 5 (with User Authentication & Audit)
 *
 * Bureau of Statistics — Procurement Unit
 */

class SupplierAPI {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.token = localStorage.getItem('session_token');
        this.currentUser = null;
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('session_token', token);
    }

    getToken() {
        return this.token || localStorage.getItem('session_token');
    }

    setCurrentUser(user) {
        this.currentUser = user;
        localStorage.setItem('current_user', JSON.stringify(user));
    }

    getCurrentUser() {
        if (this.currentUser) return this.currentUser;
        const stored = localStorage.getItem('current_user');
        if (stored) {
            this.currentUser = JSON.parse(stored);
            return this.currentUser;
        }
        return null;
    }

    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('session_token');
        localStorage.removeItem('current_user');
        // Also remove legacy token
        localStorage.removeItem('auth_token');
    }

    isAuthenticated() {
        return !!this.getToken();
    }

    isViewOnly() {
        const user = this.getCurrentUser();
        return user && user.role === 'view_only';
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

    // ==================== Authentication ====================

    async login(username, password) {
        const response = await fetch(`${this.baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.token) {
            this.setToken(data.token);
            this.setCurrentUser(data.user);
        }

        return { success: response.ok, ...data };
    }

    async checkSession() {
        const token = this.getToken();
        if (!token) return { success: false };

        try {
            const response = await fetch(`${this.baseUrl}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                this.setCurrentUser(data.user);
                return { success: true, user: data.user };
            } else {
                this.logout();
                return { success: false };
            }
        } catch (error) {
            console.error('Session check failed:', error);
            return { success: false };
        }
    }

    async changePassword(currentPassword, newPassword) {
        return await this.request('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify({ currentPassword, newPassword })
        });
    }

    async logoutSession() {
        try {
            await this.request('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout request failed:', error);
        }
        this.logout();
    }

    // Legacy auth for backward compatibility
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

    // ==================== Audit Logs ====================

    async getRecentAuditLogs(limit = 10) {
        return await this.request(`/audit-logs/recent?limit=${limit}`);
    }

    async getAuditLogs(filters = {}) {
        const params = new URLSearchParams();
        if (filters.user_id) params.append('user_id', filters.user_id);
        if (filters.action) params.append('action', filters.action);
        if (filters.entity_type) params.append('entity_type', filters.entity_type);
        if (filters.limit) params.append('limit', filters.limit);
        if (filters.offset) params.append('offset', filters.offset);

        const endpoint = '/audit-logs' + (params.toString() ? `?${params.toString()}` : '');
        return await this.request(endpoint);
    }

    async getUsers() {
        return await this.request('/users');
    }

    // ==================== Acknowledged Alerts ====================

    async getAcknowledgedAlerts() {
        return await this.request('/alerts/acknowledged');
    }

    async acknowledgeAlert(supplierId, alertType) {
        return await this.request('/alerts/acknowledge', {
            method: 'POST',
            body: JSON.stringify({ supplier_id: supplierId, alert_type: alertType })
        });
    }

    async unacknowledgeAlert(supplierId, alertType) {
        return await this.request('/alerts/unacknowledge', {
            method: 'POST',
            body: JSON.stringify({ supplier_id: supplierId, alert_type: alertType })
        });
    }

    async setupAcknowledgedAlertsTable() {
        return await this.request('/setup/acknowledged-alerts', { method: 'POST' });
    }

    async setupRemarksTable() {
        return await this.request('/setup/remarks', { method: 'POST' });
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

    // ==================== Supplier Remarks ====================

    async getSupplierRemarks(supplierId) {
        const response = await this.request(`/suppliers/${supplierId}/remarks`);
        return response.remarks || [];
    }

    async addSupplierRemark(supplierId, remark) {
        return await this.request(`/suppliers/${supplierId}/remarks`, {
            method: 'POST',
            body: JSON.stringify({ remark })
        });
    }

    async deleteSupplierRemark(supplierId, remarkId) {
        return await this.request(`/suppliers/${supplierId}/remarks/${remarkId}`, {
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

    async setupTasksTable() {
        return await this.request('/setup/tasks', {
            method: 'POST'
        });
    }

    // ==================== Outstanding Tasks (PSIP) ====================

    async getTasks(filters = {}) {
        let endpoint = '/tasks';
        const params = new URLSearchParams();

        if (filters.archived !== undefined) params.append('archived', filters.archived);
        if (filters.procurement_status) params.append('procurement_status', filters.procurement_status);
        if (filters.assigned_person) params.append('assigned_person', filters.assigned_person);
        if (filters.is_paid !== undefined) params.append('is_paid', filters.is_paid);

        if (params.toString()) {
            endpoint += `?${params.toString()}`;
        }

        const response = await this.request(endpoint);
        return response.tasks || [];
    }

    async getTask(id) {
        const response = await this.request(`/tasks/${id}`);
        return response.task;
    }

    async createTask(data) {
        return await this.request('/tasks', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateTask(id, data) {
        return await this.request(`/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async claimTask(id, assignedPerson) {
        return await this.request(`/tasks/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ assigned_person: assignedPerson })
        });
    }

    async deleteTask(id) {
        return await this.request(`/tasks/${id}`, {
            method: 'DELETE'
        });
    }

    // ==================== Task Suppliers (Multi-Supplier Split) ====================

    async getTaskSuppliers(taskId) {
        const response = await this.request(`/tasks/${taskId}/suppliers`);
        return response.suppliers || [];
    }

    async saveTaskSuppliers(taskId, suppliers) {
        return await this.request(`/tasks/${taskId}/suppliers`, {
            method: 'PUT',
            body: JSON.stringify({ suppliers })
        });
    }

    // ==================== Task Remarks ====================

    async setupTaskRemarksTable() {
        return await this.request('/setup/task-remarks', { method: 'POST' });
    }

    async getTaskRemarks(taskId) {
        const response = await this.request(`/tasks/${taskId}/remarks`);
        return response.remarks || [];
    }

    async addTaskRemark(taskId, remark) {
        return await this.request(`/tasks/${taskId}/remarks`, {
            method: 'POST',
            body: JSON.stringify({ remark })
        });
    }

    async deleteTaskRemark(taskId, remarkId) {
        return await this.request(`/tasks/${taskId}/remarks/${remarkId}`, {
            method: 'DELETE'
        });
    }

    // ==================== Capital Budget ====================

    async setupCapitalBudgetTable() {
        return await this.request('/setup/capital-budget', { method: 'POST' });
    }

    async getCapitalBudgetItems() {
        const response = await this.request('/capital-budget');
        return response.items || [];
    }

    async createCapitalBudgetItem(data) {
        return await this.request('/capital-budget', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateCapitalBudgetItem(id, data) {
        return await this.request(`/capital-budget/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async deleteCapitalBudgetItem(id) {
        return await this.request(`/capital-budget/${id}`, {
            method: 'DELETE'
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
