/**
 * Supplier Document Management System
 * Main Application
 * 
 * Bureau of Statistics — Procurement Unit
 */

// ==================== State ====================
const state = {
    suppliers: [],
    categories: [],
    currentSupplier: null,
    pendingDocuments: {},
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
    supplierEmail: document.getElementById('supplier-email'),
    supplierContact: document.getElementById('supplier-contact'),
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
    // Check authentication
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
    elements.addSupplierBtn.addEventListener('click', () => openSupplierModal());
    elements.addCategoryBtn.addEventListener('click', openCategoryModal);
    
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
    
    // Close modals on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSupplierModal();
            closeDetailModal();
            closeCategoryModal();
        }
    });
    
    // Close modals on backdrop click
    [elements.supplierModal, elements.detailModal, elements.categoryModal].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeSupplierModal();
                closeDetailModal();
                closeCategoryModal();
            }
        });
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
        // Load categories first
        await loadCategories();
        
        // Seed default categories if none exist
        if (state.categories.length === 0) {
            await api.seedCategories();
            await loadCategories();
        }
        
        // Load suppliers
        await loadSuppliers();
        
        // Update stats
        updateStatistics();
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
        populateCategoryDropdown();
        renderCategoryManageList();
    } catch (error) {
        console.error('Failed to load categories:', error);
    }
}

async function loadSuppliers() {
    try {
        state.suppliers = await api.getSuppliers();
        renderSuppliers();
    } catch (error) {
        console.error('Failed to load suppliers:', error);
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
    const isComplete = docsCount === CONFIG.DOCUMENT_TYPES.length;
    const category = state.categories.find(c => c.id === supplier.category_id);
    
    card.innerHTML = `
        <div class="supplier-card-header">
            <span class="supplier-name">${escapeHtml(supplier.name)}</span>
            <span class="compliance-badge ${isComplete ? 'complete' : 'incomplete'}">
                ${isComplete ? `
                    <svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" stroke-width="2" fill="none"/><polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" stroke-width="2" fill="none"/></svg>
                    Compliant
                ` : `
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none"/><line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2"/><line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2"/></svg>
                    ${docsCount}/${CONFIG.DOCUMENT_TYPES.length}
                `}
            </span>
        </div>
        <span class="supplier-category">
            <svg viewBox="0 0 24 24"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" stroke="currentColor" stroke-width="2" fill="none"/></svg>
            ${category ? escapeHtml(category.name) : 'Uncategorized'}
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
        <div class="supplier-documents">
            ${CONFIG.DOCUMENT_TYPES.map(docType => `
                <div class="doc-indicator ${hasDocument(supplier.documents, docType.id) ? 'uploaded' : ''}" title="${docType.name}"></div>
            `).join('')}
        </div>
    `;
    
    return card;
}

function renderCategoryFilters() {
    // Keep the "All Categories" option
    const allOption = elements.categoryFilters.querySelector('.category-item');
    elements.categoryFilters.innerHTML = '';
    elements.categoryFilters.appendChild(allOption);
    
    // Add category options
    state.categories.forEach(category => {
        const supplierCount = state.suppliers.filter(s => s.category_id === category.id).length;
        
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
    
    // Update all count
    document.getElementById('count-all').textContent = state.suppliers.length;
    
    // Re-attach listener for "All" option
    allOption.querySelector('input').addEventListener('change', () => {
        handleCategoryFilter('all');
    });
}

function populateCategoryDropdown() {
    const select = elements.supplierCategory;
    select.innerHTML = '<option value="">Select a category</option>';
    
    state.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

function renderCategoryManageList() {
    elements.categoryList.innerHTML = '';
    
    if (state.categories.length === 0) {
        elements.categoryList.innerHTML = '<p style="color: var(--color-text-muted); text-align: center;">No categories yet</p>';
        return;
    }
    
    state.categories.forEach(category => {
        const supplierCount = state.suppliers.filter(s => s.category_id === category.id).length;
        
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
        return docsCount === CONFIG.DOCUMENT_TYPES.length;
    }).length;
    
    elements.totalSuppliers.textContent = total;
    elements.compliantSuppliers.textContent = compliant;
}

// ==================== Filtering ====================

function getFilteredSuppliers() {
    return state.suppliers.filter(supplier => {
        // Search filter
        if (state.filters.search) {
            const searchLower = state.filters.search.toLowerCase();
            const nameMatch = supplier.name.toLowerCase().includes(searchLower);
            const addressMatch = supplier.address.toLowerCase().includes(searchLower);
            const telephoneMatch = supplier.telephone.includes(state.filters.search);
            
            if (!nameMatch && !addressMatch && !telephoneMatch) {
                return false;
            }
        }
        
        // Category filter
        if (state.filters.category !== 'all') {
            if (supplier.category_id !== parseInt(state.filters.category)) {
                return false;
            }
        }
        
        // Compliance filter
        const docsCount = countDocuments(supplier.documents);
        const isComplete = docsCount === CONFIG.DOCUMENT_TYPES.length;
        
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
    
    // Update active state
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
    state.currentSupplier = supplier;
    state.pendingDocuments = {};
    
    // Reset form
    elements.supplierForm.reset();
    elements.supplierId.value = '';
    
    // Reset document statuses and remove dynamic buttons
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
    
    if (supplier) {
        // Edit mode
        elements.supplierModalTitle.textContent = 'Edit Supplier';
        elements.supplierId.value = supplier.id;
        elements.supplierName.value = supplier.name;
        elements.supplierAddress.value = supplier.address;
        elements.supplierTelephone.value = supplier.telephone;
        elements.supplierCategory.value = supplier.category_id;
        elements.supplierEmail.value = supplier.email || '';
        elements.supplierContact.value = supplier.contact_person || '';
        
        // Show existing documents with View/Download buttons
        if (supplier.documents) {
            CONFIG.DOCUMENT_TYPES.forEach(docType => {
                const doc = supplier.documents.find(d => d.document_type === docType.id);
                if (doc) {
                    const statusEl = document.getElementById(`status-${docType.id}`);
                    const actionsEl = document.querySelector(`.doc-actions[data-doc="${docType.id}"]`) || 
                                      document.getElementById(`file-${docType.id}`)?.closest('.doc-actions');
                    
                    if (statusEl) {
                        statusEl.textContent = doc.file_name || 'Uploaded';
                        statusEl.classList.add('uploaded');
                    }
                    
                    // Add or update View/Download buttons
                    const existingBtns = document.getElementById(`doc-btns-${docType.id}`);
                    if (existingBtns) {
                        existingBtns.remove();
                    }
                    
                    const btnContainer = document.createElement('div');
                    btnContainer.id = `doc-btns-${docType.id}`;
                    btnContainer.className = 'doc-existing-btns';
                    btnContainer.innerHTML = `
                        <button type="button" class="btn btn-ghost btn-sm" onclick="viewDocument(${supplier.id}, '${docType.id}')" title="View document">
                            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                        </button>
                        <button type="button" class="btn btn-ghost btn-sm" onclick="downloadDocument(${supplier.id}, '${docType.id}', '${escapeHtml(doc.file_name || docType.id + '.pdf')}')" title="Download document">
                            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                        </button>
                    `;
                    
                    // Find the document upload item and append buttons
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
        // Add mode
        elements.supplierModalTitle.textContent = 'Add New Supplier';
    }
    
    elements.supplierModal.classList.remove('hidden');
    elements.supplierName.focus();
}

function closeSupplierModal() {
    elements.supplierModal.classList.add('hidden');
    state.currentSupplier = null;
    state.pendingDocuments = {};
}

function openAddSupplierModal() {
    openSupplierModal();
}

async function handleSupplierSubmit(e) {
    e.preventDefault();
    
    const submitBtn = elements.supplierSubmitBtn;
    const spinner = submitBtn.querySelector('.btn-spinner');
    const btnText = submitBtn.querySelector('span');
    
    // Disable button and show spinner
    submitBtn.disabled = true;
    spinner.classList.remove('hidden');
    btnText.textContent = 'Saving...';
    
    try {
        const supplierData = {
            name: elements.supplierName.value.trim(),
            address: elements.supplierAddress.value.trim(),
            telephone: elements.supplierTelephone.value.trim(),
            category_id: parseInt(elements.supplierCategory.value),
            email: elements.supplierEmail.value.trim() || null,
            contact_person: elements.supplierContact.value.trim() || null
        };
        
        let supplierId;
        
        if (elements.supplierId.value) {
            // Update existing supplier
            supplierId = parseInt(elements.supplierId.value);
            await api.updateSupplier(supplierId, supplierData);
        } else {
            // Create new supplier
            const response = await api.createSupplier(supplierData);
            supplierId = response.supplier.id;
        }
        
        // Upload any pending documents
        for (const [docType, file] of Object.entries(state.pendingDocuments)) {
            await api.uploadDocument(supplierId, docType, file);
        }
        
        // Reload suppliers
        await loadSuppliers();
        await loadCategories(); // Refresh category counts
        
        closeSupplierModal();
        showToast(elements.supplierId.value ? 'Supplier updated successfully' : 'Supplier created successfully');
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
    
    // Validate file type
    if (!CONFIG.UPLOAD.ALLOWED_TYPES.includes(file.type)) {
        showToast('Only PDF files are allowed', 'error');
        e.target.value = '';
        return;
    }
    
    // Validate file size
    const maxSizeBytes = CONFIG.UPLOAD.MAX_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
        showToast(`File size must be less than ${CONFIG.UPLOAD.MAX_SIZE_MB}MB`, 'error');
        e.target.value = '';
        return;
    }
    
    // Store pending document
    state.pendingDocuments[docType] = file;
    
    // Update UI
    const statusEl = document.getElementById(`status-${docType}`);
    if (statusEl) {
        statusEl.textContent = file.name;
        statusEl.classList.add('uploaded');
    }
}

// ==================== Detail Modal ====================

async function openDetailModal(supplier) {
    state.currentSupplier = supplier;
    
    // Populate basic info
    elements.detailName.textContent = supplier.name;
    elements.detailAddress.textContent = supplier.address;
    elements.detailTelephone.textContent = supplier.telephone;
    elements.detailEmail.textContent = supplier.email || '-';
    elements.detailContact.textContent = supplier.contact_person || '-';
    
    const category = state.categories.find(c => c.id === supplier.category_id);
    elements.detailCategory.textContent = category ? category.name : 'Uncategorized';
    
    elements.detailCreated.textContent = formatDate(supplier.created_at);
    
    // Populate documents with View/Download buttons
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
                        <button type="button" class="btn btn-sm btn-outline doc-view-btn" onclick="viewDocument(${supplier.id}, '${docType.id}')">
                            <svg viewBox="0 0 24 24" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/></svg>
                            View
                        </button>
                        <button type="button" class="btn btn-sm btn-ghost doc-download-btn" onclick="downloadDocument(${supplier.id}, '${docType.id}', '${escapeHtml(doc.file_name || docType.id + '.pdf')}')">
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
        closeDetailModal();
        openSupplierModal(state.currentSupplier);
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

/**
 * View a document - opens PDF directly in new tab
 * FIX: Uses direct URL instead of trying to parse JSON response
 */
function viewDocument(supplierId, docType) {
    // Construct the direct URL to the document endpoint
    // The worker serves the PDF directly with proper headers
    const url = api.getDocumentDirectUrl(supplierId, docType);
    window.open(url, '_blank');
}

/**
 * Download a document
 * Opens download link in new window/triggers download
 */
function downloadDocument(supplierId, docType, fileName) {
    const url = api.getDocumentDirectUrl(supplierId, docType);
    
    // Create temporary anchor for download
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
    
    // Check for duplicates
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
    
    // Auto-hide after 4 seconds
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
