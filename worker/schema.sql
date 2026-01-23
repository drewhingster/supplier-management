-- ==========================================================================
-- Supplier Document Management System
-- Database Schema for Cloudflare D1
-- 
-- Bureau of Statistics — Procurement Unit
-- ==========================================================================

-- Categories table
-- Stores supplier categories for classification
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for category name lookups
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Suppliers table
-- Stores core supplier information
CREATE TABLE IF NOT EXISTS suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    telephone TEXT NOT NULL,
    email TEXT,
    contact_person TEXT,
    category_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);
CREATE INDEX IF NOT EXISTS idx_suppliers_category ON suppliers(category_id);
CREATE INDEX IF NOT EXISTS idx_suppliers_created ON suppliers(created_at);

-- Documents table
-- Stores metadata for compliance documents stored in R2
CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER NOT NULL,
    document_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    r2_key TEXT NOT NULL UNIQUE,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    UNIQUE(supplier_id, document_type)
);

-- Create indexes for document queries
CREATE INDEX IF NOT EXISTS idx_documents_supplier ON documents(supplier_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_r2_key ON documents(r2_key);

-- ==========================================================================
-- Document Type Reference (for application use, not a DB table)
-- ==========================================================================
-- Valid document_type values:
--   'business_registration' - Business Registration Certificate
--   'nis_compliance'        - NIS Compliance Certificate  
--   'gra_compliance'        - GRA Compliance Certificate
--   'tin_certificate'       - TIN Certificate
-- ==========================================================================
