/**
 * Supplier Document Management System
 * Configuration File
 * 
 * Bureau of Statistics — Procurement Unit
 */

// API Configuration
const CONFIG = {
    // Base URL for the Cloudflare Worker API
    API_BASE_URL: 'https://supplier-management.andrewhing.workers.dev',
    
    // Document types required for supplier compliance
    DOCUMENT_TYPES: [
        {
            id: 'business_registration',
            name: 'Business Registration Certificate',
            description: 'Official business registration from the Deeds Registry'
        },
        {
            id: 'nis_compliance',
            name: 'NIS Compliance Certificate',
            description: 'National Insurance Scheme compliance certificate'
        },
        {
            id: 'gra_compliance',
            name: 'GRA Compliance Certificate',
            description: 'Guyana Revenue Authority tax compliance certificate'
        },
        {
            id: 'tin_certificate',
            name: 'TIN Certificate',
            description: 'Taxpayer Identification Number certificate'
        }
    ],
    
    // Default supplier categories (seeded on first load)
    DEFAULT_CATEGORIES: [
        'Toners and Ink Cartridges',
        'Refreshments and Tea Items',
        'Janitorial and Cleaning Supplies',
        'Printing and Binding Services',
        'Office Supplies and Stationery',
        'Computer Equipment and Accessories',
        'Furniture and Fixtures',
        'Vehicle Parts and Services',
        'Catering and Event Services',
        'Professional Services'
    ],
    
    // File upload constraints
    UPLOAD: {
        MAX_SIZE_MB: 10,
        ALLOWED_TYPES: ['application/pdf'],
        ALLOWED_EXTENSIONS: ['.pdf']
    },
    
    // Session timeout (in milliseconds)
    SESSION_TIMEOUT: 4 * 60 * 60 * 1000, // 4 hours
    
    // Local storage keys
    STORAGE_KEYS: {
        AUTH_TOKEN: 'bos_sdms_auth_token',
        SESSION_EXPIRY: 'bos_sdms_session_expiry'
    }
};

// Freeze configuration to prevent accidental modification
Object.freeze(CONFIG);
Object.freeze(CONFIG.DOCUMENT_TYPES);
Object.freeze(CONFIG.DEFAULT_CATEGORIES);
Object.freeze(CONFIG.UPLOAD);
Object.freeze(CONFIG.STORAGE_KEYS);
