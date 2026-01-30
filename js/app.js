/**
 * Supplier Document Management System
 * Main Application - VERSION 4
 * 
 * Bureau of Statistics — Procurement Unit
 * 
 * FEATURES:
 * 1. Fixed category counters (render after suppliers load)
 * 2. Multi-category support
 * 3. Compliance notifications
 * 4. CONTRACT MANAGEMENT MODULE
 */

// ==================== State ====================
const state = {
    suppliers: [],
    categories: [],
    contracts: [],
    currentSupplier: null,
    currentContract: null,
    pendingDocuments: {},
    pendingContractFiles: [],
    isEditMode: false,
    isContractEditMode: false,
    notificationPanelOpen: false,
    currentView: 'suppliers', // 'suppliers' or 'contracts'
    filters: {
        search: '',
        category: 'all',
        showComplete: true,
        showIncomplete: true,
        sort: 'name-asc'
    },
    contractFilters: {
        search: '',
        supplier_id: '',
        sort: 'date-desc'
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
    
    // Navigation
    navSuppliers: document.getElementById('nav-suppliers'),
    navContracts: document.getElementById('nav-contracts'),
    suppliersView: document.getElementById('suppliers-view'),
    contractsView: document.getElementById('contracts-view'),
    
    // Buttons
    addSupplierBtn: document.getElementById('add-supplier-btn'),
    addCategoryBtn: document.getElementById('add-category-btn'),
    addContractBtn: document.getElementById('add-contract-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // Notifications
    notificationBtn: document.getElementById('notification-btn'),
    notificationBadge: document.getElementById('notification-badge'),
    notificationPanel: document.getElementById('notification-panel'),
    notificationSummary: document.getElementById('notification-summary'),
    notificationList: document.getElementById('notification-list'),
    needsAttention: document.getElementById('needs-attention'),
    needsAttentionCard: document.getElementById('needs-attention-card'),
    
    // Supplier Search & Filters
    searchInput: document.getElementById('search-input'),
    categoryFilters: document.getElementById('category-filters'),
    filterComplete: document.getElementById('filter-complete'),
    filterIncomplete: document.getElementById('filter-incomplete'),
    
    // View Toggle
    viewGrid: document.getElementById('view-grid'),
    viewList: document.getElementById('view-list'),
    
    // Sort Controls
    supplierSort: document.getElementById('supplier-sort'),
    contractSort: document.getElementById('contract-sort'),
    
    // Supplier List
    supplierList: document.getElementById('supplier-list'),
    emptyState: document.getElementById('empty-state'),
    loadingState: document.getElementById('loading-state'),
    
    // Supplier Stats
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
    supplierCategoryCheckboxes: document.getElementById('supplier-category-checkboxes'),
    supplierEmail: document.getElementById('supplier-email'),
    supplierContact: document.getElementById('supplier-contact'),
    nisExpirationDate: document.getElementById('nis-expiration-date'),
    graExpirationDate: document.getElementById('gra-expiration-date'),
    supplierSubmitBtn: document.getElementById('supplier-submit-btn'),
    
    // Supplier Detail Modal
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
    
    // Contract elements
    contractSearchInput: document.getElementById('contract-search-input'),
    contractSupplierFilter: document.getElementById('contract-supplier-filter'),
    contractsList: document.getElementById('contracts-list'),
    contractsEmptyState: document.getElementById('contracts-empty-state'),
    contractsLoadingState: document.getElementById('contracts-loading-state'),
    totalContracts: document.getElementById('total-contracts'),
    totalContractValue: document.getElementById('total-contract-value'),
    
    // Contract Modal
    contractModal: document.getElementById('contract-modal'),
    contractModalTitle: document.getElementById('contract-modal-title'),
    contractForm: document.getElementById('contract-form'),
    contractId: document.getElementById('contract-id'),
    contractNumber: document.getElementById('contract-number'),
    contractSupplier: document.getElementById('contract-supplier'),
    contractDescription: document.getElementById('contract-description'),
    contractAmount: document.getElementById('contract-amount'),
    contractStartDate: document.getElementById('contract-start-date'),
    contractEndDate: document.getElementById('contract-end-date'),
    contractFileInput: document.getElementById('contract-file-input'),
    existingContractFiles: document.getElementById('existing-contract-files'),
    pendingFilesCount: document.getElementById('pending-files-count'),
    contractSubmitBtn: document.getElementById('contract-submit-btn'),
    
    // Contract Detail Modal
    contractDetailModal: document.getElementById('contract-detail-modal'),
    contractDetailTitle: document.getElementById('contract-detail-title'),
    contractDetailNumber: document.getElementById('contract-detail-number'),
    contractDetailSupplier: document.getElementById('contract-detail-supplier'),
    contractDetailDescription: document.getElementById('contract-detail-description'),
    contractDetailAmount: document.getElementById('contract-detail-amount'),
    contractDetailStart: document.getElementById('contract-detail-start'),
    contractDetailEnd: document.getElementById('contract-detail-end'),
    contractDetailCreated: document.getElementById('contract-detail-created'),
    contractDetailFiles: document.getElementById('contract-detail-files'),
    editContractBtn: document.getElementById('edit-contract-btn'),
    deleteContractBtn: document.getElementById('delete-contract-btn'),
    
    // Toast
    toast: document.getElementById('toast')
};

// ==================== Initialization ====================

document.addEventListener('DOMContentLoaded', init);

async function init() {
    if (api.isAuthenticated()) {
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
    elements.addContractBtn?.addEventListener('click', () => openContractModal(null));
    
    // Notifications
    elements.notificationBtn?.addEventListener('click', toggleNotificationPanel);
    elements.needsAttentionCard?.addEventListener('click', openNotificationPanel);
    
    // Supplier Search & Filters
    elements.searchInput.addEventListener('input', debounce(handleSearch, 300));
    elements.filterComplete.addEventListener('change', handleFilterChange);
    elements.filterIncomplete.addEventListener('change', handleFilterChange);
    
    // View Toggle
    elements.viewGrid.addEventListener('click', () => setViewMode('grid'));
    elements.viewList.addEventListener('click', () => setViewMode('list'));
    
    // Sort Controls
    elements.supplierSort?.addEventListener('change', handleSupplierSort);
    elements.contractSort?.addEventListener('change', handleContractSort);
    
    // Supplier Form
    elements.supplierForm.addEventListener('submit', handleSupplierSubmit);
    
    // Supplier Detail Actions
    elements.editSupplierBtn.addEventListener('click', handleEditSupplier);
    elements.deleteSupplierBtn.addEventListener('click', handleDeleteSupplier);
    
    // Category Form
    elements.categoryForm.addEventListener('submit', handleCategorySubmit);
    
    // Contract Search & Filters
    elements.contractSearchInput?.addEventListener('input', debounce(handleContractSearch, 300));
    elements.contractSupplierFilter?.addEventListener('change', handleContractSupplierFilter);
    
    // Contract Form
    elements.contractForm?.addEventListener('submit', handleContractSubmit);
    elements.contractFileInput?.addEventListener('change', handleContractFileSelect);
    
    // Contract Detail Actions
    elements.editContractBtn?.addEventListener('click', handleEditContract);
    elements.deleteContractBtn?.addEventListener('click', handleDeleteContract);
    
    // Document file inputs
    CONFIG.DOCUMENT_TYPES.forEach(docType => {
        const fileInput = document.getElementById(`file-${docType.id}`);
        if (fileInput) {
            fileInput.addEventListener('change', (e) => handleFileSelect(e, docType.id));
        }
    });
    
    // Close on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSupplierModal();
            closeDetailModal();
            closeCategoryModal();
            closeContractModal();
            closeContractDetailModal();
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
}

// ==================== View Navigation ====================

function switchView(view) {
    state.currentView = view;
    
    // Update nav tabs
    elements.navSuppliers.classList.toggle('active', view === 'suppliers');
    elements.navContracts.classList.toggle('active', view === 'contracts');
    
    // Show/hide views
    elements.suppliersView.classList.toggle('hidden', view !== 'suppliers');
    elements.contractsView.classList.toggle('hidden', view !== 'contracts');
    
    // Show/hide action buttons
    elements.addSupplierBtn.classList.toggle('hidden', view !== 'suppliers');
    elements.addCategoryBtn.classList.toggle('hidden', view !== 'suppliers');
    elements.addContractBtn?.classList.toggle('hidden', view !== 'contracts');
    
    // Load data if needed
    if (view === 'contracts' && state.contracts.length === 0) {
        loadContracts();
    }
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
        // Load categories first (without rendering)
        state.categories = await api.getCategories();
        
        if (state.categories.length === 0) {
            await api.seedCategories();
            state.categories = await api.getCategories();
        }
        
        // Load suppliers
        state.suppliers = await api.getSuppliers();
        
        // NOW render categories with accurate counts
        renderCategoryFilters();
        populateCategoryCheckboxes();
        renderCategoryManageList();
        
        // Render suppliers
        renderSuppliers();
        
        // Update stats and notifications
        updateStatistics();
        updateNotifications();
        
        // Setup contracts tables if needed (silent fail is OK)
        try {
            await api.setupContractsTables();
        } catch (e) {
            // Tables might already exist
        }
        
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
        // Re-render category filters to update counts
        renderCategoryFilters();
        renderCategoryManageList();
        updateNotifications();
    } catch (error) {
        console.error('Failed to load suppliers:', error);
    }
}

async function loadContracts() {
    showContractsLoading(true);
    
    try {
        const filters = {};
        if (state.contractFilters.supplier_id) {
            filters.supplier_id = state.contractFilters.supplier_id;
        }
        if (state.contractFilters.search) {
            filters.search = state.contractFilters.search;
        }
        
        state.contracts = await api.getContracts(filters);
        renderContracts();
        updateContractStatistics();
    } catch (error) {
        console.error('Failed to load contracts:', error);
        showToast('Failed to load contracts', 'error');
    } finally {
        showContractsLoading(false);
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
    const alertSuppliers = state.suppliers.filter(s => s.alert_level !== null);
    const alertCount = alertSuppliers.length;
    
    if (elements.notificationBadge) {
        elements.notificationBadge.textContent = alertCount;
        elements.notificationBadge.classList.toggle('hidden', alertCount === 0);
    }
    
    if (elements.needsAttention) {
        elements.needsAttention.textContent = alertCount;
    }
    
    if (elements.needsAttentionCard) {
        elements.needsAttentionCard.classList.toggle('no-alerts', alertCount === 0);
    }
    
    if (state.notificationPanelOpen) {
        renderNotificationPanel();
    }
}

function renderNotificationPanel() {
    if (!elements.notificationList || !elements.notificationSummary) return;
    
    const alertSuppliers = state.suppliers
        .filter(s => s.alert_level !== null)
        .sort((a, b) => {
            const priority = { 'critical': 1, 'warning': 2, 'action_needed': 3 };
            return (priority[a.alert_level] || 99) - (priority[b.alert_level] || 99);
        });
    
    const counts = {
        critical: alertSuppliers.filter(s => s.alert_level === 'critical').length,
        warning: alertSuppliers.filter(s => s.alert_level === 'warning').length,
        action_needed: alertSuppliers.filter(s => s.alert_level === 'action_needed').length
    };
    
    elements.notificationSummary.innerHTML = `
        ${counts.critical > 0 ? `<span class="summary-badge critical">${counts.critical} Expired</span>` : ''}
        ${counts.warning > 0 ? `<span class="summary-badge warning">${counts.warning} Expiring Soon</span>` : ''}
        ${counts.action_needed > 0 ? `<span class="summary-badge action-needed">${counts.action_needed} Incomplete</span>` : ''}
    `;
    
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

// ==================== Supplier Rendering ====================

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
    
    const complianceStatus = getComplianceStatus(supplier);
    const isFullyCompliant = isDocComplete && complianceStatus.allCompliant;
    
    const categoryNames = (supplier.categories || []).map(c => c.name).join(', ') || 'Uncategorized';
    
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
    
    return { nisExpired, graExpired, allCompliant, message };
}

// ==================== Category Rendering ====================

function renderCategoryFilters() {
    // Keep the "All" option
    const allOption = elements.categoryFilters.querySelector('.category-item');
    elements.categoryFilters.innerHTML = '';
    
    // Recreate "All Categories" option
    const allLabel = document.createElement('label');
    allLabel.className = 'category-item' + (state.filters.category === 'all' ? ' active' : '');
    allLabel.innerHTML = `
        <input type="radio" name="category-filter" value="all" ${state.filters.category === 'all' ? 'checked' : ''}>
        <span class="category-radio"></span>
        <span class="category-name">All Categories</span>
        <span class="category-count" id="count-all">${state.suppliers.length}</span>
    `;
    allLabel.querySelector('input').addEventListener('change', () => handleCategoryFilter('all'));
    elements.categoryFilters.appendChild(allLabel);
    
    // Add category items with ACCURATE counts from state.suppliers
    state.categories.forEach(category => {
        // Count suppliers that have this category
        const supplierCount = state.suppliers.filter(s => {
            const catIds = s.category_ids || (s.category_id ? [s.category_id] : []);
            return catIds.includes(category.id);
        }).length;
        
        const item = document.createElement('label');
        item.className = 'category-item' + (state.filters.category === category.id.toString() ? ' active' : '');
        item.innerHTML = `
            <input type="radio" name="category-filter" value="${category.id}" ${state.filters.category === category.id.toString() ? 'checked' : ''}>
            <span class="category-radio"></span>
            <span class="category-name">${escapeHtml(category.name)}</span>
            <span class="category-count">${supplierCount}</span>
        `;
        
        item.querySelector('input').addEventListener('change', () => {
            handleCategoryFilter(category.id.toString());
        });
        
        elements.categoryFilters.appendChild(item);
    });
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
        const supplierCount = state.suppliers.filter(s => {
            const catIds = s.category_ids || (s.category_id ? [s.category_id] : []);
            return catIds.includes(category.id);
        }).length;
        
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
    let filtered = state.suppliers.filter(supplier => {
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
            const catIds = supplier.category_ids || (supplier.category_id ? [supplier.category_id] : []);
            if (!catIds.includes(catId)) {
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
    
    // Apply sorting
    filtered = sortSuppliers(filtered, state.filters.sort);
    
    return filtered;
}

function sortSuppliers(suppliers, sortOption) {
    const [field, direction] = sortOption.split('-');
    const multiplier = direction === 'asc' ? 1 : -1;
    
    return [...suppliers].sort((a, b) => {
        let comparison = 0;
        
        switch (field) {
            case 'name':
                comparison = a.name.localeCompare(b.name);
                break;
            case 'date':
                comparison = new Date(a.created_at) - new Date(b.created_at);
                break;
            case 'category':
                const catA = (a.categories && a.categories[0]?.name) || 'zzz';
                const catB = (b.categories && b.categories[0]?.name) || 'zzz';
                comparison = catA.localeCompare(catB);
                break;
            default:
                comparison = 0;
        }
        
        return comparison * multiplier;
    });
}

function handleSupplierSort(e) {
    state.filters.sort = e.target.value;
    renderSuppliers();
}

function handleSearch(e) {
    state.filters.search = e.target.value.trim();
    renderSuppliers();
}

function handleCategoryFilter(category) {
    state.filters.category = category;
    
    document.querySelectorAll('.category-item').forEach(item => {
        const input = item.querySelector('input');
        item.classList.toggle('active', input.value === category);
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
        if (fileInput) fileInput.value = '';
        if (existingBtns) existingBtns.remove();
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
    spinner?.classList.remove('hidden');
    if (btnText) btnText.textContent = 'Saving...';
    
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
        spinner?.classList.add('hidden');
        if (btnText) btnText.textContent = 'Save Supplier';
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

// ==================== Supplier Detail Modal ====================

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

// ==================== CONTRACT MODULE ====================

function renderContracts() {
    const container = elements.contractsList;
    
    if (!container) return;
    
    container.innerHTML = '';
    
    if (state.contracts.length === 0) {
        elements.contractsEmptyState?.classList.remove('hidden');
        container.classList.add('hidden');
    } else {
        elements.contractsEmptyState?.classList.add('hidden');
        container.classList.remove('hidden');
        
        // Add header row
        const headerRow = document.createElement('div');
        headerRow.className = 'contract-list-header';
        headerRow.innerHTML = `
            <span>Contract #</span>
            <span>Supplier</span>
            <span>Description</span>
            <span>Amount</span>
            <span>Duration</span>
        `;
        container.appendChild(headerRow);
        
        // Apply sorting
        const sortedContracts = sortContracts(state.contracts, state.contractFilters.sort);
        
        sortedContracts.forEach(contract => {
            container.appendChild(createContractCard(contract));
        });
    }
}

function sortContracts(contracts, sortOption) {
    const [field, direction] = sortOption.split('-');
    const multiplier = direction === 'asc' ? 1 : -1;
    
    return [...contracts].sort((a, b) => {
        let comparison = 0;
        
        switch (field) {
            case 'number':
                comparison = (a.contract_number || '').localeCompare(b.contract_number || '');
                break;
            case 'date':
                comparison = new Date(a.created_at) - new Date(b.created_at);
                break;
            case 'amount':
                comparison = (a.amount || 0) - (b.amount || 0);
                break;
            case 'supplier':
                comparison = (a.supplier_name || '').localeCompare(b.supplier_name || '');
                break;
            default:
                comparison = 0;
        }
        
        return comparison * multiplier;
    });
}

function handleContractSort(e) {
    state.contractFilters.sort = e.target.value;
    renderContracts();
}

function createContractCard(contract) {
    const card = document.createElement('div');
    card.className = 'contract-card';
    card.onclick = () => openContractDetailModal(contract);
    
    const hasFiles = contract.file_count > 0;
    
    card.innerHTML = `
        <div class="contract-card-header">
            <span class="contract-number">${escapeHtml(contract.contract_number)}</span>
            <span class="contract-file-badge ${hasFiles ? 'has-files' : 'no-files'}">
                <svg viewBox="0 0 24 24" width="12" height="12"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="14,2 14,8 20,8" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                ${contract.file_count || 0}
            </span>
        </div>
        <div class="contract-supplier">${escapeHtml(contract.supplier_name || 'Unknown Supplier')}</div>
        <div class="contract-description">${escapeHtml(contract.description || 'No description')}</div>
        <div class="contract-amount"><strong>GYD ${formatCurrency(contract.amount || 0)}</strong></div>
        <div class="contract-dates">
            ${contract.start_date || contract.end_date ? `
                ${contract.start_date ? formatDate(contract.start_date) : 'N/A'} — ${contract.end_date ? formatDate(contract.end_date) : 'N/A'}
            ` : '—'}
        </div>
    `;
    
    return card;
}

function updateContractStatistics() {
    const total = state.contracts.length;
    const totalValue = state.contracts.reduce((sum, c) => sum + (c.amount || 0), 0);
    
    if (elements.totalContracts) {
        elements.totalContracts.textContent = total;
    }
    
    if (elements.totalContractValue) {
        elements.totalContractValue.textContent = 'GYD ' + formatCurrency(totalValue);
    }
}

function handleContractSearch(e) {
    state.contractFilters.search = e.target.value.trim();
    loadContracts();
}

function handleContractSupplierFilter() {
    state.contractFilters.supplier_id = elements.contractSupplierFilter.value;
    loadContracts();
}

function populateContractSupplierDropdown() {
    const select = elements.contractSupplier;
    const filter = elements.contractSupplierFilter;
    
    if (select) {
        select.innerHTML = '<option value="">Select Supplier</option>';
        state.suppliers.forEach(supplier => {
            select.innerHTML += `<option value="${supplier.id}">${escapeHtml(supplier.name)}</option>`;
        });
    }
    
    if (filter) {
        filter.innerHTML = '<option value="">All Suppliers</option>';
        state.suppliers.forEach(supplier => {
            filter.innerHTML += `<option value="${supplier.id}">${escapeHtml(supplier.name)}</option>`;
        });
    }
}

function openContractModal(contract = null) {
    state.isContractEditMode = contract !== null;
    state.currentContract = contract;
    state.pendingContractFiles = [];
    
    elements.contractForm?.reset();
    if (elements.contractId) elements.contractId.value = '';
    
    // Populate supplier dropdown
    populateContractSupplierDropdown();
    
    // Clear pending files display
    if (elements.pendingFilesCount) {
        elements.pendingFilesCount.textContent = '';
    }
    
    // Hide existing files section
    if (elements.existingContractFiles) {
        elements.existingContractFiles.innerHTML = '';
        elements.existingContractFiles.classList.add('hidden');
    }
    
    if (state.isContractEditMode && contract) {
        elements.contractModalTitle.textContent = 'Edit Contract';
        elements.contractId.value = contract.id;
        
        elements.contractNumber.value = contract.contract_number || '';
        elements.contractSupplier.value = contract.supplier_id || '';
        elements.contractDescription.value = contract.description || '';
        elements.contractAmount.value = contract.amount || '';
        elements.contractStartDate.value = contract.start_date || '';
        elements.contractEndDate.value = contract.end_date || '';
        
        // Show existing files
        if (contract.files && contract.files.length > 0) {
            elements.existingContractFiles.classList.remove('hidden');
            elements.existingContractFiles.innerHTML = contract.files.map(file => `
                <div class="existing-file-item">
                    <div class="file-info">
                        <svg viewBox="0 0 24 24" width="16" height="16"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="14,2 14,8 20,8" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                        <span>${escapeHtml(file.file_name)}</span>
                    </div>
                    <div class="file-actions">
                        <button type="button" class="btn btn-ghost btn-sm" onclick="viewContractFile(${contract.id}, ${file.id})" title="View">
                            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                        </button>
                        <button type="button" class="btn btn-ghost btn-sm text-danger" onclick="removeContractFile(${contract.id}, ${file.id})" title="Delete">
                            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" fill="none"/></svg>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } else {
        elements.contractModalTitle.textContent = 'Add New Contract';
        state.isContractEditMode = false;
    }
    
    elements.contractModal?.classList.remove('hidden');
    elements.contractNumber?.focus();
}

function closeContractModal() {
    elements.contractModal?.classList.add('hidden');
    state.currentContract = null;
    state.isContractEditMode = false;
    state.pendingContractFiles = [];
}

function handleContractFileSelect(e) {
    const files = Array.from(e.target.files);
    
    files.forEach(file => {
        if (file.type !== 'application/pdf') {
            showToast('Only PDF files are allowed', 'error');
            return;
        }
        
        const maxSizeBytes = 10 * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            showToast('File size must be less than 10MB', 'error');
            return;
        }
        
        state.pendingContractFiles.push(file);
    });
    
    if (elements.pendingFilesCount) {
        elements.pendingFilesCount.textContent = state.pendingContractFiles.length > 0 
            ? `${state.pendingContractFiles.length} file(s) selected` 
            : '';
    }
    
    e.target.value = '';
}

async function handleContractSubmit(e) {
    e.preventDefault();
    
    const submitBtn = elements.contractSubmitBtn;
    const spinner = submitBtn?.querySelector('.btn-spinner');
    const btnText = submitBtn?.querySelector('span');
    
    if (submitBtn) submitBtn.disabled = true;
    spinner?.classList.remove('hidden');
    if (btnText) btnText.textContent = 'Saving...';
    
    try {
        const contractData = {
            contract_number: elements.contractNumber.value.trim(),
            supplier_id: parseInt(elements.contractSupplier.value),
            description: elements.contractDescription.value.trim() || null,
            amount: elements.contractAmount.value ? parseFloat(elements.contractAmount.value) : null,
            start_date: elements.contractStartDate.value || null,
            end_date: elements.contractEndDate.value || null
        };
        
        if (!contractData.contract_number) {
            showToast('Contract number is required', 'error');
            return;
        }
        
        if (!contractData.supplier_id) {
            showToast('Please select a supplier', 'error');
            return;
        }
        
        let contractId;
        
        if (state.isContractEditMode && elements.contractId.value) {
            contractId = parseInt(elements.contractId.value);
            await api.updateContract(contractId, contractData);
            showToast('Contract updated successfully');
        } else {
            const response = await api.createContract(contractData);
            contractId = response.contract.id;
            showToast('Contract created successfully');
        }
        
        // Upload pending files
        for (const file of state.pendingContractFiles) {
            await api.uploadContractFile(contractId, file);
        }
        
        await loadContracts();
        closeContractModal();
        
    } catch (error) {
        showToast(error.message || 'Failed to save contract', 'error');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
        spinner?.classList.add('hidden');
        if (btnText) btnText.textContent = 'Save Contract';
    }
}

function openContractDetailModal(contract) {
    state.currentContract = contract;
    
    if (elements.contractDetailTitle) {
        elements.contractDetailTitle.textContent = `Contract: ${contract.contract_number}`;
    }
    
    if (elements.contractDetailNumber) {
        elements.contractDetailNumber.textContent = contract.contract_number;
    }
    
    if (elements.contractDetailSupplier) {
        elements.contractDetailSupplier.textContent = contract.supplier_name || 'Unknown';
    }
    
    if (elements.contractDetailDescription) {
        elements.contractDetailDescription.textContent = contract.description || 'No description';
    }
    
    if (elements.contractDetailAmount) {
        elements.contractDetailAmount.textContent = contract.amount 
            ? 'GYD ' + formatCurrency(contract.amount) 
            : '-';
    }
    
    if (elements.contractDetailStart) {
        elements.contractDetailStart.textContent = contract.start_date 
            ? formatDate(contract.start_date) 
            : '-';
    }
    
    if (elements.contractDetailEnd) {
        elements.contractDetailEnd.textContent = contract.end_date 
            ? formatDate(contract.end_date) 
            : '-';
    }
    
    if (elements.contractDetailCreated) {
        elements.contractDetailCreated.textContent = formatDate(contract.created_at);
    }
    
    // Render files
    if (elements.contractDetailFiles) {
        if (contract.files && contract.files.length > 0) {
            elements.contractDetailFiles.innerHTML = contract.files.map(file => `
                <div class="contract-file-card">
                    <svg viewBox="0 0 24 24" class="file-icon">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="none" stroke="currentColor" stroke-width="2"/>
                        <polyline points="14,2 14,8 20,8" fill="none" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <div class="file-details">
                        <span class="file-name">${escapeHtml(file.file_name)}</span>
                        <span class="file-date">${formatDate(file.uploaded_at)}</span>
                    </div>
                    <div class="file-actions">
                        <button type="button" class="btn btn-sm btn-outline" onclick="viewContractFile(${contract.id}, ${file.id})">
                            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                            View
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            elements.contractDetailFiles.innerHTML = `
                <div class="no-files-message">
                    <svg viewBox="0 0 24 24" width="32" height="32">
                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="none" stroke="currentColor" stroke-width="2"/>
                        <polyline points="14,2 14,8 20,8" fill="none" stroke="currentColor" stroke-width="2"/>
                    </svg>
                    <p>No files uploaded for this contract</p>
                </div>
            `;
        }
    }
    
    elements.contractDetailModal?.classList.remove('hidden');
}

function closeContractDetailModal() {
    elements.contractDetailModal?.classList.add('hidden');
    state.currentContract = null;
}

function handleEditContract() {
    if (state.currentContract) {
        const contractToEdit = { ...state.currentContract };
        closeContractDetailModal();
        openContractModal(contractToEdit);
    }
}

async function handleDeleteContract() {
    if (!state.currentContract) return;
    
    const confirmed = confirm(`Are you sure you want to delete contract "${state.currentContract.contract_number}"?\n\nThis will also delete all associated files.`);
    
    if (!confirmed) return;
    
    try {
        await api.deleteContract(state.currentContract.id);
        closeContractDetailModal();
        await loadContracts();
        showToast('Contract deleted successfully');
    } catch (error) {
        showToast(error.message || 'Failed to delete contract', 'error');
    }
}

function viewContractFile(contractId, fileId) {
    const url = api.getContractFileUrl(contractId, fileId);
    window.open(url, '_blank');
}

async function removeContractFile(contractId, fileId) {
    const confirmed = confirm('Are you sure you want to delete this file?');
    
    if (!confirmed) return;
    
    try {
        await api.deleteContractFile(contractId, fileId);
        
        // Refresh the contract in modal
        const updatedContract = await api.getContract(contractId);
        state.currentContract = updatedContract;
        
        // Re-render the existing files in the edit modal
        if (elements.existingContractFiles && updatedContract.files) {
            if (updatedContract.files.length > 0) {
                elements.existingContractFiles.innerHTML = updatedContract.files.map(file => `
                    <div class="existing-file-item">
                        <div class="file-info">
                            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" fill="none" stroke="currentColor" stroke-width="2"/><polyline points="14,2 14,8 20,8" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                            <span>${escapeHtml(file.file_name)}</span>
                        </div>
                        <div class="file-actions">
                            <button type="button" class="btn btn-ghost btn-sm" onclick="viewContractFile(${contractId}, ${file.id})" title="View">
                                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                            </button>
                            <button type="button" class="btn btn-ghost btn-sm text-danger" onclick="removeContractFile(${contractId}, ${file.id})" title="Delete">
                                <svg viewBox="0 0 24 24" width="14" height="14"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" stroke-width="2" fill="none"/></svg>
                            </button>
                        </div>
                    </div>
                `).join('');
            } else {
                elements.existingContractFiles.classList.add('hidden');
            }
        }
        
        showToast('File deleted successfully');
    } catch (error) {
        showToast(error.message || 'Failed to delete file', 'error');
    }
}

function showContractsLoading(show) {
    if (elements.contractsLoadingState) {
        elements.contractsLoadingState.classList.toggle('hidden', !show);
    }
    if (elements.contractsList) {
        elements.contractsList.classList.toggle('hidden', show);
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

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-GY', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
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
