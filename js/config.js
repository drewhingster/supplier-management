/**
 * Supplier Document Management System
 * Configuration - VERSION 4
 * 
 * Bureau of Statistics — Procurement Unit
 */

const CONFIG = {
    // API Configuration
    // UPDATE THIS URL to your Cloudflare Worker URL
    API_BASE_URL: 'https://supplier-management.your-subdomain.workers.dev/api',

    // Document Types
    DOCUMENT_TYPES: [
        { id: 'business_registration', name: 'Business Registration Certificate' },
        { id: 'nis_compliance', name: 'NIS Compliance Certificate' },
        { id: 'gra_compliance', name: 'GRA Compliance Certificate' },
        { id: 'tin_certificate', name: 'TIN Certificate' }
    ],

    // Default Categories (seeded on first load)
    DEFAULT_CATEGORIES: [
        'Office Supplies',
        'IT Equipment & Services',
        'Printing Services',
        'Furniture',
        'Cleaning Services',
        'Security Services',
        'Vehicle Maintenance',
        'Stationery',
        'Catering',
        'Construction & Maintenance',
        'Professional Services',
        'Training & Consultancy'
    ],

    // Upload Configuration
    UPLOAD: {
        MAX_SIZE_MB: 10,
        ALLOWED_TYPES: ['application/pdf']
    },

    // Session Configuration
    SESSION: {
        TIMEOUT_HOURS: 4
    }
};
