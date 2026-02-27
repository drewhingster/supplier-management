/**
 * Supplier Document Management System
 * Main Application - VERSION 5
 *
 * Bureau of Statistics — Procurement Unit
 *
 * FEATURES:
 * 1. Fixed category counters (render after suppliers load)
 * 2. Multi-category support
 * 3. Compliance notifications
 * 4. CONTRACT MANAGEMENT MODULE
 * 5. ClickUp-style Procurement Workflow with dynamic tiers
 */

// ==================== Procurement Tier Configuration ====================
const PROCUREMENT_TIERS = {
    CASH_ADVANCE: {
        id: 'cash_advance',
        name: 'Cash Advance',
        minAmount: 0,
        maxAmount: 49999,
        stages: [
            { id: 'applied_advance', name: 'Applied for Advance', requiresAward: false },
            { id: 'received_advance', name: 'Received Advance', requiresAward: false },
            { id: 'completed', name: 'Completed', requiresAward: false },
            { id: 'paid', name: 'Paid', requiresAward: false }
        ],
        approver: null
    },
    SINGLE_QUOTE: {
        id: 'single_quote',
        name: 'Single Quote',
        minAmount: 50000,
        maxAmount: 89999,
        stages: [
            { id: 'quotation_received', name: 'Quotation Received', requiresAward: false },
            { id: 'approved', name: 'Approved by CS/DCS', requiresAward: false, requiresApprover: true },
            { id: 'passed_finance', name: 'Passed to Finance Dept.', requiresAward: false },
            { id: 'completed', name: 'Completed', requiresAward: false },
            { id: 'paid', name: 'Paid', requiresAward: false }
        ],
        approver: 'Chief Statistician / Deputy Chief Statistician'
    },
    THREE_QUOTE_RFQ: {
        id: 'three_quote_rfq',
        name: '3-Quote RFQ',
        minAmount: 90000,
        maxAmount: 249999,
        stages: [
            { id: 'rfqs', name: 'RFQs', requiresAward: false },
            { id: 'evaluation', name: 'Evaluation', requiresAward: false },
            { id: 'approved_cs', name: 'Approved by Chief Statistician', requiresAward: false },
            { id: 'passed_finance', name: 'Passed to Finance Dept.', requiresAward: false },
            { id: 'completed', name: 'Completed', requiresAward: false },
            { id: 'paid', name: 'Paid', requiresAward: false }
        ],
        approver: 'Chief Statistician'
    },
    MINISTERIAL_TENDER_BOARD: {
        id: 'ministerial_tender_board',
        name: 'Ministerial Tender Board',
        minAmount: 250000,
        maxAmount: 1499999,
        stages: [
            { id: 'rfqs', name: 'RFQs', requiresAward: false },
            { id: 'evaluation', name: 'Evaluation', requiresAward: false },
            { id: 'approved_cs', name: 'Approved by Chief Statistician', requiresAward: false },
            { id: 'mtb_submission', name: 'Ministerial Tender Board Submission', requiresAward: false },
            { id: 'approved_mtb', name: 'Approved by MTB', requiresAward: true },
            { id: 'photocopied_docs', name: 'Photocopied Documents', requiresAward: false },
            { id: 'passed_finance', name: 'Passed to Finance Dept.', requiresAward: false },
            { id: 'completed', name: 'Completed', requiresAward: false },
            { id: 'paid', name: 'Paid', requiresAward: false }
        ],
        approver: 'Ministerial Tender Board'
    },
    NPTA: {
        id: 'npta',
        name: 'National Procurement and Tender Administration Board',
        minAmount: 1500000,
        maxAmount: 2999999,
        stages: [
            { id: 'rfqs', name: 'RFQs', requiresAward: false },
            { id: 'evaluation', name: 'Evaluation', requiresAward: false },
            { id: 'approved_cs', name: 'Approved by Chief Statistician', requiresAward: false },
            { id: 'npta_form', name: 'NPTAB Form & Request Letter', requiresAward: false },
            { id: 'approved_npta', name: 'Approved by NPTAB', requiresAward: true },
            { id: 'photocopied_docs', name: 'Photocopied Documents', requiresAward: false },
            { id: 'passed_finance', name: 'Passed to Finance Dept.', requiresAward: false },
            { id: 'completed', name: 'Completed', requiresAward: false },
            { id: 'paid', name: 'Paid', requiresAward: false }
        ],
        approver: 'NPTAB'
    },
    PUBLIC_TENDER_NPTA: {
        id: 'public_tender_npta',
        name: 'Public Tender (NPTAB)',
        minAmount: 3000000,
        maxAmount: 14999999,
        stages: [
            { id: 'tender_advertised', name: 'Public Tender Advertised', requiresAward: false },
            { id: 'tender_closed', name: 'Tender Closed', requiresAward: false },
            { id: 'evaluation', name: 'Evaluation', requiresAward: false },
            { id: 'npta_form', name: 'NPTAB Form & Request Letter', requiresAward: false },
            { id: 'approved_npta', name: 'Approved by NPTAB', requiresAward: true },
            { id: 'photocopied_docs', name: 'Photocopied Documents', requiresAward: false },
            { id: 'passed_finance', name: 'Passed to Finance Dept.', requiresAward: false },
            { id: 'completed', name: 'Completed', requiresAward: false },
            { id: 'paid', name: 'Paid', requiresAward: false }
        ],
        approver: 'NPTAB'
    },
    CABINET: {
        id: 'cabinet',
        name: 'Cabinet',
        minAmount: 15000000,
        maxAmount: Infinity,
        stages: [
            { id: 'tender_advertised', name: 'Public Tender Advertised', requiresAward: false },
            { id: 'tender_closed', name: 'Tender Closed', requiresAward: false },
            { id: 'evaluation', name: 'Evaluation', requiresAward: false },
            { id: 'cabinet_submission', name: 'Cabinet Submission', requiresAward: false },
            { id: 'approved_cabinet', name: 'Approved by Cabinet', requiresAward: true },
            { id: 'photocopied_docs', name: 'Photocopied Documents', requiresAward: false },
            { id: 'passed_finance', name: 'Passed to Finance Dept.', requiresAward: false },
            { id: 'completed', name: 'Completed', requiresAward: false },
            { id: 'paid', name: 'Paid', requiresAward: false }
        ],
        approver: 'Cabinet'
    },
    SINGLE_SOURCE: {
        id: 'single_source',
        name: 'Single Source Procurement',
        minAmount: 0,
        maxAmount: Infinity,
        stages: [
            { id: 'rfq', name: 'RFQ', requiresAward: false },
            { id: 'single_source_justification', name: 'Single Source Justification', requiresAward: false },
            { id: 'approved_cs_dcs', name: 'Approved by CS/DCS', requiresAward: false },
            { id: 'npta_form', name: 'NPTA Form & Request Letter', requiresAward: false, allowNA: true },
            { id: 'approved_nptab_mtb', name: 'Approved by NPTAB/MTB', requiresAward: true, allowNA: true },
            { id: 'photocopied_docs', name: 'Photocopied Documents', requiresAward: false },
            { id: 'passed_finance', name: 'Passed to Finance Dept.', requiresAward: false },
            { id: 'completed', name: 'Completed', requiresAward: false },
            { id: 'paid', name: 'Paid', requiresAward: false }
        ],
        approver: 'NPTAB/MTB'
    }
};

// Contract stage to be inserted when "Is contract necessary?" is checked
const CONTRACT_STAGE = { id: 'contract', name: 'Contract', requiresAward: false, requiresContract: true };

// Helper function to get tier based on budget amount
function getProcurementTier(amount) {
    if (amount <= 49999) return PROCUREMENT_TIERS.CASH_ADVANCE;
    if (amount <= 89999) return PROCUREMENT_TIERS.SINGLE_QUOTE;
    if (amount <= 249999) return PROCUREMENT_TIERS.THREE_QUOTE_RFQ;
    if (amount <= 1499999) return PROCUREMENT_TIERS.MINISTERIAL_TENDER_BOARD;
    if (amount <= 2999999) return PROCUREMENT_TIERS.NPTA;
    if (amount <= 14999999) return PROCUREMENT_TIERS.PUBLIC_TENDER_NPTA;
    return PROCUREMENT_TIERS.CABINET;
}

// Get stages for a tier, optionally including contract stage
function getTierStages(tier, requiresContract = false) {
    let stages = [...tier.stages];

    if (requiresContract) {
        // Insert contract stage before "Passed to Finance Dept."
        const financeIndex = stages.findIndex(s => s.id === 'passed_finance');
        if (financeIndex !== -1) {
            stages.splice(financeIndex, 0, CONTRACT_STAGE);
        }
    }

    return stages;
}

// Calculate progress percentage based on completed stages
function calculateProgress(completedStages, totalStages) {
    if (totalStages === 0) return 0;
    return Math.round((completedStages.length / totalStages) * 100);
}

// ==================== State ====================
const state = {
    suppliers: [],
    categories: [],
    contracts: [],
    tasks: [],
    acknowledgedAlerts: [], // { supplier_id, alert_type, acknowledged_by, acknowledged_at }
    acknowledgedSectionOpen: true,
    currentSupplier: null,
    currentContract: null,
    currentTask: null,
    pendingDocuments: {},
    pendingContractFiles: [],
    isEditMode: false,
    isContractEditMode: false,
    isTaskEditMode: false,
    notificationPanelOpen: false,
    currentView: 'suppliers', // 'suppliers', 'contracts', or 'tasks'
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
    taskFilters: {
        archived: 'active', // 'active', 'archived', 'all'
        status: '',
        assigned_person: '',
        search: '', // search by task name
        sort: 'date-desc' // default sort
    },
    viewMode: 'grid'
};

// ==================== DOM Elements ====================
const elements = {
    // Auth
    authModal: document.getElementById('auth-modal'),
    authForm: document.getElementById('auth-form'),
    authUsername: document.getElementById('auth-username'),
    authPassword: document.getElementById('auth-password'),
    authError: document.getElementById('auth-error'),

    // Change Password Modal
    changePasswordModal: document.getElementById('change-password-modal'),
    changePasswordForm: document.getElementById('change-password-form'),
    currentPassword: document.getElementById('current-password'),
    newPassword: document.getElementById('new-password'),
    confirmPassword: document.getElementById('confirm-password'),
    passwordError: document.getElementById('password-error'),

    // User Info Display
    currentUserName: document.getElementById('current-user-name'),
    userRoleBadge: document.getElementById('user-role-badge'),

    // App
    app: document.getElementById('app'),

    // Navigation
    navSuppliers: document.getElementById('nav-suppliers'),
    navContracts: document.getElementById('nav-contracts'),
    navTasks: document.getElementById('nav-tasks'),
    navActivity: document.getElementById('nav-activity'),
    suppliersView: document.getElementById('suppliers-view'),
    contractsView: document.getElementById('contracts-view'),
    tasksView: document.getElementById('tasks-view'),
    activityView: document.getElementById('activity-view'),

    // Buttons
    addSupplierBtn: document.getElementById('add-supplier-btn'),
    addCategoryBtn: document.getElementById('add-category-btn'),
    addContractBtn: document.getElementById('add-contract-btn'),
    addTaskBtn: document.getElementById('add-task-btn'),
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

    // Task elements - ClickUp style
    taskSearch: document.getElementById('task-search'),
    taskStatusFilter: document.getElementById('task-status-filter'),
    taskPersonFilter: document.getElementById('task-person-filter'),
    taskSort: document.getElementById('task-sort'),
    tasksListBody: document.getElementById('tasks-list-body'),
    tasksListContainer: document.getElementById('tasks-list-container'),
    tasksEmptyState: document.getElementById('tasks-empty-state'),
    tasksLoadingState: document.getElementById('tasks-loading-state'),
    tasksViewTitle: document.getElementById('tasks-view-title'),
    totalTasks: document.getElementById('total-tasks'),
    activeTasks: document.getElementById('active-tasks'),
    completedTasks: document.getElementById('completed-tasks'),

    // Task Modal - ClickUp fields
    taskModal: document.getElementById('task-modal'),
    taskModalTitle: document.getElementById('task-modal-title'),
    taskForm: document.getElementById('task-form'),
    taskId: document.getElementById('task-id'),
    taskProjectCode: document.getElementById('task-project-code'),
    taskTitle: document.getElementById('task-title'),
    taskBudgetAmount: document.getElementById('task-budget-amount'),
    taskAssignedPerson: document.getElementById('task-assigned-person'),
    taskPriority: document.getElementById('task-priority'),
    taskContractor: document.getElementById('task-contractor'),
    taskContractSum: document.getElementById('task-contract-sum'),
    taskRequiresContract: document.getElementById('task-requires-contract'),
    taskSingleSource: document.getElementById('task-single-source'),
    taskLinkedContract: document.getElementById('task-linked-contract'),
    contractLinkSection: document.getElementById('contract-link-section'),
    tierBadge: document.getElementById('tier-badge'),
    workflowStagesContainer: document.getElementById('workflow-stages-container'),
    taskApprover: document.getElementById('task-approver'),
    taskAwardNumber: document.getElementById('task-award-number'),
    taskAwardDocument: document.getElementById('task-award-document'),
    awardDocumentName: document.getElementById('award-document-name'),
    awardDetailsSection: document.getElementById('award-details-section'),
    taskStartDate: document.getElementById('task-start-date'),
    taskEndDate: document.getElementById('task-end-date'),
    taskExpectedCompletion: document.getElementById('task-expected-completion'),
    taskRemarks: document.getElementById('task-remarks'),
    taskSubmitBtn: document.getElementById('task-submit-btn'),

    // Toast
    toast: document.getElementById('toast')
};

// ==================== Initialization ====================

document.addEventListener('DOMContentLoaded', init);

async function init() {
    setupEventListeners();

    if (api.isAuthenticated()) {
        // Validate session is still valid
        const result = await api.checkSession();
        if (result.success) {
            updateUserDisplay();
            showApp();
            await loadInitialData();
            loadRecentAuditLogs(); // Load sidebar audit widget
        } else {
            showAuth();
        }
    } else {
        showAuth();
    }
}

function updateUserDisplay() {
    const user = api.getCurrentUser();
    if (user) {
        elements.currentUserName.textContent = user.fullName || user.username;

        if (user.role === 'view_only') {
            elements.userRoleBadge.classList.remove('hidden');
            document.body.classList.add('view-only-mode');
        } else {
            elements.userRoleBadge.classList.add('hidden');
            document.body.classList.remove('view-only-mode');
        }
    }
}

function setupEventListeners() {
    // Authentication
    elements.authForm.addEventListener('submit', handleLogin);
    elements.changePasswordForm?.addEventListener('submit', handlePasswordChange);
    elements.logoutBtn.addEventListener('click', handleLogout);

    // Navigation
    elements.addSupplierBtn.addEventListener('click', () => openSupplierModal(null));
    elements.addCategoryBtn.addEventListener('click', openCategoryModal);
    elements.addContractBtn?.addEventListener('click', () => openContractModal(null));
    elements.addTaskBtn?.addEventListener('click', () => openTaskModal(null));

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

    // Task Filters
    elements.taskSearch?.addEventListener('input', handleTaskFilterChange);
    elements.taskStatusFilter?.addEventListener('change', handleTaskFilterChange);
    elements.taskPersonFilter?.addEventListener('input', handleTaskFilterChange);
    elements.taskSort?.addEventListener('change', handleTaskSortChange);
    document.querySelectorAll('input[name="task-archive-filter"]').forEach(radio => {
        radio.addEventListener('change', handleTaskArchiveFilterChange);
    });

    // Task Form
    elements.taskForm?.addEventListener('submit', handleTaskSubmit);

    // Award Document file input - update display when file is selected
    elements.taskAwardDocument?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        const uploadBox = e.target.closest('.file-upload-box');
        const nameSpan = document.getElementById('award-document-name');

        if (file && nameSpan) {
            nameSpan.textContent = file.name;
            uploadBox?.classList.add('has-file');
        } else if (nameSpan) {
            nameSpan.textContent = 'Click to upload PDF';
            uploadBox?.classList.remove('has-file');
        }
    });

    // Document file inputs
    CONFIG.DOCUMENT_TYPES.forEach(docType => {
        const fileInput = document.getElementById(`file-${docType.id}`);
        if (fileInput) {
            fileInput.addEventListener('change', (e) => handleFileSelect(e, docType.id));
        }
    });

    // Close on escape - with confirmation for forms with data
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            // Check which modal is open and close it with confirmation
            if (!elements.supplierModal?.classList.contains('hidden')) {
                closeSupplierModal();
            } else if (!elements.contractModal?.classList.contains('hidden')) {
                closeContractModal();
            } else if (!elements.taskModal?.classList.contains('hidden')) {
                closeTaskModal();
            } else {
                // These don't need confirmation as they're view-only
                closeDetailModal();
                closeCategoryModal();
                closeContractDetailModal();
                closeNotificationPanel();
            }
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

    // Update desktop nav tabs
    elements.navSuppliers.classList.toggle('active', view === 'suppliers');
    elements.navContracts.classList.toggle('active', view === 'contracts');
    elements.navTasks?.classList.toggle('active', view === 'tasks');
    elements.navActivity?.classList.toggle('active', view === 'activity');

    // Update mobile nav tabs
    document.getElementById('mobile-nav-suppliers')?.classList.toggle('active', view === 'suppliers');
    document.getElementById('mobile-nav-contracts')?.classList.toggle('active', view === 'contracts');
    document.getElementById('mobile-nav-tasks')?.classList.toggle('active', view === 'tasks');
    document.getElementById('mobile-nav-activity')?.classList.toggle('active', view === 'activity');

    // Show/hide views
    elements.suppliersView.classList.toggle('hidden', view !== 'suppliers');
    elements.contractsView.classList.toggle('hidden', view !== 'contracts');
    elements.tasksView?.classList.toggle('hidden', view !== 'tasks');
    elements.activityView?.classList.toggle('hidden', view !== 'activity');

    // Show/hide action buttons
    elements.addSupplierBtn.classList.toggle('hidden', view !== 'suppliers');
    elements.addCategoryBtn.classList.toggle('hidden', view !== 'suppliers');
    elements.addContractBtn?.classList.toggle('hidden', view !== 'contracts');
    elements.addTaskBtn?.classList.toggle('hidden', view !== 'tasks');

    // Load data if needed
    if (view === 'contracts' && state.contracts.length === 0) {
        loadContracts();
    }
    if (view === 'tasks' && state.tasks.length === 0) {
        loadTasks();
    }
    if (view === 'activity') {
        loadActivityLogs();
    }
}

// ==================== Authentication ====================

function showAuth() {
    elements.authModal.classList.remove('hidden');
    elements.app.classList.add('hidden');
    // Hide mobile navigation when not logged in
    document.getElementById('mobile-bottom-nav')?.classList.add('hidden');
    document.getElementById('mobile-fab')?.classList.add('hidden');
}

function showApp() {
    elements.authModal.classList.add('hidden');
    elements.app.classList.remove('hidden');
    // Show mobile navigation
    document.getElementById('mobile-bottom-nav')?.classList.remove('hidden');
    document.getElementById('mobile-fab')?.classList.remove('hidden');
}

async function handleLogin(e) {
    e.preventDefault();

    const username = elements.authUsername.value.trim();
    const password = elements.authPassword.value;

    if (!username || !password) {
        showAuthError('Please enter username and password');
        return;
    }

    try {
        const response = await api.login(username, password);

        if (response.success) {
            hideAuthError();

            // Check if user must change password
            if (response.user && response.user.mustChangePassword) {
                showChangePasswordModal();
            } else {
                updateUserDisplay();
                showApp();
                await loadInitialData();
                loadRecentAuditLogs();
                showToast(`Welcome, ${response.user.fullName}!`);
            }
        } else {
            showAuthError(response.error || 'Invalid username or password');
        }
    } catch (error) {
        showAuthError(error.message || 'Login failed');
    }
}

async function handlePasswordChange(e) {
    e.preventDefault();

    const currentPassword = elements.currentPassword.value;
    const newPassword = elements.newPassword.value;
    const confirmPassword = elements.confirmPassword.value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showPasswordError('All fields are required');
        return;
    }

    if (newPassword.length < 6) {
        showPasswordError('New password must be at least 6 characters');
        return;
    }

    if (newPassword !== confirmPassword) {
        showPasswordError('Passwords do not match');
        return;
    }

    try {
        const response = await api.changePassword(currentPassword, newPassword);

        if (response.success) {
            hidePasswordError();
            hideChangePasswordModal();
            updateUserDisplay();
            showApp();
            await loadInitialData();
            loadRecentAuditLogs();
            showToast('Password changed successfully!');
        } else {
            showPasswordError(response.error || 'Failed to change password');
        }
    } catch (error) {
        showPasswordError(error.message || 'Failed to change password');
    }
}

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        api.logoutSession();
        showAuth();
        clearAuthForms();
    }
}

function showAuthError(message) {
    if (elements.authError) {
        elements.authError.textContent = message;
        elements.authError.classList.remove('hidden');
    }
}

function hideAuthError() {
    if (elements.authError) {
        elements.authError.classList.add('hidden');
    }
}

function showPasswordError(message) {
    if (elements.passwordError) {
        elements.passwordError.textContent = message;
        elements.passwordError.classList.remove('hidden');
    }
}

function hidePasswordError() {
    if (elements.passwordError) {
        elements.passwordError.classList.add('hidden');
    }
}

function showChangePasswordModal() {
    if (elements.changePasswordModal) {
        elements.changePasswordModal.classList.remove('hidden');
    }
}

function hideChangePasswordModal() {
    if (elements.changePasswordModal) {
        elements.changePasswordModal.classList.add('hidden');
        elements.changePasswordForm.reset();
    }
}

function clearAuthForms() {
    if (elements.authUsername) elements.authUsername.value = '';
    if (elements.authPassword) elements.authPassword.value = '';
    if (elements.changePasswordForm) elements.changePasswordForm.reset();
    hideAuthError();
    hidePasswordError();
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

        // Load acknowledged alerts before updating notifications
        await loadAcknowledgedAlerts();

        // Update stats and notifications
        updateStatistics();
        updateNotifications();

        // Setup contracts tables if needed (silent fail is OK)
        try {
            await api.setupContractsTables();
        } catch (e) {
            // Tables might already exist
        }

        // Setup tasks table if needed (silent fail is OK)
        try {
            await api.setupTasksTable();
        } catch (e) {
            // Table might already exist
        }

        // Setup acknowledged alerts table if needed (silent fail is OK)
        try {
            await api.setupAcknowledgedAlertsTable();
        } catch (e) {
            // Table might already exist
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

// Get unique alert key for a specific alert
function getAlertKey(alert) {
    // Combine type and field for uniqueness (e.g., "expired_nis", "missing_doc_NIS Certificate")
    return `${alert.type}_${alert.field || alert.doc_type || ''}`;
}

// Check if a specific alert is acknowledged
function isAlertAcknowledged(supplierId, alertKey) {
    // Use == for type coercion since supplier_id might be string from DB
    return state.acknowledgedAlerts.some(
        a => String(a.supplier_id) === String(supplierId) && a.alert_type === alertKey
    );
}

// Check if ALL alerts for a supplier are acknowledged
function isSupplierFullyAcknowledged(supplier) {
    const alertDetails = supplier.alert_details || [];
    if (alertDetails.length === 0) return false;
    return alertDetails.every(alert => isAlertAcknowledged(supplier.id, getAlertKey(alert)));
}

// Load acknowledged alerts from API
async function loadAcknowledgedAlerts() {
    try {
        const response = await api.getAcknowledgedAlerts();
        state.acknowledgedAlerts = response.acknowledged || [];
        console.log('Loaded acknowledged alerts:', state.acknowledgedAlerts);
    } catch (error) {
        console.error('Failed to load acknowledged alerts:', error);
        state.acknowledgedAlerts = [];
    }
}

function updateNotifications() {
    const alertSuppliers = state.suppliers.filter(s => s.alert_level !== null);

    // Count only unacknowledged alerts for badge
    const unacknowledgedCount = alertSuppliers.filter(s => !isSupplierFullyAcknowledged(s)).length;

    if (elements.notificationBadge) {
        elements.notificationBadge.textContent = unacknowledgedCount;
        elements.notificationBadge.classList.toggle('hidden', unacknowledgedCount === 0);
    }

    // Toggle bell shake animation when there are unacknowledged alerts
    if (elements.notificationBtn) {
        elements.notificationBtn.classList.toggle('has-alerts', unacknowledgedCount > 0);
    }

    if (elements.needsAttention) {
        elements.needsAttention.textContent = unacknowledgedCount;
    }

    if (elements.needsAttentionCard) {
        elements.needsAttentionCard.classList.toggle('no-alerts', unacknowledgedCount === 0);
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

    // Separate into new and acknowledged
    const newAlerts = alertSuppliers.filter(s => !isSupplierFullyAcknowledged(s));
    const acknowledgedAlerts = alertSuppliers.filter(s => isSupplierFullyAcknowledged(s));

    // Update counts
    const newCounts = {
        critical: newAlerts.filter(s => s.alert_level === 'critical').length,
        warning: newAlerts.filter(s => s.alert_level === 'warning').length,
        action_needed: newAlerts.filter(s => s.alert_level === 'action_needed').length
    };

    elements.notificationSummary.innerHTML = `
        ${newCounts.critical > 0 ? `<span class="summary-badge critical">${newCounts.critical} Expired</span>` : ''}
        ${newCounts.warning > 0 ? `<span class="summary-badge warning">${newCounts.warning} Expiring Soon</span>` : ''}
        ${newCounts.action_needed > 0 ? `<span class="summary-badge action-needed">${newCounts.action_needed} Incomplete</span>` : ''}
    `;

    // Update section counts
    const newCountEl = document.getElementById('new-alerts-count');
    const ackCountEl = document.getElementById('acknowledged-alerts-count');
    if (newCountEl) newCountEl.textContent = newAlerts.length;
    if (ackCountEl) ackCountEl.textContent = acknowledgedAlerts.length;

    // Render new alerts
    if (newAlerts.length === 0) {
        elements.notificationList.innerHTML = `
            <div class="notification-empty">
                <svg viewBox="0 0 24 24">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" stroke-width="2" fill="none"/>
                    <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" stroke-width="2" fill="none"/>
                </svg>
                <h4>All Clear!</h4>
                <p>No new alerts require attention.</p>
            </div>
        `;
    } else {
        elements.notificationList.innerHTML = newAlerts.map(supplier => renderNotificationItem(supplier, false)).join('');
    }

    // Render acknowledged alerts
    const acknowledgedList = document.getElementById('acknowledged-list');
    if (acknowledgedList) {
        if (acknowledgedAlerts.length === 0) {
            acknowledgedList.innerHTML = `<div class="notification-empty-small">No acknowledged alerts</div>`;
        } else {
            acknowledgedList.innerHTML = acknowledgedAlerts.map(supplier => renderNotificationItem(supplier, true)).join('');
        }

        // Update section visibility
        acknowledgedList.classList.toggle('hidden', !state.acknowledgedSectionOpen);
        const toggleIcon = document.querySelector('.section-toggle-icon');
        if (toggleIcon) {
            toggleIcon.style.transform = state.acknowledgedSectionOpen ? 'rotate(90deg)' : 'rotate(0deg)';
        }
    }
}

function renderNotificationItem(supplier, isAcknowledged) {
    const iconSvg = getAlertIcon(supplier.alert_level);
    const messages = (supplier.alert_details || []).map(alert =>
        `<span class="notification-message-item">• ${alert.message}</span>`
    ).join('');

    const acknowledgeBtn = isAcknowledged
        ? `<button class="notification-action-btn unack-btn" onclick="event.stopPropagation(); unacknowledgeSupplierAlerts(${supplier.id})" title="Mark as unread">
               <svg viewBox="0 0 24 24" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" fill="none"/></svg>
           </button>`
        : `<button class="notification-action-btn ack-btn" onclick="event.stopPropagation(); acknowledgeSupplierAlerts(${supplier.id})" title="Mark as read">
               <svg viewBox="0 0 24 24" width="16" height="16"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" stroke-width="2" fill="none"/><polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" stroke-width="2" fill="none"/></svg>
           </button>`;

    return `
        <div class="notification-item ${isAcknowledged ? 'acknowledged' : ''}" onclick="openSupplierFromNotification(${supplier.id})">
            <div class="notification-icon ${supplier.alert_level}">
                ${iconSvg}
            </div>
            <div class="notification-content">
                <div class="notification-supplier">${escapeHtml(supplier.name)}</div>
                <div class="notification-message">${messages}</div>
            </div>
            ${acknowledgeBtn}
        </div>
    `;
}

// Toggle acknowledged section visibility
window.toggleAcknowledgedSection = function() {
    state.acknowledgedSectionOpen = !state.acknowledgedSectionOpen;
    renderNotificationPanel();
};

// Acknowledge all alerts for a supplier
window.acknowledgeSupplierAlerts = async function(supplierId) {
    const supplier = state.suppliers.find(s => s.id === supplierId);
    console.log('Acknowledging alerts for supplier:', supplierId, supplier?.name, 'alerts:', supplier?.alert_details);
    if (!supplier || !supplier.alert_details) {
        console.log('No supplier or alert_details found');
        return;
    }

    try {
        // Acknowledge each alert for this supplier
        for (const alert of supplier.alert_details) {
            const alertKey = getAlertKey(alert);
            console.log('Acknowledging alert:', supplierId, alertKey);
            const response = await api.acknowledgeAlert(supplierId, alertKey);
            console.log('Acknowledge response:', response);
            // Add to local state
            if (!isAlertAcknowledged(supplierId, alertKey)) {
                state.acknowledgedAlerts.push({
                    supplier_id: supplierId,
                    alert_type: alertKey
                });
            }
        }
        console.log('Updated acknowledgedAlerts state:', state.acknowledgedAlerts);
        updateNotifications();
        showToast('Alert acknowledged', 'success');
    } catch (error) {
        console.error('Failed to acknowledge alert:', error);
        showToast('Failed to acknowledge alert', 'error');
    }
};

// Read all (acknowledge all) unacknowledged alerts
window.readAllAlerts = async function() {
    const unacknowledgedSuppliers = state.suppliers.filter(s => s.alert_level !== null && !isSupplierFullyAcknowledged(s));
    if (unacknowledgedSuppliers.length === 0) {
        showToast('No new alerts to mark as read', 'info');
        return;
    }

    try {
        for (const supplier of unacknowledgedSuppliers) {
            for (const alert of (supplier.alert_details || [])) {
                const alertKey = getAlertKey(alert);
                if (!isAlertAcknowledged(supplier.id, alertKey)) {
                    await api.acknowledgeAlert(supplier.id, alertKey);
                    state.acknowledgedAlerts.push({
                        supplier_id: supplier.id,
                        alert_type: alertKey
                    });
                }
            }
        }
        updateNotifications();
        showToast(`Marked ${unacknowledgedSuppliers.length} alert(s) as read`, 'success');
    } catch (error) {
        console.error('Failed to read all alerts:', error);
        showToast('Failed to mark all as read', 'error');
    }
};

// Unacknowledge all alerts for a supplier
window.unacknowledgeSupplierAlerts = async function(supplierId) {
    const supplier = state.suppliers.find(s => s.id === supplierId);
    if (!supplier || !supplier.alert_details) return;

    try {
        // Unacknowledge each alert for this supplier
        for (const alert of supplier.alert_details) {
            const alertKey = getAlertKey(alert);
            await api.unacknowledgeAlert(supplierId, alertKey);
        }
        // Remove from local state
        state.acknowledgedAlerts = state.acknowledgedAlerts.filter(a => a.supplier_id !== supplierId);
        updateNotifications();
        showToast('Alert marked as unread', 'success');
    } catch (error) {
        console.error('Failed to unacknowledge alert:', error);
        showToast('Failed to mark as unread', 'error');
    }
};

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

function closeSupplierModal(skipConfirm = false) {
    // Check if form has data and prompt for confirmation
    if (!skipConfirm && hasFormData(elements.supplierForm)) {
        if (!confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            return;
        }
    }
    elements.supplierModal.classList.add('hidden');
    elements.supplierForm?.reset();
    state.currentSupplier = null;
    state.isEditMode = false;
    state.pendingDocuments = {};
}

// Helper function to check if a form has any data entered
function hasFormData(form) {
    if (!form) return false;
    const inputs = form.querySelectorAll('input, textarea, select');
    for (const input of inputs) {
        if (input.type === 'hidden') continue;
        if (input.type === 'checkbox' || input.type === 'radio') {
            if (input.checked) return true;
        } else if (input.type === 'file') {
            if (input.files && input.files.length > 0) return true;
        } else if (input.value && input.value.trim() !== '') {
            // Skip default select values
            if (input.tagName === 'SELECT' && input.selectedIndex === 0) continue;
            return true;
        }
    }
    return false;
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

        const supplierName = elements.supplierName.value.trim();

        // Check for duplicate supplier name (case-insensitive)
        const currentSupplierId = state.isEditMode && elements.supplierId.value ? parseInt(elements.supplierId.value) : null;
        const duplicateSupplier = state.suppliers.find(s =>
            s.name.trim().toLowerCase() === supplierName.toLowerCase() &&
            s.id !== currentSupplierId
        );

        if (duplicateSupplier) {
            showToast(`A supplier with the name "${supplierName}" already exists. Please use a different name.`, 'error');
            submitBtn.disabled = false;
            spinner?.classList.add('hidden');
            if (btnText) btnText.textContent = state.isEditMode ? 'Update Supplier' : 'Add Supplier';
            return;
        }

        const supplierData = {
            name: supplierName,
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

        closeSupplierModal(true); // Skip confirmation since we just saved

        // If we were adding supplier from task modal, return to task modal with new supplier
        if (addingSupplierFromTask && taskModalFormData) {
            const newSupplierName = supplierName;

            // Re-open task modal
            elements.taskModal.classList.remove('hidden');

            // Restore form data
            if (elements.taskProjectCode) elements.taskProjectCode.value = taskModalFormData.projectCode;
            if (elements.taskTitle) elements.taskTitle.value = taskModalFormData.title;
            if (elements.taskBudgetAmount) elements.taskBudgetAmount.value = taskModalFormData.budgetAmount;
            if (elements.taskContractSum) elements.taskContractSum.value = taskModalFormData.contractSum;
            if (elements.taskAssignedPerson) elements.taskAssignedPerson.value = taskModalFormData.assignedPerson;
            if (elements.taskPriority) elements.taskPriority.value = taskModalFormData.priority;
            if (elements.taskStartDate) elements.taskStartDate.value = taskModalFormData.startDate;
            if (elements.taskEndDate) elements.taskEndDate.value = taskModalFormData.endDate;
            if (elements.taskExpectedCompletion) elements.taskExpectedCompletion.value = taskModalFormData.expectedCompletionDate;
            if (elements.taskRemarks) elements.taskRemarks.value = taskModalFormData.remarks;
            if (elements.taskRequiresContract) elements.taskRequiresContract.checked = taskModalFormData.requiresContract;
            if (elements.taskSingleSource) elements.taskSingleSource.checked = taskModalFormData.singleSource;
            if (elements.taskLinkedContract) elements.taskLinkedContract.value = taskModalFormData.linkedContractId;
            if (elements.taskApprover) elements.taskApprover.value = taskModalFormData.approver;
            if (elements.taskAwardNumber) elements.taskAwardNumber.value = taskModalFormData.awardNumber;

            // Trigger budget change to update tier if needed
            if (taskModalFormData.budgetAmount) {
                handleBudgetChange();
            }

            // Repopulate contractor dropdown and select the new supplier
            await populateContractorDropdown(newSupplierName);

            // Reset state
            addingSupplierFromTask = false;
            taskModalFormData = null;

            showToast(`Supplier "${newSupplierName}" added and selected`);
        }

    } catch (error) {
        showToast(error.message || 'Failed to save supplier', 'error');
        // Reset state on error too
        addingSupplierFromTask = false;
        taskModalFormData = null;
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

function closeContractModal(skipConfirm = false) {
    // Check if form has data and prompt for confirmation
    if (!skipConfirm && hasFormData(elements.contractForm)) {
        if (!confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            return;
        }
    }
    elements.contractModal?.classList.add('hidden');
    elements.contractForm?.reset();
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
        closeContractModal(true); // Skip confirmation since we just saved

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

// ==================== OUTSTANDING TASKS MODULE ====================

async function loadTasks() {
    showTasksLoading(true);

    try {
        const filters = {
            archived: state.taskFilters.archived === 'all' ? undefined : (state.taskFilters.archived === 'archived'),
            procurement_status: state.taskFilters.status || undefined
            // Note: assigned_person filter is now done client-side for partial matching
        };

        state.tasks = await api.getTasks(filters);
        renderTasks();
        updateTaskStatistics();
    } catch (error) {
        console.error('Failed to load tasks:', error);
        showToast('Failed to load tasks', 'error');
    } finally {
        showTasksLoading(false);
    }
}

function renderTasks() {
    const listBody = elements.tasksListBody;

    // Apply client-side filters
    let filteredTasks = state.tasks;

    // Filter by search term (matches title, project code, contractor, assigned person)
    const searchFilter = state.taskFilters.search?.trim().toLowerCase();
    if (searchFilter) {
        filteredTasks = filteredTasks.filter(task => {
            const title = (task.title || '').toLowerCase();
            const projectCode = (task.project_code || '').toLowerCase();
            const contractor = (task.contractor_supplier || '').toLowerCase();
            const assigned = (task.assigned_person || '').toLowerCase();
            return title.includes(searchFilter) ||
                   projectCode.includes(searchFilter) ||
                   contractor.includes(searchFilter) ||
                   assigned.includes(searchFilter);
        });
    }

    // Filter by assigned person (from sidebar filter)
    const assignedFilter = state.taskFilters.assigned_person?.trim().toLowerCase();
    if (assignedFilter) {
        filteredTasks = filteredTasks.filter(task => {
            const assignedTo = (task.assigned_person || '').toLowerCase();
            return assignedTo.includes(assignedFilter);
        });
    }

    // Apply column filters
    if (columnFilters.priority) {
        filteredTasks = filteredTasks.filter(task => {
            const taskPriority = task.priority || 'Normal';
            return taskPriority === columnFilters.priority;
        });
    }
    if (columnFilters.status) {
        filteredTasks = filteredTasks.filter(task => {
            const isSingleSource = task.single_source_procurement === 1;
            const tier = isSingleSource ? PROCUREMENT_TIERS.SINGLE_SOURCE
                : (task.budget_amount ? getProcurementTier(task.budget_amount) : null);
            const stages = tier ? getTierStages(tier, task.requires_contract === 1) : [];
            let completedStages = [];
            let naStages = [];
            try {
                completedStages = JSON.parse(task.completed_stages || '[]');
            } catch (e) {
                completedStages = [];
            }
            try {
                naStages = JSON.parse(task.na_stages || '[]');
            } catch (e) {
                naStages = [];
            }
            const applicableStagesCount = stages.length - naStages.length;
            const progress = calculateProgress(completedStages, applicableStagesCount);
            const status = progress === 100 ? 'Complete' : progress > 0 ? 'In Progress' : 'Not Started';
            return status === columnFilters.status;
        });
    }
    if (columnFilters.assigned) {
        filteredTasks = filteredTasks.filter(task => {
            const assignedPerson = task.assigned_person?.trim() || '';
            return assignedPerson === columnFilters.assigned;
        });
    }

    // Apply sorting
    filteredTasks = sortTasks(filteredTasks);

    if (!filteredTasks || filteredTasks.length === 0) {
        // Show empty state but keep the list container visible for filter controls
        elements.tasksEmptyState.classList.remove('hidden');
        // Keep the container visible so filter buttons remain accessible
        elements.tasksListContainer?.classList.remove('hidden');
        listBody.innerHTML = ''; // Clear the task rows but keep header
        return;
    }

    elements.tasksEmptyState.classList.add('hidden');
    elements.tasksListContainer?.classList.remove('hidden');

    listBody.innerHTML = filteredTasks.map(task => createTaskRow(task)).join('');
}

function createTaskRow(task) {
    // Use Single Source tier if single_source_procurement is checked, otherwise determine by budget
    const isSingleSource = task.single_source_procurement === 1;
    const tier = isSingleSource ? PROCUREMENT_TIERS.SINGLE_SOURCE
        : (task.budget_amount ? getProcurementTier(task.budget_amount) : null);

    // Parse completed stages
    let completedStages = [];
    try {
        completedStages = JSON.parse(task.completed_stages || '[]');
    } catch (e) {
        completedStages = [];
    }

    // Parse N/A stages
    let naStages = [];
    try {
        naStages = JSON.parse(task.na_stages || '[]');
    } catch (e) {
        naStages = [];
    }

    // Calculate progress (excluding N/A stages from total)
    const stages = tier ? getTierStages(tier, task.requires_contract === 1) : [];
    const applicableStagesCount = stages.length - naStages.length;
    const progress = calculateProgress(completedStages, applicableStagesCount);
    const progressClass = progress === 100 ? 'progress-complete' : progress >= 70 ? 'progress-high' : progress >= 40 ? 'progress-medium' : 'progress-low';

    // Format dates
    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };
    const startDate = formatDate(task.start_date);
    const dueDate = formatDate(task.end_date);

    // Check if overdue
    const isOverdue = task.end_date && new Date(task.end_date) < new Date() && progress < 100;

    // Priority styling
    const priority = task.priority || 'Normal';
    const priorityClass = `priority-${priority.toLowerCase()}`;
    const priorityHtml = `
        <div class="clickup-priority ${priorityClass}">
            <svg class="priority-flag" viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" stroke-width="2"/></svg>
            ${escapeHtml(priority)}
        </div>
    `;

    // Status badge
    const status = progress === 100 ? 'Complete' : progress > 0 ? 'In Progress' : 'Not Started';
    const statusClass = progress === 100 ? 'status-complete' : progress > 0 ? 'status-in-progress' : 'status-not-started';
    const statusHtml = `<span class="clickup-status ${statusClass}">${status}</span>`;

    // Build subtasks HTML (filter out N/A stages or show them as N/A)
    const subtasksHtml = stages.map(stage => {
        const isCompleted = completedStages.includes(stage.id);
        const isNA = naStages.includes(stage.id);

        // If stage is N/A, show it differently (muted with N/A label)
        if (isNA) {
            return `
                <div class="clickup-subtask subtask-na">
                    <span class="stage-name na-text">${escapeHtml(stage.name)}</span>
                    <span class="na-badge">N/A</span>
                </div>
            `;
        }

        return `
            <div class="clickup-subtask">
                <label class="stage-checkbox" onclick="event.stopPropagation()">
                    <input type="checkbox" ${isCompleted ? 'checked' : ''}
                           onchange="handleStageToggle(${task.id}, '${stage.id}', this.checked)">
                    <span class="checkbox-custom"></span>
                    <span class="stage-name">${escapeHtml(stage.name)}</span>
                    ${stage.requiresAward ? '<span class="stage-requires-award">(Award)</span>' : ''}
                    ${stage.requiresContract ? '<span class="stage-requires-contract">(Contract)</span>' : ''}
                </label>
            </div>
        `;
    }).join('');

    return `
        <div class="clickup-task-row" data-task-id="${task.id}">
            <div class="clickup-task-main" onclick="handleTaskView(${task.id})">
                <div onclick="event.stopPropagation()">
                    <button class="clickup-expand-btn" onclick="toggleTaskExpand(${task.id})">
                        <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" fill="none"/></svg>
                    </button>
                </div>
                <div class="clickup-task-name">
                    ${escapeHtml(task.title || '-')}
                    ${task.project_code ? `<span class="task-code">${escapeHtml(task.project_code)}</span>` : ''}
                    ${task.archived ? '<span class="badge badge-archived" style="margin-left:0.5rem;">Archived</span>' : ''}
                </div>
                <div class="clickup-task-date">${startDate}</div>
                <div class="clickup-task-date ${isOverdue ? 'overdue' : ''}">${dueDate}</div>
                <div class="clickup-task-assigned">${escapeHtml(task.assigned_person || '-')}</div>
                <div>${priorityHtml}</div>
                <div>${statusHtml}</div>
                <div class="clickup-progress">
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill ${progressClass}" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text">${progress}%</span>
                </div>
            </div>
            <div class="clickup-subtasks">
                ${subtasksHtml}
                <div class="task-suppliers-list" id="task-suppliers-${task.id}" data-loaded="false"></div>
            </div>
        </div>
    `;
}

// Toggle task row expand/collapse
async function toggleTaskExpand(taskId) {
    const row = document.querySelector(`.clickup-task-row[data-task-id="${taskId}"]`);
    if (row) {
        const isExpanding = !row.classList.contains('expanded');
        row.classList.toggle('expanded');

        // Load suppliers when expanding if not already loaded
        if (isExpanding) {
            const suppliersContainer = document.getElementById(`task-suppliers-${taskId}`);
            if (suppliersContainer && suppliersContainer.dataset.loaded === 'false') {
                suppliersContainer.dataset.loaded = 'true';
                await loadAndDisplayTaskSuppliers(taskId, suppliersContainer);
            }
        }
    }
}

// Load and display suppliers in the expanded task row
async function loadAndDisplayTaskSuppliers(taskId, container) {
    try {
        const suppliers = await loadTaskSuppliers(taskId);
        if (suppliers.length === 0) {
            container.innerHTML = '';
            return;
        }

        const suppliersHtml = suppliers.map(s => `
            <div class="task-supplier-item">
                <span class="supplier-name">${escapeHtml(s.supplier_name)}</span>
                <span class="supplier-amount">G$${formatCurrency(s.amount)}</span>
                ${s.notes ? `<span class="supplier-notes">(${escapeHtml(s.notes)})</span>` : ''}
            </div>
        `).join('');

        container.innerHTML = `
            <h5>Supplier Allocations</h5>
            ${suppliersHtml}
        `;
    } catch (error) {
        console.error('Failed to load task suppliers:', error);
    }
}

// Handle stage checkbox toggle
async function handleStageToggle(taskId, stageId, isChecked) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    // Get the tier and stages for this task (check for single source first)
    const isSingleSource = task.single_source_procurement === 1;
    const tier = isSingleSource ? PROCUREMENT_TIERS.SINGLE_SOURCE
        : (task.budget_amount ? getProcurementTier(task.budget_amount) : null);
    const stages = tier ? getTierStages(tier, task.requires_contract === 1) : [];

    // Parse N/A stages to exclude them from auto-check
    let naStages = [];
    try {
        naStages = JSON.parse(task.na_stages || '[]');
    } catch (e) {
        naStages = [];
    }

    // Find the index of the clicked stage
    const clickedStageIndex = stages.findIndex(s => s.id === stageId);

    // Parse current completed stages
    let completedStages = [];
    try {
        completedStages = JSON.parse(task.completed_stages || '[]');
    } catch (e) {
        completedStages = [];
    }

    // Update completed stages
    if (isChecked) {
        // Auto-check all previous stages when checking a stage (skip N/A stages)
        for (let i = 0; i <= clickedStageIndex; i++) {
            // Skip N/A stages - they shouldn't be auto-checked
            if (naStages.includes(stages[i].id)) continue;
            if (!completedStages.includes(stages[i].id)) {
                completedStages.push(stages[i].id);
            }
        }
    } else {
        // When unchecking, only uncheck this stage (user might want to track partial progress)
        completedStages = completedStages.filter(id => id !== stageId);
    }

    // Check if all non-N/A stages are now complete (for auto-archive)
    const applicableStages = stages.filter(s => !naStages.includes(s.id));
    const completedApplicableStages = completedStages.filter(id => !naStages.includes(id));
    const allStagesComplete = applicableStages.length > 0 &&
                               completedApplicableStages.length === applicableStages.length;

    // Determine if we should auto-archive (only if not already archived)
    const shouldAutoArchive = allStagesComplete && !task.archived;

    try {
        // Send full task data with updated completed_stages
        const updatedTaskData = {
            project_code: task.project_code || null,
            title: task.title,
            budget_amount: task.budget_amount || null,
            procurement_tier: task.procurement_tier || null,
            completed_stages: JSON.stringify(completedStages),
            na_stages: task.na_stages || '[]',
            requires_contract: task.requires_contract || 0,
            single_source_procurement: task.single_source_procurement || 0,
            linked_contract_id: task.linked_contract_id || null,
            approver: task.approver || null,
            award_number: task.award_number || null,
            award_document_r2_key: task.award_document_r2_key || null,
            contractor_supplier: task.contractor_supplier || null,
            contract_sum: task.contract_sum || null,
            assigned_person: task.assigned_person || null,
            priority: task.priority || 'Normal',
            remarks: task.remarks || null,
            start_date: task.start_date || null,
            end_date: task.end_date || null,
            expected_completion_date: task.expected_completion_date || null,
            archived: shouldAutoArchive ? 1 : (task.archived || 0)
        };

        await api.updateTask(taskId, updatedTaskData);

        // Update local state
        task.completed_stages = JSON.stringify(completedStages);
        if (shouldAutoArchive) {
            task.archived = 1;
            showToast('✅ Task completed and automatically archived!', 'success');
        }

        // Re-render to update progress but keep the row expanded
        renderTasksKeepExpanded(taskId);
        updateTaskStatistics();
    } catch (error) {
        console.error('Failed to update stage:', error);
        showToast('Failed to update stage', 'error');
        // Reload tasks to sync state
        loadTasks();
    }
}

// Render tasks but keep a specific task row expanded
function renderTasksKeepExpanded(expandedTaskId) {
    const listBody = elements.tasksListBody;

    // Apply client-side filters
    let filteredTasks = state.tasks;

    // Filter by search term
    const searchFilter = state.taskFilters.search?.trim().toLowerCase();
    if (searchFilter) {
        filteredTasks = filteredTasks.filter(task => {
            const title = (task.title || '').toLowerCase();
            const projectCode = (task.project_code || '').toLowerCase();
            const contractor = (task.contractor_supplier || '').toLowerCase();
            const assigned = (task.assigned_person || '').toLowerCase();
            return title.includes(searchFilter) ||
                   projectCode.includes(searchFilter) ||
                   contractor.includes(searchFilter) ||
                   assigned.includes(searchFilter);
        });
    }

    // Filter by assigned person (from sidebar filter)
    const assignedFilter = state.taskFilters.assigned_person?.trim().toLowerCase();
    if (assignedFilter) {
        filteredTasks = filteredTasks.filter(task => {
            const assignedTo = (task.assigned_person || '').toLowerCase();
            return assignedTo.includes(assignedFilter);
        });
    }

    // Apply column filters
    if (columnFilters.priority) {
        filteredTasks = filteredTasks.filter(task => {
            const taskPriority = task.priority || 'Normal';
            return taskPriority === columnFilters.priority;
        });
    }
    if (columnFilters.status) {
        filteredTasks = filteredTasks.filter(task => {
            const isSingleSource = task.single_source_procurement === 1;
            const tier = isSingleSource ? PROCUREMENT_TIERS.SINGLE_SOURCE
                : (task.budget_amount ? getProcurementTier(task.budget_amount) : null);
            const stages = tier ? getTierStages(tier, task.requires_contract === 1) : [];
            let completedStages = [];
            let naStages = [];
            try {
                completedStages = JSON.parse(task.completed_stages || '[]');
            } catch (e) {
                completedStages = [];
            }
            try {
                naStages = JSON.parse(task.na_stages || '[]');
            } catch (e) {
                naStages = [];
            }
            const applicableStagesCount = stages.length - naStages.length;
            const progress = calculateProgress(completedStages, applicableStagesCount);
            const status = progress === 100 ? 'Complete' : progress > 0 ? 'In Progress' : 'Not Started';
            return status === columnFilters.status;
        });
    }
    if (columnFilters.assigned) {
        filteredTasks = filteredTasks.filter(task => {
            const assignedPerson = task.assigned_person?.trim() || '';
            return assignedPerson === columnFilters.assigned;
        });
    }

    // Apply sorting
    filteredTasks = sortTasks(filteredTasks);

    if (!filteredTasks || filteredTasks.length === 0) {
        // Show empty state but keep the list container visible for filter controls
        elements.tasksEmptyState.classList.remove('hidden');
        elements.tasksListContainer?.classList.remove('hidden');
        listBody.innerHTML = ''; // Clear the task rows but keep header
        return;
    }

    elements.tasksEmptyState.classList.add('hidden');
    elements.tasksListContainer?.classList.remove('hidden');

    listBody.innerHTML = filteredTasks.map(task => createTaskRow(task)).join('');

    // Re-expand the task that was expanded before
    if (expandedTaskId) {
        const row = document.querySelector(`.clickup-task-row[data-task-id="${expandedTaskId}"]`);
        if (row) {
            row.classList.add('expanded');
        }
    }
}

async function openTaskModal(task = null) {
    state.currentTask = task;
    state.isTaskEditMode = !!task;

    elements.taskModalTitle.textContent = task ? 'Edit Procurement Item' : 'Add Procurement Item';

    // Reset conditional sections
    elements.awardDetailsSection?.classList.add('hidden');
    elements.contractLinkSection?.classList.add('hidden');

    // Populate contractor dropdown with suppliers from database
    await populateContractorDropdown(task?.contractor_supplier || '');

    // Populate contract dropdown
    await populateContractDropdown(task?.linked_contract_id || null);

    if (task) {
        elements.taskId.value = task.id;
        elements.taskProjectCode.value = task.project_code || '';
        elements.taskTitle.value = task.title || '';
        elements.taskBudgetAmount.value = task.budget_amount || '';
        elements.taskAssignedPerson.value = task.assigned_person || '';
        elements.taskPriority.value = task.priority || 'Normal';
        elements.taskContractSum.value = task.contract_sum || '';
        elements.taskRequiresContract.checked = task.requires_contract === 1;
        if (elements.taskSingleSource) {
            elements.taskSingleSource.checked = task.single_source_procurement === 1;
        }
        elements.taskApprover.value = task.approver || '';
        elements.taskAwardNumber.value = task.award_number || '';
        elements.taskStartDate.value = task.start_date || '';
        elements.taskEndDate.value = task.end_date || '';
        elements.taskExpectedCompletion.value = task.expected_completion_date || '';
        elements.taskRemarks.value = task.remarks || '';

        // Show award document name if exists
        const uploadBox = elements.taskAwardDocument?.closest('.file-upload-box');
        if (task.award_document_r2_key) {
            const fileName = task.award_document_r2_key.split('/').pop();
            elements.awardDocumentName.textContent = fileName;
            uploadBox?.classList.add('has-file');
        } else {
            elements.awardDocumentName.textContent = 'Click to upload PDF';
            uploadBox?.classList.remove('has-file');
        }

        // Show contract link section if requires contract
        if (task.requires_contract === 1) {
            elements.contractLinkSection?.classList.remove('hidden');
        }

        // Trigger budget change to render stages
        handleBudgetChange();

        // Parse and set completed stages
        let completedStages = [];
        try {
            completedStages = JSON.parse(task.completed_stages || '[]');
        } catch (e) {
            completedStages = [];
        }

        // Mark completed stages in UI
        setTimeout(() => {
            completedStages.forEach(stageId => {
                const checkbox = document.querySelector(`#workflow-stages-container input[data-stage-id="${stageId}"]`);
                if (checkbox) checkbox.checked = true;
            });
            updateAwardDetailsVisibility();
        }, 100);

        // Load task suppliers for multi-supplier split
        resetSupplierModal();
        const suppliers = await loadTaskSuppliers(task.id);
        if (suppliers.length > 0) {
            // Enable multi-supplier mode
            document.getElementById('enable-multi-supplier').checked = true;
            document.getElementById('multi-supplier-container')?.classList.remove('hidden');
            document.getElementById('contractor-single-section')?.classList.add('hidden');
            updateSupplierBudgetDisplay();

            // Create rows for each saved supplier
            let rowNum = 1;
            for (const s of suppliers) {
                createSupplierRowSync(rowNum++, s);
            }
            updateSupplierSum();
        }
    } else {
        elements.taskForm.reset();
        elements.taskId.value = '';
        elements.awardDocumentName.textContent = 'Click to upload PDF';

        // Reset upload box state
        const uploadBox = elements.taskAwardDocument?.closest('.file-upload-box');
        uploadBox?.classList.remove('has-file');

        // Reset workflow stages
        renderWorkflowPlaceholder();

        // Reset tier badge
        if (elements.tierBadge) {
            elements.tierBadge.textContent = 'Enter budget to determine tier';
            elements.tierBadge.className = 'tier-badge';
        }

        // Reset multi-supplier section
        resetSupplierModal();
    }

    elements.taskModal.classList.remove('hidden');
}

// Render placeholder for workflow stages
function renderWorkflowPlaceholder() {
    if (!elements.workflowStagesContainer) return;
    elements.workflowStagesContainer.innerHTML = `
        <div class="workflow-placeholder">
            <svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 2v20M2 12h20" stroke="currentColor" stroke-width="2" fill="none" opacity="0.3"/></svg>
            <span>Enter a budget amount to see workflow stages</span>
        </div>
    `;
}

// Handle budget amount change - determine tier and render stages
function handleBudgetChange() {
    const budgetAmount = parseFloat(elements.taskBudgetAmount?.value) || 0;
    const isSingleSource = elements.taskSingleSource?.checked || false;

    if (budgetAmount <= 0) {
        renderWorkflowPlaceholder();
        if (elements.tierBadge) {
            elements.tierBadge.textContent = 'Enter budget to determine tier';
            elements.tierBadge.className = 'tier-badge';
        }
        return;
    }

    // Use Single Source tier if checkbox is checked, otherwise determine by budget
    const tier = isSingleSource ? PROCUREMENT_TIERS.SINGLE_SOURCE : getProcurementTier(budgetAmount);
    const requiresContract = elements.taskRequiresContract?.checked || false;

    // Update tier badge
    if (elements.tierBadge) {
        elements.tierBadge.textContent = tier.name;
        elements.tierBadge.className = `tier-badge tier-${tier.id.replace(/_/g, '-')}`;
    }

    // Render workflow stages
    renderWorkflowStages(tier, requiresContract);

    // Update supplier budget display if multi-supplier is enabled
    updateSupplierBudgetDisplay();
}

// Handle contract toggle
function handleContractToggle() {
    const requiresContract = elements.taskRequiresContract?.checked || false;

    if (requiresContract) {
        elements.contractLinkSection?.classList.remove('hidden');
    } else {
        elements.contractLinkSection?.classList.add('hidden');
    }

    // Re-render workflow stages to include/exclude contract stage
    handleBudgetChange();
}

// ==================== Multi-Supplier Split Functions ====================

// Track suppliers in modal
let modalSuppliers = [];
let supplierIdCounter = 0;

// Toggle multi-supplier mode - exposed globally for inline handler
window.toggleMultiSupplier = function() {
    try {
        console.log('toggleMultiSupplier START');
        const checkbox = document.getElementById('enable-multi-supplier');
        const isEnabled = checkbox ? checkbox.checked : false;
        const container = document.getElementById('multi-supplier-container');
        const contractorSection = document.getElementById('contractor-single-section');

        console.log('isEnabled:', isEnabled, 'container:', !!container, 'contractorSection:', !!contractorSection);

        if (!container || !contractorSection) {
            console.error('Missing elements!');
            return;
        }

        if (isEnabled) {
            console.log('Enabling multi-supplier mode');
            contractorSection.classList.add('hidden');
            container.classList.remove('hidden');

            // Create supplier rows synchronously
            initializeSupplierRows();
            updateSupplierBudgetDisplay();
        } else {
            console.log('Disabling multi-supplier mode');
            contractorSection.classList.remove('hidden');
            container.classList.add('hidden');
        }
        console.log('toggleMultiSupplier END');
    } catch (error) {
        console.error('Error in toggleMultiSupplier:', error);
    }
};

// Initialize supplier rows - creates 4 empty rows (SYNCHRONOUS)
// Only creates rows if modalSuppliers is empty (prevents overwriting loaded data)
function initializeSupplierRows() {
    try {
        console.log('initializeSupplierRows START');
        const supplierList = document.getElementById('split-supplier-list');

        if (!supplierList) {
            console.error('split-supplier-list element not found!');
            return;
        }

        // If we already have suppliers loaded (from editing existing task), don't overwrite
        if (modalSuppliers.length > 0) {
            console.log('Suppliers already loaded, skipping initialization');
            updateSupplierSum();
            return;
        }

        // Clear existing DOM rows
        supplierList.innerHTML = '';
        modalSuppliers = [];

        console.log('state.suppliers count:', state.suppliers ? state.suppliers.length : 'undefined');

        if (!state.suppliers || state.suppliers.length === 0) {
            console.error('No suppliers in state!');
            supplierList.innerHTML = '<p style="color:red;">No suppliers loaded. Please refresh.</p>';
            return;
        }

        // Create 4 empty supplier rows
        for (let i = 1; i <= 4; i++) {
            console.log('Creating row', i);
            createSupplierRowSync(i);
        }

        console.log('Created', modalSuppliers.length, 'rows');
        console.log('supplierList children:', supplierList.children.length);
        updateSupplierSum();
        console.log('initializeSupplierRows END');
    } catch (error) {
        console.error('Error in initializeSupplierRows:', error);
    }
}

// Create a supplier row synchronously (suppliers already loaded)
function createSupplierRowSync(rowNum, supplierData = null) {
    console.log('createSupplierRowSync called with rowNum:', rowNum);
    const supplierList = document.getElementById('split-supplier-list');
    if (!supplierList) {
        console.error('split-supplier-list not found in createSupplierRowSync');
        return;
    }

    const tempId = `row_${rowNum}`;
    const supplier = {
        tempId: tempId,
        id: supplierData?.id || null,
        supplier_name: supplierData?.supplier_name || '',
        amount: supplierData?.amount || 0,
        notes: supplierData?.notes || ''
    };
    modalSuppliers.push(supplier);
    console.log('Added to modalSuppliers:', tempId);

    // Sort suppliers alphabetically
    const sortedSuppliers = [...(state.suppliers || [])].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    console.log('sortedSuppliers count:', sortedSuppliers.length);

    // Build datalist options for searchable input
    let datalistOptionsHtml = '';
    for (const s of sortedSuppliers) {
        const name = s.name || '';
        const escaped = escapeHtml(name);
        datalistOptionsHtml += `<option value="${escaped}">`;
    }

    const row = document.createElement('div');
    row.className = 'supplier-row';
    row.id = `supplier-row-${tempId}`;

    row.innerHTML = `
        <div class="supplier-search-container">
            <input type="text" class="supplier-search-input" list="supplier-list-${tempId}"
                   placeholder="Type to search suppliers..."
                   value="${escapeHtml(supplier.supplier_name || '')}"
                   oninput="window.onSupplierSearchInput('${tempId}', this.value)"
                   onchange="window.onSupplierChange('${tempId}', this.value)">
            <datalist id="supplier-list-${tempId}">
                ${datalistOptionsHtml}
            </datalist>
        </div>
        <input type="number" class="supplier-amount" placeholder="Amount" step="0.01" min="0"
               value="${supplier.amount || ''}"
               oninput="window.onSupplierAmountChange('${tempId}', this.value)">
        <input type="text" class="supplier-notes" placeholder="Notes (optional)"
               value="${escapeHtml(supplier.notes || '')}"
               onchange="window.onSupplierNotesChange('${tempId}', this.value)">
        <button type="button" class="remove-supplier-btn" onclick="window.removeSupplierRow('${tempId}')" title="Remove supplier">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M6 18L18 6M6 6l12 12" stroke="currentColor" stroke-width="2" fill="none"/></svg>
        </button>
    `;

    supplierList.appendChild(row);
    console.log('Row appended:', tempId, 'supplierList children:', supplierList.children.length);
}

// Global event handlers for supplier rows

// Check for duplicate supplier
function checkDuplicateSupplier(tempId, supplierName) {
    if (!supplierName?.trim()) return false;

    // Check if this supplier is already selected in another row
    const duplicate = modalSuppliers.find(s =>
        s.tempId !== tempId &&
        s.supplier_name?.trim().toLowerCase() === supplierName.trim().toLowerCase()
    );

    return !!duplicate;
}

window.onSupplierSearchInput = function(tempId, value) {
    // This is called on every keystroke for real-time feedback
    const supplier = modalSuppliers.find(s => s.tempId === tempId);
    if (supplier) {
        supplier.supplier_name = value;
    }
};

window.onSupplierChange = function(tempId, value) {
    console.log('onSupplierChange:', tempId, value);

    // Check for duplicate supplier
    if (checkDuplicateSupplier(tempId, value)) {
        showToast(`"${value}" is already added. Please select a different supplier.`, 'error');

        // Clear the input and reset the supplier name
        const row = document.getElementById(`supplier-row-${tempId}`);
        const input = row?.querySelector('.supplier-search-input');
        if (input) {
            input.value = '';
        }

        const supplier = modalSuppliers.find(s => s.tempId === tempId);
        if (supplier) {
            supplier.supplier_name = '';
        }
        return;
    }

    const supplier = modalSuppliers.find(s => s.tempId === tempId);
    if (supplier) {
        supplier.supplier_name = value;
    }
};

window.onSupplierAmountChange = function(tempId, value) {
    console.log('onSupplierAmountChange:', tempId, value);
    const supplier = modalSuppliers.find(s => s.tempId === tempId);
    if (supplier) {
        supplier.amount = parseFloat(value) || 0;
    }
    updateSupplierSum();
};

window.onSupplierNotesChange = function(tempId, value) {
    const supplier = modalSuppliers.find(s => s.tempId === tempId);
    if (supplier) {
        supplier.notes = value;
    }
};

// Add another supplier row
window.addSupplierRow = function() {
    // Use already-loaded suppliers from state
    if (!state.suppliers || state.suppliers.length === 0) {
        console.error('No suppliers loaded');
        showToast('Suppliers not loaded. Please refresh the page.', 'error');
        return;
    }

    const nextRowNum = modalSuppliers.length + 1;
    createSupplierRowSync(nextRowNum);
    updateSupplierSum();
};

function updateSupplierData(tempId, field, value) {
    console.log('updateSupplierData called:', tempId, field, value);
    let supplier = modalSuppliers.find(s => s.tempId === tempId);

    // If supplier doesn't exist in array, create it (handles static row case)
    if (!supplier) {
        console.log('Creating new supplier entry for tempId:', tempId);
        supplier = {
            tempId: tempId,
            id: null,
            supplier_name: '',
            amount: 0,
            notes: ''
        };
        modalSuppliers.push(supplier);
    }

    if (field === 'amount') {
        supplier[field] = parseFloat(value) || 0;
    } else {
        supplier[field] = value;
    }

    console.log('Updated supplier:', supplier);
    console.log('modalSuppliers:', modalSuppliers);
    updateSupplierSum();
}

function removeSupplierRow(tempId) {
    modalSuppliers = modalSuppliers.filter(s => s.tempId !== tempId);
    const row = document.getElementById(`supplier-row-${tempId}`);
    if (row) row.remove();
    updateSupplierSum();
}

function updateSupplierBudgetDisplay() {
    const budgetAmount = parseFloat(document.getElementById('task-budget-amount')?.value) || 0;
    const budgetDisplay = document.getElementById('supplier-budget-display');
    if (budgetDisplay) {
        budgetDisplay.textContent = `G$${budgetAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    updateSupplierSum();
}

function updateSupplierSum() {
    const sum = modalSuppliers.reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0);
    const sumDisplay = document.getElementById('supplier-sum-display');
    const balanceDisplay = document.getElementById('supplier-balance');
    const budgetAmount = parseFloat(document.getElementById('task-budget-amount')?.value) || 0;

    if (sumDisplay) {
        sumDisplay.textContent = `G$${sum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    if (balanceDisplay) {
        const diff = Math.abs(budgetAmount - sum);
        if (diff < 0.01) {
            // Valid state - split total equals awarded total
            balanceDisplay.textContent = 'Balanced ✓';
            balanceDisplay.className = 'supplier-balance balanced valid';
        } else if (sum > budgetAmount) {
            // Error state - split total exceeds awarded total
            balanceDisplay.textContent = `Over by G$${(sum - budgetAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            balanceDisplay.className = 'supplier-balance unbalanced error';
        } else {
            // Warning state - split total less than awarded total
            balanceDisplay.textContent = `Remaining: G$${(budgetAmount - sum).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            balanceDisplay.className = 'supplier-balance unbalanced warning';
        }
    }
}

// Check if split supplier amounts are valid (equals budget total)
function isSplitSupplierValid() {
    const isEnabled = document.getElementById('enable-multi-supplier')?.checked;
    if (!isEnabled) return true; // Not in split mode, always valid

    const sum = modalSuppliers.reduce((acc, s) => acc + (parseFloat(s.amount) || 0), 0);
    const budgetAmount = parseFloat(document.getElementById('task-budget-amount')?.value) || 0;
    const diff = Math.abs(budgetAmount - sum);

    return diff < 0.01; // Valid if difference is less than 1 cent
}

function resetSupplierModal() {
    modalSuppliers = [];
    supplierIdCounter = 0;
    const supplierList = document.getElementById('split-supplier-list');
    if (supplierList) supplierList.innerHTML = '';
    const enableCheckbox = document.getElementById('enable-multi-supplier');
    if (enableCheckbox) enableCheckbox.checked = false;
    const container = document.getElementById('multi-supplier-container');
    if (container) container.classList.add('hidden');
    // Show single contractor section when resetting
    const contractorSection = document.getElementById('contractor-single-section');
    if (contractorSection) contractorSection.classList.remove('hidden');
}

async function loadTaskSuppliers(taskId) {
    try {
        const suppliers = await api.getTaskSuppliers(taskId);
        return suppliers || [];
    } catch (error) {
        console.error('Failed to load task suppliers:', error);
    }
    return [];
}

async function saveTaskSuppliers(taskId) {
    console.log('saveTaskSuppliers called for taskId:', taskId);
    console.log('modalSuppliers at save time:', JSON.stringify(modalSuppliers));

    const checkbox = document.getElementById('enable-multi-supplier');
    const isEnabled = checkbox?.checked;
    console.log('enable-multi-supplier checkbox:', checkbox, 'checked:', isEnabled);

    if (!isEnabled) {
        // If multi-supplier is disabled, clear all suppliers for this task
        console.log('Multi-supplier disabled, clearing suppliers');
        try {
            await api.saveTaskSuppliers(taskId, []);
        } catch (e) {
            console.log('No suppliers to clear');
        }
        return;
    }

    // Filter out empty rows (no supplier selected)
    const suppliersToSave = modalSuppliers.filter(s => s.supplier_name?.trim() && s.amount > 0);
    console.log('suppliersToSave:', JSON.stringify(suppliersToSave));

    if (suppliersToSave.length === 0) {
        console.log('No valid suppliers to save');
        return;
    }

    try {
        const result = await api.saveTaskSuppliers(taskId, suppliersToSave);
        console.log(`Saved ${suppliersToSave.length} suppliers for task ${taskId}`, result);
    } catch (error) {
        console.error('Failed to save task suppliers:', error);
        showToast('Failed to save supplier allocations', 'error');
    }
}

// Render workflow stages in the modal
function renderWorkflowStages(tier, requiresContract = false) {
    if (!elements.workflowStagesContainer) return;

    const stages = getTierStages(tier, requiresContract);

    // Get current completed stages and N/A stages if editing
    let completedStages = [];
    let naStages = [];
    if (state.currentTask) {
        try {
            completedStages = JSON.parse(state.currentTask.completed_stages || '[]');
        } catch (e) {
            completedStages = [];
        }
        try {
            naStages = JSON.parse(state.currentTask.na_stages || '[]');
        } catch (e) {
            naStages = [];
        }
    }

    const stagesHtml = stages.map((stage, index) => {
        const isCompleted = completedStages.includes(stage.id);
        const isNA = naStages.includes(stage.id);
        const isDisabled = isNA;

        // Build N/A toggle HTML if stage allows it
        let naToggleHtml = '';
        if (stage.allowNA) {
            naToggleHtml = `
                <label class="na-toggle" title="Mark as Not Applicable">
                    <input type="checkbox" class="na-checkbox" data-stage-id="${stage.id}" ${isNA ? 'checked' : ''} onchange="handleNAToggle('${stage.id}', this.checked)">
                    <span class="na-label">N/A</span>
                </label>
            `;
        }

        return `
            <div class="workflow-stage-item ${isCompleted ? 'stage-completed' : ''} ${isNA ? 'stage-na' : ''}">
                <label class="stage-checkbox">
                    <input type="checkbox" data-stage-id="${stage.id}" ${isCompleted ? 'checked' : ''} ${isDisabled ? 'disabled' : ''} onchange="updateModalStageProgress()">
                    <span class="checkbox-custom"></span>
                    <span class="stage-number">${index + 1}</span>
                    <span class="stage-name">${escapeHtml(stage.name)}</span>
                    ${stage.requiresAward ? '<span class="stage-requires-award">(Award Details)</span>' : ''}
                    ${stage.requiresContract ? '<span class="stage-requires-contract">(Link Contract)</span>' : ''}
                </label>
                ${naToggleHtml}
            </div>
        `;
    }).join('');

    elements.workflowStagesContainer.innerHTML = `<div class="workflow-stages-list">${stagesHtml}</div>`;
}

// Handle N/A toggle for stages
window.handleNAToggle = function(stageId, isNA) {
    const stageItem = document.querySelector(`[data-stage-id="${stageId}"]`)?.closest('.workflow-stage-item');
    const stageCheckbox = stageItem?.querySelector('input[data-stage-id="' + stageId + '"]:not(.na-checkbox)');

    if (stageItem && stageCheckbox) {
        if (isNA) {
            stageItem.classList.add('stage-na');
            stageCheckbox.disabled = true;
            stageCheckbox.checked = false;
        } else {
            stageItem.classList.remove('stage-na');
            stageCheckbox.disabled = false;
        }
    }
    updateModalStageProgress();
};

// Update stage completion in modal
function updateModalStageProgress() {
    updateAwardDetailsVisibility();
}

// Show/hide award details based on checked stages
function updateAwardDetailsVisibility() {
    const stageCheckboxes = document.querySelectorAll('#workflow-stages-container input[type="checkbox"]');
    let showAwardDetails = false;

    stageCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const stageId = checkbox.dataset.stageId;
            // Check if this stage requires award details
            const allTiers = Object.values(PROCUREMENT_TIERS);
            for (const tier of allTiers) {
                const stage = tier.stages.find(s => s.id === stageId);
                if (stage && stage.requiresAward) {
                    showAwardDetails = true;
                    break;
                }
            }
        }
    });

    if (showAwardDetails) {
        elements.awardDetailsSection?.classList.remove('hidden');
    } else {
        elements.awardDetailsSection?.classList.add('hidden');
    }
}

// Populate contract dropdown
async function populateContractDropdown(selectedId = null) {
    const dropdown = elements.taskLinkedContract;
    if (!dropdown) return;

    dropdown.innerHTML = '<option value="">Select Contract</option>';

    try {
        // Use existing contracts from state or load them
        let contracts = state.contracts;
        if (!contracts || contracts.length === 0) {
            contracts = await api.getContracts();
        }

        contracts.forEach(contract => {
            const option = document.createElement('option');
            option.value = contract.id;
            option.textContent = `${contract.contract_number || 'No #'} - ${contract.title}`;
            dropdown.appendChild(option);
        });

        if (selectedId) {
            dropdown.value = selectedId;
        }
    } catch (error) {
        console.error('Failed to load contracts:', error);
    }
}

// Open contract modal from task modal
function openContractModalFromTask() {
    // Close task modal temporarily
    elements.taskModal.classList.add('hidden');

    // Open contract modal
    openContractModal(null);

    // TODO: After contract is created, re-open task modal and select the new contract
}

// Populate contractor dropdown with suppliers from database
async function populateContractorDropdown(selectedValue = '') {
    const dropdown = elements.taskContractor;
    if (!dropdown) return;

    // Clear existing options
    dropdown.innerHTML = '<option value="">Select Supplier</option>';

    try {
        // Fetch suppliers and update state so multi-supplier dropdown also has access
        const suppliers = await api.getSuppliers();
        state.suppliers = suppliers; // Update state for multi-supplier feature

        // Sort suppliers alphabetically by name
        suppliers.sort((a, b) => a.name.localeCompare(b.name));

        // Add "Add New Supplier" option at the top
        const addNewOption = document.createElement('option');
        addNewOption.value = '__ADD_NEW_SUPPLIER__';
        addNewOption.textContent = '➕ Add New Supplier...';
        dropdown.appendChild(addNewOption);

        // Add separator
        const separator = document.createElement('option');
        separator.disabled = true;
        separator.textContent = '──────────────';
        dropdown.appendChild(separator);

        // Add supplier options
        suppliers.forEach(supplier => {
            const option = document.createElement('option');
            option.value = supplier.name;
            option.textContent = supplier.name;
            dropdown.appendChild(option);
        });

        // Set selected value if provided
        if (selectedValue) {
            dropdown.value = selectedValue;
        }

        // Add change listener for "Add New Supplier" option
        dropdown.removeEventListener('change', handleContractorDropdownChange);
        dropdown.addEventListener('change', handleContractorDropdownChange);
    } catch (error) {
        console.error('Failed to load suppliers for dropdown:', error);
        // Add the selected value as an option even if loading fails
        if (selectedValue) {
            const option = document.createElement('option');
            option.value = selectedValue;
            option.textContent = selectedValue;
            dropdown.appendChild(option);
            dropdown.value = selectedValue;
        }
    }
}

// Handle contractor dropdown change - open supplier modal if "Add New" selected
function handleContractorDropdownChange(e) {
    if (e.target.value === '__ADD_NEW_SUPPLIER__') {
        e.target.value = ''; // Reset selection
        openSupplierModalFromTask();
    }
}

// State to track if we're adding supplier from task modal
let addingSupplierFromTask = false;
let taskModalFormData = null;

// Open supplier modal from task modal
function openSupplierModalFromTask() {
    // Save current task modal form data
    taskModalFormData = {
        projectCode: elements.taskProjectCode?.value || '',
        title: elements.taskTitle?.value || '',
        budgetAmount: elements.taskBudgetAmount?.value || '',
        contractSum: elements.taskContractSum?.value || '',
        assignedPerson: elements.taskAssignedPerson?.value || '',
        priority: elements.taskPriority?.value || 'Normal',
        startDate: elements.taskStartDate?.value || '',
        endDate: elements.taskEndDate?.value || '',
        expectedCompletionDate: elements.taskExpectedCompletion?.value || '',
        remarks: elements.taskRemarks?.value || '',
        requiresContract: elements.taskRequiresContract?.checked || false,
        singleSource: elements.taskSingleSource?.checked || false,
        linkedContractId: elements.taskLinkedContract?.value || '',
        approver: elements.taskApprover?.value || '',
        awardNumber: elements.taskAwardNumber?.value || ''
    };

    addingSupplierFromTask = true;

    // Hide task modal temporarily
    elements.taskModal.classList.add('hidden');

    // Open supplier modal
    openSupplierModal(null);

    // Update supplier modal title to indicate context
    elements.supplierModalTitle.textContent = 'Add New Supplier (from Task)';
}

function closeTaskModal(skipConfirm = false) {
    // Check if form has data and prompt for confirmation
    if (!skipConfirm && hasFormData(elements.taskForm)) {
        if (!confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
            return;
        }
    }
    elements.taskModal.classList.add('hidden');
    elements.taskForm.reset();
    elements.awardDetailsSection?.classList.add('hidden');
    elements.contractLinkSection?.classList.add('hidden');
    elements.awardDocumentName.textContent = 'No file selected';
    renderWorkflowPlaceholder();
    state.currentTask = null;
    state.isTaskEditMode = false;
}

// ==================== Task Detail Modal (View Mode) ====================

async function openTaskDetailModal(task) {
    state.currentTask = task;

    // Populate basic info
    document.getElementById('task-detail-title').textContent = task.title || 'Procurement Item';
    document.getElementById('task-detail-project-code').textContent = task.project_code || '-';
    document.getElementById('task-detail-title-text').textContent = task.title || '-';
    document.getElementById('task-detail-budget').textContent = task.budget_amount
        ? `G$${parseFloat(task.budget_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        : '-';
    // Display tier name (look up from tier ID, or show ID if not found)
    let tierName = task.procurement_tier || '-';
    if (task.procurement_tier) {
        const tierConfig = Object.values(PROCUREMENT_TIERS).find(t => t.id === task.procurement_tier);
        if (tierConfig) {
            tierName = tierConfig.name;
        }
    }
    document.getElementById('task-detail-tier').textContent = tierName;
    document.getElementById('task-detail-assigned').textContent = task.assigned_person || '-';

    // Show single source procurement status
    const singleSourceContainer = document.getElementById('task-detail-single-source-container');
    if (singleSourceContainer) {
        singleSourceContainer.style.display = task.single_source_procurement === 1 ? 'block' : 'none';
    }

    // Populate suppliers section
    const suppliersSection = document.getElementById('task-detail-suppliers');
    const taskSuppliers = await loadTaskSuppliers(task.id);

    // Calculate total from suppliers (used for contract sum if multi-supplier)
    let suppliersTotal = 0;

    if (taskSuppliers.length > 0) {
        let suppliersHtml = '<div class="detail-suppliers-list">';
        taskSuppliers.forEach(s => {
            suppliersHtml += `
                <div class="detail-supplier-item">
                    <span class="supplier-name">${escapeHtml(s.supplier_name)}</span>
                    <span class="supplier-amount">G$${parseFloat(s.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    ${s.notes ? `<span class="supplier-notes">${escapeHtml(s.notes)}</span>` : ''}
                </div>
            `;
        });
        suppliersTotal = taskSuppliers.reduce((sum, s) => sum + parseFloat(s.amount || 0), 0);
        suppliersHtml += `
            <div class="detail-supplier-total">
                <span>Total:</span>
                <span>G$${suppliersTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
        </div>`;
        suppliersSection.innerHTML = suppliersHtml;
    } else if (task.contractor_supplier) {
        suppliersSection.innerHTML = `
            <div class="detail-grid">
                <div class="detail-item">
                    <span class="detail-label">Contractor</span>
                    <span class="detail-value">${escapeHtml(task.contractor_supplier)}</span>
                </div>
            </div>
        `;
    } else {
        suppliersSection.innerHTML = '<p class="text-muted">No contractor/supplier assigned</p>';
    }

    // Populate award details
    document.getElementById('task-detail-award-number').textContent = task.award_number || '-';
    // Use suppliers total if multi-supplier, otherwise use task.contract_sum
    const contractSumValue = suppliersTotal > 0 ? suppliersTotal : task.contract_sum;
    document.getElementById('task-detail-contract-sum').textContent = contractSumValue
        ? `G$${parseFloat(contractSumValue).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        : '-';
    document.getElementById('task-detail-approver').textContent = task.approver || '-';

    // Show/hide award document
    const awardDocSection = document.getElementById('task-detail-award-document');
    if (task.award_document_r2_key) {
        const fileName = task.award_document_r2_key.split('/').pop();
        document.getElementById('task-detail-award-filename').textContent = fileName;
        awardDocSection.style.display = 'flex';
    } else {
        awardDocSection.style.display = 'none';
    }

    // Populate timeline
    document.getElementById('task-detail-start-date').textContent = task.start_date ? formatDate(task.start_date) : '-';
    document.getElementById('task-detail-end-date').textContent = task.end_date ? formatDate(task.end_date) : '-';
    document.getElementById('task-detail-expected').textContent = task.expected_completion_date ? formatDate(task.expected_completion_date) : '-';
    document.getElementById('task-detail-created').textContent = task.created_at ? formatDate(task.created_at) : '-';

    // Show remarks if exists
    const remarksSection = document.getElementById('task-detail-remarks-section');
    if (task.remarks) {
        document.getElementById('task-detail-remarks').textContent = task.remarks;
        remarksSection.style.display = 'block';
    } else {
        remarksSection.style.display = 'none';
    }

    document.getElementById('task-detail-modal').classList.remove('hidden');
}

function closeTaskDetailModal() {
    document.getElementById('task-detail-modal').classList.add('hidden');
    state.currentTask = null;
}

function handleTaskEditFromDetail() {
    if (state.currentTask) {
        const taskToEdit = { ...state.currentTask };
        closeTaskDetailModal();
        openTaskModal(taskToEdit);
    }
}

async function handleTaskDeleteFromDetail() {
    if (!state.currentTask) return;

    if (!confirm(`Are you sure you want to delete "${state.currentTask.title}"?\n\nThis action cannot be undone.`)) {
        return;
    }

    try {
        await api.deleteTask(state.currentTask.id);
        closeTaskDetailModal();
        await loadTasks();
        showToast('Procurement item deleted successfully');
    } catch (error) {
        showToast(error.message || 'Failed to delete procurement item', 'error');
    }
}

function viewTaskAwardDocument() {
    if (!state.currentTask || !state.currentTask.award_document_r2_key) return;

    const token = api.getToken();
    const url = `${api.baseUrl}/tasks/${state.currentTask.id}/award-document?token=${encodeURIComponent(token)}`;
    window.open(url, '_blank');
}

async function handleTaskSubmit(e) {
    e.preventDefault();

    // Validate split supplier amounts if split mode is enabled
    if (!isSplitSupplierValid()) {
        showToast('Split supplier amounts must equal the total budget amount', 'error');
        return;
    }

    const submitBtn = elements.taskSubmitBtn;
    const spinner = submitBtn.querySelector('.btn-spinner');
    const btnText = submitBtn.querySelector('span');

    submitBtn.disabled = true;
    spinner?.classList.remove('hidden');
    btnText.textContent = state.isTaskEditMode ? 'Updating...' : 'Creating...';

    try {
        // Collect completed stages from checkboxes (exclude N/A checkboxes)
        const completedStages = [];
        const stageCheckboxes = document.querySelectorAll('#workflow-stages-container input[type="checkbox"]:checked:not(.na-checkbox)');
        stageCheckboxes.forEach(checkbox => {
            if (checkbox.dataset.stageId) {
                completedStages.push(checkbox.dataset.stageId);
            }
        });

        // Collect N/A stages from N/A checkboxes
        const naStages = [];
        const naCheckboxes = document.querySelectorAll('#workflow-stages-container .na-checkbox:checked');
        naCheckboxes.forEach(checkbox => {
            if (checkbox.dataset.stageId) {
                naStages.push(checkbox.dataset.stageId);
            }
        });

        // Determine procurement tier from budget (considering single source)
        const budgetAmount = elements.taskBudgetAmount?.value ? parseFloat(elements.taskBudgetAmount.value) : null;
        const isSingleSource = elements.taskSingleSource?.checked || false;
        const tier = isSingleSource ? PROCUREMENT_TIERS.SINGLE_SOURCE : (budgetAmount ? getProcurementTier(budgetAmount) : null);

        const taskData = {
            project_code: elements.taskProjectCode?.value.trim() || null,
            title: elements.taskTitle.value.trim(),
            budget_amount: budgetAmount,
            procurement_tier: tier ? tier.id : null,
            completed_stages: JSON.stringify(completedStages),
            na_stages: JSON.stringify(naStages),
            requires_contract: elements.taskRequiresContract?.checked ? 1 : 0,
            single_source_procurement: elements.taskSingleSource?.checked ? 1 : 0,
            linked_contract_id: elements.taskLinkedContract?.value ? parseInt(elements.taskLinkedContract.value) : null,
            approver: elements.taskApprover?.value.trim() || null,
            award_number: elements.taskAwardNumber?.value.trim() || null,
            contractor_supplier: elements.taskContractor?.value.trim() || null,
            contract_sum: elements.taskContractSum?.value ? parseFloat(elements.taskContractSum.value) : null,
            assigned_person: elements.taskAssignedPerson?.value.trim() || null,
            priority: elements.taskPriority?.value || 'Normal',
            start_date: elements.taskStartDate?.value || null,
            end_date: elements.taskEndDate?.value || null,
            expected_completion_date: elements.taskExpectedCompletion?.value || null,
            remarks: elements.taskRemarks?.value.trim() || null,
            archived: state.currentTask?.archived || 0
        };

        let savedTask;
        let taskId;
        if (state.isTaskEditMode) {
            const response = await api.updateTask(state.currentTask.id, taskData);
            savedTask = response.task || response; // Handle both { task: {...} } and direct task object
            taskId = savedTask?.id || state.currentTask.id; // Fallback to current task id
            showToast('Procurement item updated successfully', 'success');
        } else {
            const response = await api.createTask(taskData);
            savedTask = response.task || response;
            taskId = savedTask?.id;
            showToast('Procurement item created successfully', 'success');
        }

        console.log('Task saved, taskId:', taskId, 'savedTask:', savedTask);

        // Handle award document upload if a file was selected
        const awardFile = elements.taskAwardDocument?.files[0];
        console.log('Award file check:', awardFile, 'taskId:', taskId);
        if (awardFile && taskId) {
            console.log('Uploading award document...');
            await uploadAwardDocument(taskId, awardFile);
        } else {
            console.log('No award file to upload or no taskId');
        }

        // Save multi-supplier allocations if enabled
        console.log('About to save task suppliers for task:', taskId);
        if (taskId) {
            await saveTaskSuppliers(taskId);
        }

        closeTaskModal(true); // Skip confirmation since we just saved
        await loadTasks();

    } catch (error) {
        console.error('Failed to save procurement item:', error);
        showToast(error.message || 'Failed to save procurement item', 'error');
    } finally {
        submitBtn.disabled = false;
        spinner?.classList.add('hidden');
        btnText.textContent = 'Save Procurement Item';
    }
}

async function uploadAwardDocument(taskId, file) {
    console.log('uploadAwardDocument called for taskId:', taskId, 'file:', file?.name, 'size:', file?.size);

    const formData = new FormData();
    formData.append('file', file);

    try {
        const token = api.getToken();
        const url = `${api.baseUrl}/tasks/${taskId}/award-document`;
        console.log('Uploading to:', url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        console.log('Upload response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
            console.error('Upload error response:', errorData);
            throw new Error(errorData.error || 'Failed to upload award document');
        }

        const result = await response.json();
        console.log('Upload success:', result);
        showToast('Award document uploaded successfully', 'success');
    } catch (error) {
        console.error('Failed to upload award document:', error);
        showToast('Item saved but award document upload failed: ' + error.message, 'error');
    }
}

async function handleTaskEdit(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        openTaskModal(task);
    }
}

async function handleTaskView(taskId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (task) {
        openTaskDetailModal(task);
    }
}

async function handleTaskDelete(taskId) {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
        return;
    }

    try {
        await api.deleteTask(taskId);
        showToast('Task deleted successfully', 'success');
        await loadTasks();
    } catch (error) {
        console.error('Failed to delete task:', error);
        showToast('Failed to delete task', 'error');
    }
}

async function handleTaskArchive(taskId, archived) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const action = archived ? 'archive' : 'unarchive';
    if (!confirm(`Are you sure you want to ${action} this task?`)) {
        return;
    }

    try {
        await api.updateTask(taskId, { ...task, archived });
        showToast(archived ? 'Task archived successfully' : 'Task unarchived successfully', 'success');
        await loadTasks();
    } catch (error) {
        console.error('Failed to archive task:', error);
        showToast('Failed to update task', 'error');
    }
}

function handleTaskFilterChange() {
    state.taskFilters.search = elements.taskSearch?.value || '';
    state.taskFilters.status = elements.taskStatusFilter?.value || '';
    state.taskFilters.assigned_person = elements.taskPersonFilter?.value || '';
    renderTasks(); // Use renderTasks for client-side filtering
}

function handleTaskArchiveFilterChange(e) {
    state.taskFilters.archived = e.target.value;

    // Update view title
    const titles = {
        'active': 'Active Procurement Items',
        'archived': 'Archived Procurement Items',
        'all': 'All Procurement Items'
    };
    elements.tasksViewTitle.textContent = titles[e.target.value] || 'Procurement Items';

    loadTasks();
}

function handleTaskSortChange(e) {
    state.taskFilters.sort = e.target.value;
    renderTasks();
}

// Calculate progress percentage for a task
function getTaskProgress(task) {
    const budget = task.budget_amount || 0;
    if (budget <= 0) return 0;

    const isSingleSource = task.single_source_procurement === 1;
    const tier = isSingleSource ? PROCUREMENT_TIERS.SINGLE_SOURCE : getProcurementTier(budget);
    const stages = getTierStages(tier, task.requires_contract === 1);
    let completedStages = [];
    let naStages = [];
    try {
        completedStages = JSON.parse(task.completed_stages || '[]');
    } catch (e) {
        completedStages = [];
    }
    try {
        naStages = JSON.parse(task.na_stages || '[]');
    } catch (e) {
        naStages = [];
    }

    const applicableStagesCount = stages.length - naStages.length;
    return applicableStagesCount > 0 ? Math.round((completedStages.length / applicableStagesCount) * 100) : 0;
}

// Sort tasks based on current sort setting
function sortTasks(tasks) {
    const sortValue = state.taskFilters.sort || 'date-desc';
    const [field, direction] = sortValue.split('-');
    const multiplier = direction === 'desc' ? -1 : 1;

    return [...tasks].sort((a, b) => {
        let comparison = 0;

        switch (field) {
            case 'date':
                const dateA = new Date(a.created_at || 0).getTime();
                const dateB = new Date(b.created_at || 0).getTime();
                comparison = dateA - dateB;
                break;
            case 'name':
                const nameA = (a.title || '').toLowerCase();
                const nameB = (b.title || '').toLowerCase();
                comparison = nameA.localeCompare(nameB);
                break;
            case 'assigned':
                const assignedA = (a.assigned_person || '').toLowerCase();
                const assignedB = (b.assigned_person || '').toLowerCase();
                comparison = assignedA.localeCompare(assignedB);
                break;
            case 'budget':
                comparison = (a.budget_amount || 0) - (b.budget_amount || 0);
                break;
            case 'progress':
                comparison = getTaskProgress(a) - getTaskProgress(b);
                break;
            default:
                comparison = 0;
        }

        return comparison * multiplier;
    });
}

function updateTaskStatistics() {
    const total = state.tasks.length;

    // Calculate based on completed stages - if all applicable stages are checked, it's completed
    const completed = state.tasks.filter(t => {
        if (t.archived) return false;
        const budget = t.budget_amount || 0;
        if (budget <= 0) return false;

        const isSingleSource = t.single_source_procurement === 1;
        const tier = isSingleSource ? PROCUREMENT_TIERS.SINGLE_SOURCE : getProcurementTier(budget);
        const stages = getTierStages(tier, t.requires_contract === 1);
        let completedStages = [];
        let naStages = [];
        try {
            completedStages = JSON.parse(t.completed_stages || '[]');
        } catch (e) {
            completedStages = [];
        }
        try {
            naStages = JSON.parse(t.na_stages || '[]');
        } catch (e) {
            naStages = [];
        }

        const applicableStagesCount = stages.length - naStages.length;
        return completedStages.length >= applicableStagesCount && applicableStagesCount > 0;
    }).length;

    const inProgress = total - completed;

    if (elements.totalTasks) elements.totalTasks.textContent = total;
    if (elements.activeTasks) elements.activeTasks.textContent = inProgress;
    if (elements.completedTasks) elements.completedTasks.textContent = completed;
}

function showTasksLoading(show) {
    elements.tasksLoadingState?.classList.toggle('hidden', !show);
    elements.tasksEmptyState?.classList.add('hidden');
    if (show) {
        elements.tasksListContainer?.classList.add('hidden');
    }
}

// ==================== Column Filter Functions ====================

// Track current column sort state
let columnSortState = { field: 'date', direction: 'desc' };

// Track column filter state
let columnFilters = { priority: null, status: null, assigned: null };

function toggleColumnSort(field) {
    if (columnSortState.field === field) {
        columnSortState.direction = columnSortState.direction === 'asc' ? 'desc' : 'asc';
    } else {
        columnSortState.field = field;
        columnSortState.direction = 'asc';
    }

    // Update the sort dropdown to match
    state.taskFilters.sort = `${field}-${columnSortState.direction}`;
    const sortSelect = document.getElementById('task-sort');
    if (sortSelect) {
        sortSelect.value = state.taskFilters.sort;
    }

    // Update visual indicators
    updateColumnSortIndicators();
    renderTasks();
}

function updateColumnSortIndicators() {
    document.querySelectorAll('.clickup-col-sortable').forEach(col => {
        col.classList.remove('sort-asc', 'sort-desc');
    });

    const activeCol = document.querySelector(`.clickup-col-sortable[onclick*="${columnSortState.field}"]`);
    if (activeCol) {
        activeCol.classList.add(`sort-${columnSortState.direction}`);
    }
}

function toggleColumnFilter(event, filterType) {
    event.stopPropagation();

    // Close other dropdowns
    document.querySelectorAll('.col-filter-dropdown').forEach(dd => {
        if (dd.id !== `${filterType}-filter-dropdown`) {
            dd.classList.add('hidden');
        }
    });

    const dropdown = document.getElementById(`${filterType}-filter-dropdown`);
    const isHidden = dropdown.classList.contains('hidden');

    if (isHidden) {
        populateFilterOptions(filterType);
        dropdown.classList.remove('hidden');
    } else {
        dropdown.classList.add('hidden');
    }
}

function populateFilterOptions(filterType) {
    const optionsContainer = document.getElementById(`${filterType}-filter-options`);
    if (!optionsContainer) return;

    let values = [];

    switch (filterType) {
        case 'priority':
            // Fixed priority options
            values = ['Urgent', 'Normal', 'Low'];
            break;
        case 'status':
            // Status options based on progress
            values = ['Complete', 'In Progress', 'Not Started'];
            break;
        case 'assigned':
            // Get unique assigned persons from tasks
            const assignedPersons = new Set();
            (state.tasks || []).forEach(task => {
                if (task.assigned_person?.trim()) {
                    assignedPersons.add(task.assigned_person.trim());
                }
            });
            values = Array.from(assignedPersons).sort();
            break;
    }

    optionsContainer.innerHTML = values.map(value => `
        <div class="col-filter-option ${columnFilters[filterType] === value ? 'selected' : ''}"
             onclick="applyColumnFilter('${filterType}', '${escapeHtml(value)}')">
            ${escapeHtml(value)}
        </div>
    `).join('');

    if (values.length === 0) {
        optionsContainer.innerHTML = '<div class="col-filter-option" style="color: var(--color-text-muted); cursor: default;">No options available</div>';
    }
}

function applyColumnFilter(filterType, value) {
    columnFilters[filterType] = value;

    // Update filter button to show active state
    const btn = document.querySelector(`.clickup-col-${filterType === 'assigned' ? 'assigned' : filterType} .col-filter-btn`);
    if (btn) btn.classList.add('active');

    // Close dropdown
    document.getElementById(`${filterType}-filter-dropdown`)?.classList.add('hidden');

    renderTasks();
}

function clearColumnFilter(filterType) {
    columnFilters[filterType] = null;

    // Remove active state from button
    const btn = document.querySelector(`.clickup-col-${filterType === 'assigned' ? 'assigned' : filterType} .col-filter-btn`);
    if (btn) btn.classList.remove('active');

    // Close dropdown
    document.getElementById(`${filterType}-filter-dropdown`)?.classList.add('hidden');

    renderTasks();
}

// Close filter dropdowns when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.clickup-col-filterable')) {
        document.querySelectorAll('.col-filter-dropdown').forEach(dd => dd.classList.add('hidden'));
    }
});

// Make task functions globally accessible
window.openTaskModal = openTaskModal;
window.closeTaskModal = closeTaskModal;
window.openTaskDetailModal = openTaskDetailModal;
window.closeTaskDetailModal = closeTaskDetailModal;
window.handleTaskEditFromDetail = handleTaskEditFromDetail;
window.handleTaskDeleteFromDetail = handleTaskDeleteFromDetail;
window.viewTaskAwardDocument = viewTaskAwardDocument;
window.handleTaskEdit = handleTaskEdit;
window.handleTaskView = handleTaskView;
window.handleTaskDelete = handleTaskDelete;
window.handleTaskArchive = handleTaskArchive;
window.handleBudgetChange = handleBudgetChange;
window.handleContractToggle = handleContractToggle;
window.toggleTaskExpand = toggleTaskExpand;
window.handleStageToggle = handleStageToggle;
window.updateModalStageProgress = updateModalStageProgress;
window.openContractModalFromTask = openContractModalFromTask;
window.updateSupplierData = updateSupplierData;
window.removeSupplierRow = removeSupplierRow;
window.toggleColumnSort = toggleColumnSort;
window.toggleColumnFilter = toggleColumnFilter;
window.applyColumnFilter = applyColumnFilter;
window.clearColumnFilter = clearColumnFilter;

// ==================== Audit Log Functions ====================

// Audit log pagination state
let auditLogState = {
    currentPage: 1,
    pageSize: 50,
    totalLogs: 0
};

async function loadRecentAuditLogs() {
    // Get all three audit widget containers
    const containers = [
        document.getElementById('audit-entries'),
        document.getElementById('audit-entries-contracts'),
        document.getElementById('audit-entries-tasks')
    ].filter(c => c !== null);

    if (containers.length === 0) return;

    try {
        const response = await api.getRecentAuditLogs(8);

        const html = response.logs && response.logs.length > 0
            ? response.logs.map(log => `
                <div class="audit-entry">
                    <div class="audit-entry-header">
                        <span class="audit-user">${escapeHtml(log.user_name)}</span>
                        <span class="audit-time">${formatAuditTime(log.timestamp)}</span>
                    </div>
                    <span class="audit-action ${log.action.toLowerCase()}">${log.action}</span>
                    <span class="audit-details">${escapeHtml(log.entity_type)}: ${escapeHtml(log.entity_name || '')}</span>
                </div>
            `).join('')
            : '<div class="audit-loading">No recent activity</div>';

        // Update all containers with the same content
        containers.forEach(container => {
            container.innerHTML = html;
        });
    } catch (error) {
        console.error('Failed to load recent audit logs:', error);
        containers.forEach(container => {
            container.innerHTML = '<div class="audit-loading">Failed to load activity</div>';
        });
    }
}

async function loadActivityLogs(direction) {
    const tableBody = document.getElementById('activity-table-body');
    if (!tableBody) return;

    // Handle pagination
    if (direction === 'next') {
        auditLogState.currentPage++;
    } else if (direction === 'prev' && auditLogState.currentPage > 1) {
        auditLogState.currentPage--;
    } else if (!direction) {
        auditLogState.currentPage = 1;
    }

    // Get filter values
    const userFilter = document.getElementById('activity-user-filter')?.value || '';
    const actionFilter = document.getElementById('activity-action-filter')?.value || '';
    const entityFilter = document.getElementById('activity-entity-filter')?.value || '';

    try {
        tableBody.innerHTML = '<tr><td colspan="5" class="loading-cell">Loading...</td></tr>';

        const response = await api.getAuditLogs({
            user_id: userFilter,
            action: actionFilter,
            entity_type: entityFilter,
            limit: auditLogState.pageSize,
            offset: (auditLogState.currentPage - 1) * auditLogState.pageSize
        });

        if (response.logs && response.logs.length > 0) {
            tableBody.innerHTML = response.logs.map(log => `
                <tr>
                    <td>${formatAuditTimestamp(log.timestamp)}</td>
                    <td>${escapeHtml(log.user_name)}</td>
                    <td><span class="audit-action ${log.action.toLowerCase()}">${log.action}</span></td>
                    <td>${escapeHtml(log.entity_type)} ${log.entity_id ? '#' + log.entity_id : ''}</td>
                    <td>${escapeHtml(log.details || '')}</td>
                </tr>
            `).join('');
        } else {
            tableBody.innerHTML = '<tr><td colspan="5" class="loading-cell">No activity logs found</td></tr>';
        }

        // Update pagination
        document.getElementById('activity-page-info').textContent = `Page ${auditLogState.currentPage}`;
        document.getElementById('activity-prev-btn').disabled = auditLogState.currentPage <= 1;
        document.getElementById('activity-next-btn').disabled = response.logs?.length < auditLogState.pageSize;

        // Populate user filter if not already done
        populateUserFilter();
    } catch (error) {
        console.error('Failed to load activity logs:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="loading-cell">Failed to load activity logs</td></tr>';
    }
}

async function populateUserFilter() {
    const userFilter = document.getElementById('activity-user-filter');
    if (!userFilter || userFilter.options.length > 1) return;

    try {
        const response = await api.getUsers();
        if (response.users) {
            response.users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.full_name;
                userFilter.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Failed to load users for filter:', error);
    }
}

function formatAuditTime(timestamp) {
    // Server already stores Guyana time, no conversion needed
    const date = new Date(timestamp);
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    // Format as readable date
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
}

function formatAuditTimestamp(timestamp) {
    // Server already stores Guyana time, no conversion needed
    const date = new Date(timestamp);

    // Format manually
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    return `${month} ${day}, ${year}, ${hours}:${minutes} ${ampm}`;
}

// Make audit functions globally accessible
window.loadActivityLogs = loadActivityLogs;
window.switchView = switchView;

// Mobile FAB click handler - opens the appropriate add modal based on current view
window.handleMobileFabClick = function() {
    switch (state.currentView) {
        case 'suppliers':
            openSupplierModal();
            break;
        case 'contracts':
            openContractModal();
            break;
        case 'tasks':
            openTaskModal();
            break;
        default:
            openSupplierModal();
    }
};
