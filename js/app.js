/**
 * Supplier Document Management System
 * Main Application - VERSION 3
 * 
 * Bureau of Statistics — Procurement Unit
 * 
 * FEATURES:
 * 1. Edit Supplier properly loads existing data with isEditMode flag
 * 2. NIS/GRA Expiration dates with automatic compliance status
 * 3. Multi-category support with checkboxes
 * 4. In-app compliance notification system
 */

// ==================== State ====================
const state = {
    suppliers: [],
    categories: [],
    currentSupplier: null,
    pendingDocuments: {},
    isEditMode: false,
    notificationPanelOpen: false,
    filters: {
        search: '',
        category: 'all',
        showComplete: true,
        showIncomplete: true
    },
    viewMode: 'grid'
};

// ==================== DOM Elements ====================
const elements = {
    // Auth
    authModal: document.getElementById('auth-modal'),
    authForm: document.getElementById('auth-form'),
    authToken: document.getElementById('auth-token'),
    
    // App
    app: document.getElementById('app'),
    
    // Buttons
    addSupplierBtn: document.getElementById('add-supplier-btn'),
    addCategoryBtn: document.getElementById('add-category-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // Notifications
    notificationBtn: document.getElementById('notification-btn'),
    notificationBadge: document.getElementById('notification-badge'),
    notificationPanel: document.getElementById('notification-panel'),
    notificationSummary: document.getElementById('notification-summary'),
    notificationList: document.getElementById('notification-list'),
    needsAttention: document.getElementById('needs-attention'),
    needsAttentionCard: document.getElementById('needs-attention-card'),
    
    // Search & Filters
    searchInput: document.getElementById('search-input'),
    categoryFilters: document.getElementById('category-filters'),
    filterComplete: document.getElementById('filter-complete'),
    filterIncomplete: document.getElementById('filter-incomplete'),
    
    // View Toggle
    viewGrid: document.getElementById('view-grid'),
    viewList: document.getElementById('view-list'),
    
    // Supplier List
    supplierList: document.getElementById('supplier-list'),
    emptyState: document.getElementById('empty-state'),
    loadingState: document.getElementById('loading-state'),
    
    // Stats
    totalSuppliers: document.getElementById('total-suppliers'),
    compliantSuppliers: document.getElementById('compliant-suppliers'),
    
    // Supplier Modal
    supplierModal: document.getElementById('supplier-modal'),
    supplierModalTitle: document.getElementById('supplier-modal-title'),
    supplierForm: document.getElementById('supplier-form'),
    supplierId: document.getElementById('supplier-id'),
    supplierName: document.getElementById('supplier-name'),
    supplierAddress: document.getElementById('supplier-address'),
    supplierTelephone: document.getElementById('supplier-telephone'),
    supplierCategory: document.getElementById('supplier-category'),
    supplierCategoryCheckboxes: document.getElementById('supplier-category-checkboxes'),
    supplierEmail: document.getElementById('supplier-email'),
    supplierContact: document.getElementById('supplier-contact'),
    nisExpirationDate: document.getElementById('nis-expiration-date'),
    graExpirationDate: document.getElementById('gra-expiration-date'),
    supplierSubmitBtn: document.getElementById('supplier-submit-btn'),
    documentsSection: document.getElementById('documents-section'),
    
    // Detail Modal
    detailModal: document.getElementById('supplier-detail-modal'),
    detailName: document.getElementById('detail-supplier-name'),
    detailAddress: document.getElementById('detail-address'),
    detailTelephone: document.getElementById('detail-telephone'),
    detailEmail: document.getElementById('detail-email'),
    detailContact: document.getElementById('detail-contact'),
    detailCategory: document.getElementById('detail-category'),
    detailCreated: document.getElementById('detail-created'),
    detailDocuments: document.getElementById('detail-documents'),
    detailCompliance: document.getElementById('detail-compliance'),
    editSupplierBtn: document.getElementById('edit-supplier-btn'),
    deleteSupplierBtn: document.getElementById('delete-supplier-btn'),
    
    // Category Modal
    categoryModal: document.getElementById('category-modal'),
    categoryForm: document.getElementById('category-form'),
    newCategoryName: document.getElementById('new-category-name'),
    categoryList: document.getElementById('category-list'),
    
    // Toast
    toast: document.getElementById('toast')
};

// ==================== Initialization ====================

document.addEventListener('DOMContentLoaded', init);

async function init() {
    if (API.isAuthenticated()) {
        showApp();
        await loadInitialData();
    } else {
        showAuth();
    }
    
    setupEventListeners();
}

function setupEventListeners() {
    // Authentication
    elements.authForm.addEventListener('submit', handleAuth);
    elements.logoutBtn.addEventListener('click', handleLogout);
    
    // Navigation
    elements.addSupplierBtn.addEventListener('click', () => openSupplierModal(null));
    elements.addCategoryBtn.addEventListener('click', openCategoryModal);
    
    // Notifications
    if (elements.notificationBtn) {
        elements.notificationBtn.addEventListener('click', toggleNotificationPanel);
    }
    if (elements.needsAttentionCard) {
        elements.needsAttentionCard.addEventListener('click', openNotificationPanel);
    }
    
    // Search & Filters
    elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
    elements.filterComplete.addEventListener('change', handleFilterChange);
    elements.filterIncomplete.addEventListener('change', handleFilterChange);
    
    // View Toggle
    elements.viewGrid.addEventListener('click', () => setViewMode('grid'));
    elements.viewList.addEventListener('click', () => setViewMode('list'));
    
    // Supplier Form
    elements.supplierForm.addEventListener('submit', handleSupplierSubmit);
    
    // Detail Modal Actions
    elements.editSupplierBtn.addEventListener('click', handleEditSupplier);
    elements.deleteSupplierBtn.addEventListener('click', handleDeleteSupplier);
    
    // Category Form
    elements.categoryForm.addEventListener('submit', handleCategorySubmit);
    
    // Document file inputs
    CONFIG.DOCUMENT_TYPES.forEach(docType => {
        const fileInput = document.getElementById(`file-${docType.id}`);
        if (fileInput) {
            fileInput.addEventListener('change', (e) => handleFileSelect(e, docType.id));
        }
    });
    
    // Close modals and panels on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSupplierModal();
            closeDetailModal();
            closeCategoryModal();
            closeNotificationPanel();
        }
    });
    
    // Close notification panel when clicking outside
    document.addEventListener('click', (e) => {
        if (state.notificationPanelOpen && 
            elements.notificationPanel && 
            !elements.notificationPanel.contains(e.target) &&
            !elements.notificationBtn.contains(e.target) &&
            !elements.needsAttentionCard?.contains(e.target)) {
            closeNotificationPanel();
        }
    });
    
    // Modal backdrop clicks
    [elements.supplierModal, elements.detailModal, elements.categoryModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeSupplierModal();
                    closeDetailModal();
                    closeCategoryModal();
                }
            });
        }
    });
}

// ==================== Authentication ====================

function showAuth() {
    elements.authModal.classList.remove('hidden');
    elements.app.classList.add('hidden');
}

function showApp() {
    elements.authModal.classList.add('hidden');
    elements.app.classList.remove('hidden');
}

async function handleAuth(e) {
    e.preventDefault();
    
    const token = elements.authToken.value.trim();
    
    if (!token) {
        showToast('Please enter an access token', 'error');
        return;
    }
    
    try {
        const response = await api.authenticate(token);
        
        if (response.success) {
            showApp();
            await loadInitialData();
            showToast('Authentication successful');
        } else {
            showToast('Invalid access token', 'error');
        }
    } catch (error) {
        showToast(error.message || 'Authentication failed', 'error');
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        api.logout();
        showAuth();
        elements.authToken.value = '';
    }
}

// ==================== Data Loading ====================

async function loadInitialData() {
    showLoading(true);
    
    try {
        await loadCategories();
        
        if (state.categories.length === 0) {
            await api.seedCategories();
            await loadCategories();
        }
        
        await loadSuppliers();
        updateStatistics();
        updateNotifications();
    } catch (error) {
        console.error('Failed to load initial data:', error);
        showToast('Failed to load data. Please refresh the page.', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadCategories() {
    try {
        state.categories = await api.getCategories();
        renderCategoryFilters();
        populateCategoryCheckboxes();
        renderCategoryManageList();
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

async function loadSuppliers() {
    try {
        state.suppliers = await api.getSuppliers();
        renderSuppliers();
        updateNotifications();
    } catch (error) {
        console.error('Failed to load suppliers:', error);
    }
}

// ==================== Notifications ====================

function toggleNotificationPanel() {
    if (state.notificationPanelOpen) {
        closeNotificationPanel();
    } else {
        openNotificationPanel();
    }
}

function openNotificationPanel() {
    state.notificationPanelOpen = true;
    elements.notificationPanel?.classList.remove('hidden');
    renderNotificationPanel();
}

function closeNotificationPanel() {
    state.notificationPanelOpen = false;
    elements.notificationPanel?.classList.add('hidden');
}

function updateNotifications() {
    // Get suppliers needing attention
    const alertSuppliers = state.suppliers.filter(s => s.alert_level !== null);
    const alertCount = alertSuppliers.length;
    
    // Update badge
    if (elements.notificationBadge) {
        elements.notificationBadge.textContent = alertCount;
        elements.notificationBadge.classList.toggle('hidden', alertCount === 0);
    }
    
    // Update sidebar stat
    if (elements.needsAttention) {
        elements.needsAttention.textContent = alertCount;
    }
    
    // Update card styling based on alerts
    if (elements.needsAttentionCard) {
        elements.needsAttentionCard.classList.toggle('no-alerts', alertCount === 0);
    }
    
    // If panel is open, refresh it
    if (state.notificationPanelOpen) {
        renderNotificationPanel();
    }
}

function renderNotificationPanel() {
    if (!elements.notificationList || !elements.notificationSummary) return;
    
    // Get suppliers with alerts, sorted by severity
    const alertSuppliers = state.suppliers
        .filter(s => s.alert_level !== null)
        .sort((a, b) => {
            const priority = { 'critical': 1, 'warning': 2, 'action_needed': 3 };
            return (priority[a.alert_level] || 99) - (priority[b.alert_level] || 99);
        });
    
    // Count by severity
    const counts = {
        critical: alertSuppliers.filter(s => s.alert_level === 'critical').length,
        warning: alertSuppliers.filter(s => s.alert_level === 'warning').length,
        action_needed: alertSuppliers.filter(s => s.alert_level === 'action_needed').length
    };
    
    // Render summary badges
    elements.notificationSummary.innerHTML = `
        ${counts.critical > 0 ? `<span class="summary-badge critical">${counts.critical} Expired</span>` : ''}
        ${counts.warning > 0 ? `<span class="summary-badge warning">${counts.warning} Expiring Soon</span>` : ''}
        ${counts.action_needed > 0 ? `<span class="summary-badge action-needed">${counts.action_needed} Incomplete</span>` : ''}
    `;
    
    // Render notification list
    if (alertSuppliers.length === 0) {
        elements.notificationList.innerHTML = `
            <div class="notification-empty">
                <svg viewBox="0 0 24 24">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" stroke-width="2" fill="none"/>
                    <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
                <h4>All Clear!</h4>
                <p>No suppliers require attention at this time.</p>
            </div>
        `;
        return;
    }
    
    elements.notificationList.innerHTML = alertSuppliers.map(supplier => {
        const iconSvg = getAlertIcon(supplier.alert_level);
        const messages = (supplier.alert_details || []).map(alert => 
            `<span class="notification-message-item">• ${alert.message}</span>`
        ).join('');
        
        return `
            <div class="notification-item" onclick="openSupplierFromNotification(${supplier.id})">
                <div class="notification-icon ${supplier.alert_level}">
                    ${iconSvg}
                </div>
                <div class="notification-content">
                    <div class="notification-supplier">${escapeHtml(supplier.name)}</div>
                    <div class="notification-message">${messages}</div>
                </div>
            </div>
        `;
    }).join('');
}

function getAlertIcon(alertLevel) {
    switch (alertLevel) {
        case 'critical':
            return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/><line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/></svg>`;
        case 'warning':
            return `<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" stroke-width="2" fill="none"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2"/></svg>`;
        case 'action_needed':
            return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2"/></svg>`;
        default:
            return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/></svg>`;
    }
}

function openSupplierFromNotification(supplierId) {
    closeNotificationPanel();
    const supplier = state.suppliers.find(s => s.id === supplierId);
    if (supplier) {
        openDetailModal(supplier);
    }
}

// ==================== Rendering ====================

function renderSuppliers() {
    const filtered = getFilteredSuppliers();
    
    elements.supplierList.innerHTML = '';
    
    if (filtered.length === 0) {
        elements.emptyState.classList.remove('hidden');
        elements.supplierList.classList.add('hidden');
    } else {
        elements.emptyState.classList.add('hidden');
        elements.supplierList.classList.remove('hidden');
        
        filtered.forEach(supplier => {
            elements.supplierList.appendChild(createSupplierCard(supplier));
        });
    }
    
    updateStatistics();
}

function createSupplierCard(supplier) {
    const card = document.createElement('div');
    card.className = 'supplier-card';
    card.dataset.id = supplier.id;
    card.onclick = () => openDetailModal(supplier);
    
    const docsCount = countDocuments(supplier.documents);
    const isDocComplete = docsCount === CONFIG.DOCUMENT_TYPES.length;
    
    // Check compliance expiration
    const complianceStatus = getComplianceStatus(supplier);
    const isFullyCompliant = isDocComplete && complianceStatus.allCompliant;
    
    // Get category names
    const categoryNames = (supplier.categories || []).map(c => c.name).join(', ') || 'Uncategorized';
    
    // Determine if needs attention
    const alertClass = supplier.alert_level ? `has-alert alert-${supplier.alert_level}` : '';
    
    card.innerHTML = `
        <div class="supplier-card-header">
            <span class="supplier-name">${escapeHtml(supplier.name)}</span>
            <span class="compliance-badge ${isFullyCompliant ? 'complete' : 'incomplete'}">
                ${isFullyCompliant ? `
                    <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" stroke-width="2" fill="none"/><polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" stroke-width="2" fill="none"/></svg>
                    Compliant
                ` : `
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2"/></svg>
                    ${complianceStatus.message || `${docsCount}/${CONFIG.DOCUMENT_TYPES.length}`}
                `}
            </span>
        </div>
        <span class="supplier-category">
            <svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" stroke="currentColor" stroke-width="2" fill="none"/></svg>
            ${escapeHtml(categoryNames)}
        </span>
        <div class="supplier-meta">
            <div class="supplier-meta-item">
                <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2" fill="none"/></svg>
                <span>${escapeHtml(supplier.address.split('\n')[0])}</span>
            </div>
            <div class="supplier-meta-item">
                <svg viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" stroke-width="2" fill="none"/></svg>
                <span>${escapeHtml(supplier.telephone)}</span>
            </div>
        </div>
        ${!complianceStatus.allCompliant ? `
            <div class="compliance-warnings">
                ${complianceStatus.nisExpired ? '<span class="warning-badge">NIS Expired</span>' : ''}
                ${complianceStatus.graExpired ? '<span class="warning-badge">GRA Expired</span>' : ''}
            </div>
        ` : ''}
        <div class="supplier-documents">
            ${CONFIG.DOCUMENT_TYPES.map(docType => `
                <div class="doc-indicator ${hasDocument(supplier.documents, docType.id) ? 'uploaded' : ''}" title="${docType.name}"></div>
            `).join('')}
        </div>
    `;
    
    return card;
}

function getComplianceStatus(supplier) {
    const today = new Date().toISOString().split('T')[0];
    
    const nisExpired = supplier.nis_expiration_date && supplier.nis_expiration_date < today;
    const graExpired = supplier.gra_expiration_date && supplier.gra_expiration_date < today;
    
    const allCompliant = !nisExpired && !graExpired;
    
    let message = '';
    if (nisExpired && graExpired) {
        message = 'NIS & GRA Expired';
    } else if (nisExpired) {
        message = 'NIS Expired';
    } else if (graExpired) {
        message = 'GRA Expired';
    }
    
    return {
        nisExpired,
        graExpired,
        allCompliant,
        message
    };
}

function renderCategoryFilters() {
    const allOption = elements.categoryFilters.querySelector('.category-item');
    elements.categoryFilters.innerHTML = '';
    if (allOption) elements.categoryFilters.appendChild(allOption);
    
    state.categories.forEach(category => {
        const supplierCount = state.suppliers.filter(s => 
            (s.category_ids || []).includes(category.id) || s.category_id === category.id
        ).length;
        
        const item = document.createElement('label');
        item.className = 'category-item';
        item.innerHTML = `
            <input type="radio" name="category-filter" value="${category.id}">
            <span class="category-radio"></span>
            <span class="category-name">${escapeHtml(category.name)}</span>
            <span class="category-count">${supplierCount}</span>
        `;
        
        item.querySelector('input').addEventListener('change', () => {
            handleCategoryFilter(category.id.toString());
        });
        
        elements.categoryFilters.appendChild(item);
    });
    
    const countAll = document.getElementById('count-all');
    if (countAll) countAll.textContent = state.suppliers.length;
    
    const allInput = elements.categoryFilters.querySelector('input[value="all"]');
    if (allInput) {
        allInput.addEventListener('change', () => handleCategoryFilter('all'));
    }
}

function populateCategoryCheckboxes() {
    const container = elements.supplierCategoryCheckboxes;
    if (!container) return;
    
    container.innerHTML = '';
    
    state.categories.forEach(category => {
        const item = document.createElement('label');
        item.className = 'category-checkbox-item';
        item.innerHTML = `
            <input type="checkbox" name="supplier-categories" value="${category.id}">
            <span>${escapeHtml(category.name)}</span>
        `;
        container.appendChild(item);
    });
}

function getSelectedCategoryIds() {
    const checkboxes = document.querySelectorAll('input[name="supplier-categories"]:checked');
    return Array.from(checkboxes).map(cb => parseInt(cb.value));
}

function setSelectedCategoryIds(categoryIds) {
    const checkboxes = document.querySelectorAll('input[name="supplier-categories"]');
    checkboxes.forEach(cb => {
        cb.checked = categoryIds.includes(parseInt(cb.value));
    });
}

function renderCategoryManageList() {
    elements.categoryList.innerHTML = '';
    
    if (state.categories.length === 0) {
        elements.categoryList.innerHTML = '<p style="color: var(--color-text-muted); text-align: center;">No categories yet</p>';
        return;
    }
    
    state.categories.forEach(category => {
        const supplierCount = state.suppliers.filter(s => 
            (s.category_ids || []).includes(category.id) || s.category_id === category.id
        ).length;
        
        const item = document.createElement('div');
        item.className = 'category-manage-item';
        item.innerHTML = `
            <span>
                <span class="category-manage-name">${escapeHtml(category.name)}</span>
                <span class="category-manage-count">(${supplierCount} supplier${supplierCount !== 1 ? 's' : ''})</span>
            </span>
            <button class="category-delete-btn" ${supplierCount > 0 ? 'disabled title="Cannot delete category with suppliers"' : `title="Delete category" onclick="deleteCategory(${category.id})"`}>
                <svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" fill="none"/></svg>
            </button>
        `;
        
        elements.categoryList.appendChild(item);
    });
}

function updateStatistics() {
    const total = state.suppliers.length;
    const compliant = state.suppliers.filter(s => {
        const docsCount = countDocuments(s.documents);
        const compStatus = getComplianceStatus(s);
        return docsCount === CONFIG.DOCUMENT_TYPES.length && compStatus.allCompliant;
    }).length;
    
    const needsAttention = state.suppliers.filter(s => s.alert_level !== null).length;
    
    elements.totalSuppliers.textContent = total;
    elements.compliantSuppliers.textContent = compliant;
    
    if (elements.needsAttention) {
        elements.needsAttention.textContent = needsAttention;
    }
}

// ==================== Filtering ====================

function getFilteredSuppliers() {
    return state.suppliers.filter(supplier => {
        if (state.filters.search) {
            const searchLower = state.filters.search.toLowerCase();
            const nameMatch = supplier.name.toLowerCase().includes(searchLower);
            const addressMatch = supplier.address.toLowerCase().includes(searchLower);
            const telephoneMatch = supplier.telephone.includes(state.filters.search);
            
            if (!nameMatch && !addressMatch && !telephoneMatch) {
                return false;
            }
        }
        
        if (state.filters.category !== 'all') {
            const catId = parseInt(state.filters.category);
            const hasCategory = (supplier.category_ids || []).includes(catId) || 
                               supplier.category_id === catId;
            if (!hasCategory) {
                return false;
            }
        }
        
        const docsCount = countDocuments(supplier.documents);
        const compStatus = getComplianceStatus(supplier);
        const isComplete = docsCount === CONFIG.DOCUMENT_TYPES.length && compStatus.allCompliant;
        
        if (!state.filters.showComplete && isComplete) return false;
        if (!state.filters.showIncomplete && !isComplete) return false;
        
        return true;
    });
}

function handleSearch(e) {
    state.filters.search = e.target.value.trim();
    renderSuppliers();
}

function handleCategoryFilter(category) {
    state.filters.category = category;
    
    document.querySelectorAll('.category-item').forEach(item => {
        const input = item.querySelector('input');
        item.classList.toggle('active', input.value === category || (input.value === 'all' && category === 'all'));
    });
    
    renderSuppliers();
}

function handleFilterChange() {
    state.filters.showComplete = elements.filterComplete.checked;
    state.filters.showIncomplete = elements.filterIncomplete.checked;
    renderSuppliers();
}

function setViewMode(mode) {
    state.viewMode = mode;
    
    elements.viewGrid.classList.toggle('active', mode === 'grid');
    elements.viewList.classList.toggle('active', mode === 'list');
    
    elements.supplierList.classList.toggle('grid-view', mode === 'grid');
    elements.supplierList.classList.toggle('list-view', mode === 'list');
}

// ==================== Supplier Modal ====================

function openSupplierModal(supplier = null) {
    state.isEditMode = supplier !== null;
    state.currentSupplier = supplier;
    state.pendingDocuments = {};
    
    elements.supplierForm.reset();
    elements.supplierId.value = '';
    
    if (elements.nisExpirationDate) elements.nisExpirationDate.value = '';
    if (elements.graExpirationDate) elements.graExpirationDate.value = '';
    
    document.querySelectorAll('input[name="supplier-categories"]').forEach(cb => {
        cb.checked = false;
    });
    
    CONFIG.DOCUMENT_TYPES.forEach(docType => {
        const statusEl = document.getElementById(`status-${docType.id}`);
        const fileInput = document.getElementById(`file-${docType.id}`);
        const existingBtns = document.getElementById(`doc-btns-${docType.id}`);
        
        if (statusEl) {
            statusEl.textContent = 'Not uploaded';
            statusEl.classList.remove('uploaded');
        }
        if (fileInput) {
            fileInput.value = '';
        }
        if (existingBtns) {
            existingBtns.remove();
        }
    });
    
    if (state.isEditMode && supplier) {
        elements.supplierModalTitle.textContent = 'Edit Supplier';
        elements.supplierId.value = supplier.id;
        
        elements.supplierName.value = supplier.name || '';
        elements.supplierAddress.value = supplier.address || '';
        elements.supplierTelephone.value = supplier.telephone || '';
        elements.supplierEmail.value = supplier.email || '';
        elements.supplierContact.value = supplier.contact_person || '';
        
        if (elements.nisExpirationDate && supplier.nis_expiration_date) {
            elements.nisExpirationDate.value = supplier.nis_expiration_date;
        }
        if (elements.graExpirationDate && supplier.gra_expiration_date) {
            elements.graExpirationDate.value = supplier.gra_expiration_date;
        }
        
        const categoryIds = supplier.category_ids || (supplier.category_id ? [supplier.category_id] : []);
        setSelectedCategoryIds(categoryIds);
        
        if (supplier.documents && supplier.documents.length > 0) {
            CONFIG.DOCUMENT_TYPES.forEach(docType => {
                const doc = supplier.documents.find(d => d.document_type === docType.id);
                if (doc) {
                    const statusEl = document.getElementById(`status-${docType.id}`);
                    
                    if (statusEl) {
                        statusEl.textContent = doc.file_name || 'Uploaded';
                        statusEl.classList.add('uploaded');
                    }
                    
                    const btnContainer = document.createElement('div');
                    btnContainer.id = `doc-btns-${docType.id}`;
                    btnContainer.className = 'doc-existing-btns';
                    btnContainer.innerHTML = `
                        <button type="button" class="btn btn-ghost btn-sm" onclick="viewDocument(${supplier.id}, '${docType.id}')" title="View">
                            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                        </button>
                        <button type="button" class="btn btn-ghost btn-sm" onclick="downloadDocument(${supplier.id}, '${docType.id}', '${escapeHtml(doc.file_name || docType.id + '.pdf')}')" title="Download">
                            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                        </button>
                    `;
                    
                    const uploadItem = document.getElementById(`file-${docType.id}`)?.closest('.document-upload-item');
                    if (uploadItem) {
                        const docActionsDiv = uploadItem.querySelector('.doc-actions');
                        if (docActionsDiv) {
                            docActionsDiv.appendChild(btnContainer);
                        }
                    }
                }
            });
        }
    } else {
        elements.supplierModalTitle.textContent = 'Add New Supplier';
        state.isEditMode = false;
    }
    
    elements.supplierModal.classList.remove('hidden');
    elements.supplierName.focus();
}

function closeSupplierModal() {
    elements.supplierModal.classList.add('hidden');
    state.currentSupplier = null;
    state.isEditMode = false;
    state.pendingDocuments = {};
}

async function handleSupplierSubmit(e) {
    e.preventDefault();
    
    const submitBtn = elements.supplierSubmitBtn;
    const spinner = submitBtn.querySelector('.btn-spinner');
    const btnText = submitBtn.querySelector('span');
    
    submitBtn.disabled = true;
    spinner.classList.remove('hidden');
    btnText.textContent = 'Saving...';
    
    try {
        const categoryIds = getSelectedCategoryIds();
        
        if (categoryIds.length === 0) {
            showToast('Please select at least one category', 'error');
            return;
        }
        
        const supplierData = {
            name: elements.supplierName.value.trim(),
            address: elements.supplierAddress.value.trim(),
            telephone: elements.supplierTelephone.value.trim(),
            category_ids: categoryIds,
            email: elements.supplierEmail.value.trim() || null,
            contact_person: elements.supplierContact.value.trim() || null,
            nis_expiration_date: elements.nisExpirationDate?.value || null,
            gra_expiration_date: elements.graExpirationDate?.value || null
        };
        
        let supplierId;
        
        if (state.isEditMode && elements.supplierId.value) {
            supplierId = parseInt(elements.supplierId.value);
            await api.updateSupplier(supplierId, supplierData);
            showToast('Supplier updated successfully');
        } else {
            const response = await api.createSupplier(supplierData);
            supplierId = response.supplier.id;
            showToast('Supplier created successfully');
        }
        
        for (const [docType, file] of Object.entries(state.pendingDocuments)) {
            await api.uploadDocument(supplierId, docType, file);
        }
        
        await loadSuppliers();
        await loadCategories();
        
        closeSupplierModal();
        
    } catch (error) {
        showToast(error.message || 'Failed to save supplier', 'error');
    } finally {
        submitBtn.disabled = false;
        spinner.classList.add('hidden');
        btnText.textContent = 'Save Supplier';
    }
}

function handleFileSelect(e, docType) {
    const file = e.target.files[0];
    
    if (!file) return;
    
    if (!CONFIG.UPLOAD.ALLOWED_TYPES.includes(file.type)) {
        showToast('Only PDF files are allowed', 'error');
        e.target.value = '';
        return;
    }
    
    const maxSizeBytes = CONFIG.UPLOAD.MAX_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        showToast(`File size must be less than ${CONFIG.UPLOAD.MAX_SIZE_MB}MB`, 'error');
        e.target.value = '';
        return;
    }
    
    state.pendingDocuments[docType] = file;
    
    const statusEl = document.getElementById(`status-${docType}`);
    if (statusEl) {
        statusEl.textContent = file.name;
        statusEl.classList.add('uploaded');
    }
}

// ==================== Detail Modal ====================

async function openDetailModal(supplier) {
    state.currentSupplier = supplier;
    
    elements.detailName.textContent = supplier.name;
    elements.detailAddress.textContent = supplier.address;
    elements.detailTelephone.textContent = supplier.telephone;
    elements.detailEmail.textContent = supplier.email || '-';
    elements.detailContact.textContent = supplier.contact_person || '-';
    
    const categoryNames = (supplier.categories || []).map(c => c.name).join(', ') || 'Uncategorized';
    elements.detailCategory.textContent = categoryNames;
    
    elements.detailCreated.textContent = formatDate(supplier.created_at);
    
    // Show compliance status with expiration dates
    const complianceContainer = elements.detailCompliance;
    if (complianceContainer) {
        const compStatus = getComplianceStatus(supplier);
        
        const nisStatusClass = supplier.nis_expiration_date 
            ? (compStatus.nisExpired ? 'expired' : 'valid') 
            : 'not-set';
        const graStatusClass = supplier.gra_expiration_date 
            ? (compStatus.graExpired ? 'expired' : 'valid') 
            : 'not-set';
        
        complianceContainer.innerHTML = `
            <div class="compliance-status-item ${nisStatusClass}">
                <div class="compliance-header">
                    <span class="compliance-label">NIS Compliance</span>
                    <span class="compliance-badge ${nisStatusClass}">
                        ${!supplier.nis_expiration_date ? 'Not Set' : (compStatus.nisExpired ? 'EXPIRED' : 'Valid')}
                    </span>
                </div>
                <div class="compliance-details">
                    ${supplier.nis_expiration_date 
                        ? `<span class="compliance-expiry">Expires: ${formatDate(supplier.nis_expiration_date)}${supplier.nis_days_remaining !== null ? ` (${supplier.nis_days_remaining < 0 ? Math.abs(supplier.nis_days_remaining) + ' days ago' : supplier.nis_days_remaining + ' days remaining'})` : ''}</span>`
                        : '<span class="compliance-expiry">No expiration date set</span>'
                    }
                </div>
            </div>
            <div class="compliance-status-item ${graStatusClass}">
                <div class="compliance-header">
                    <span class="compliance-label">GRA Compliance</span>
                    <span class="compliance-badge ${graStatusClass}">
                        ${!supplier.gra_expiration_date ? 'Not Set' : (compStatus.graExpired ? 'EXPIRED' : 'Valid')}
                    </span>
                </div>
                <div class="compliance-details">
                    ${supplier.gra_expiration_date 
                        ? `<span class="compliance-expiry">Expires: ${formatDate(supplier.gra_expiration_date)}${supplier.gra_days_remaining !== null ? ` (${supplier.gra_days_remaining < 0 ? Math.abs(supplier.gra_days_remaining) + ' days ago' : supplier.gra_days_remaining + ' days remaining'})` : ''}</span>`
                        : '<span class="compliance-expiry">No expiration date set</span>'
                    }
                </div>
            </div>
        `;
    }
    
    // Populate documents
    elements.detailDocuments.innerHTML = '';
    
    CONFIG.DOCUMENT_TYPES.forEach(docType => {
        const doc = supplier.documents ? supplier.documents.find(d => d.document_type === docType.id) : null;
        const isUploaded = !!doc;
        
        const card = document.createElement('div');
        card.className = `document-card ${isUploaded ? 'uploaded' : 'missing'}`;
        
        if (isUploaded) {
            card.innerHTML = `
                <svg viewBox="0 0 24 24" class="doc-icon">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="none" stroke="currentColor" stroke-width="2"/>
                    <polyline points="14,2 14,8 20,8" fill="none" stroke="currentColor" stroke-width="2"/>
                    <polyline points="9,15 12,18 17,13" fill="none" stroke="currentColor" stroke-width="2"/>
                </svg>
                <div class="doc-details">
                    <span class="doc-label">${docType.name}</span>
                    <span class="doc-filename">${doc.file_name || 'Document uploaded'}</span>
                    <div class="doc-actions-row">
                        <button type="button" class="btn btn-sm btn-outline" onclick="viewDocument(${supplier.id}, '${docType.id}')">
                            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                            View
                        </button>
                        <button type="button" class="btn btn-sm btn-ghost" onclick="downloadDocument(${supplier.id}, '${docType.id}', '${escapeHtml(doc.file_name || docType.id + '.pdf')}')">
                            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                            Download
                        </button>
                    </div>
                </div>
            `;
        } else {
            card.innerHTML = `
                <svg viewBox="0 0 24 24" class="doc-icon">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="none" stroke="currentColor" stroke-width="2"/>
                    <polyline points="14,2 14,8 20,8" fill="none" stroke="currentColor" stroke-width="2"/>
                </svg>
                <div class="doc-details">
                    <span class="doc-label">${docType.name}</span>
                    <span class="doc-status missing">Not uploaded</span>
                </div>
            `;
        }
        
        elements.detailDocuments.appendChild(card);
    });
    
    elements.detailModal.classList.remove('hidden');
}

function closeDetailModal() {
    elements.detailModal.classList.add('hidden');
    state.currentSupplier = null;
}

function handleEditSupplier() {
    if (state.currentSupplier) {
        const supplierToEdit = { ...state.currentSupplier };
        closeDetailModal();
        openSupplierModal(supplierToEdit);
    }
}

async function handleDeleteSupplier() {
    if (!state.currentSupplier) return;
    
    const confirmed = confirm(`Are you sure you want to delete "${state.currentSupplier.name}"?\n\nThis action cannot be undone and will also delete all associated documents.`);
    
    if (!confirmed) return;
    
    try {
        await api.deleteSupplier(state.currentSupplier.id);
        closeDetailModal();
        await loadSuppliers();
        await loadCategories();
        showToast('Supplier deleted successfully');
    } catch (error) {
        showToast(error.message || 'Failed to delete supplier', 'error');
    }
}

function viewDocument(supplierId, docType) {
    const url = api.getDocumentDirectUrl(supplierId, docType);
    window.open(url, '_blank');
}

function downloadDocument(supplierId, docType, fileName) {
    const url = api.getDocumentDirectUrl(supplierId, docType);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || `${docType}.pdf`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ==================== Category Modal ====================

function openCategoryModal() {
    renderCategoryManageList();
    elements.categoryModal.classList.remove('hidden');
    elements.newCategoryName.focus();
}

function closeCategoryModal() {
    elements.categoryModal.classList.add('hidden');
    elements.newCategoryName.value = '';
}

async function handleCategorySubmit(e) {
    e.preventDefault();
    
    const name = elements.newCategoryName.value.trim();
    
    if (!name) {
        showToast('Please enter a category name', 'error');
        return;
    }
    
    if (state.categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        showToast('Category already exists', 'error');
        return;
    }
    
    try {
        await api.createCategory(name);
        await loadCategories();
        elements.newCategoryName.value = '';
        showToast('Category created successfully');
    } catch (error) {
        showToast(error.message || 'Failed to create category', 'error');
    }
}

async function deleteCategory(id) {
    const category = state.categories.find(c => c.id === id);
    
    if (!category) return;
    
    const confirmed = confirm(`Are you sure you want to delete the category "${category.name}"?`);
    
    if (!confirmed) return;
    
    try {
        await api.deleteCategory(id);
        await loadCategories();
        showToast('Category deleted successfully');
    } catch (error) {
        showToast(error.message || 'Failed to delete category', 'error');
    }
}

// ==================== Utility Functions ====================

function showLoading(show) {
    elements.loadingState.classList.toggle('hidden', !show);
    elements.supplierList.classList.toggle('hidden', show);
}

function showToast(message, type = 'success') {
    const toast = elements.toast;
    const messageEl = toast.querySelector('.toast-message');
    const successIcon = toast.querySelector('.toast-success');
    const errorIcon = toast.querySelector('.toast-error');
    
    messageEl.textContent = message;
    
    toast.classList.toggle('error', type === 'error');
    successIcon.classList.toggle('hidden', type !== 'success');
    errorIcon.classList.toggle('hidden', type !== 'error');
    
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}

function countDocuments(documents) {
    if (!documents || !Array.isArray(documents)) return 0;
    return documents.length;
}

function hasDocument(documents, docType) {
    if (!documents || !Array.isArray(documents)) return false;
    return documents.some(d => d.document_type === docType);
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
// Make API available globally (both cases for compatibility)
window.API = API;
window.api = API;  // Add this line for lowercase compatibility
