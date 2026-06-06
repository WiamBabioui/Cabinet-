-- ============================================================
-- Migration 001 — Add assigned_doctor_id to utilisateurs
-- Cabinet+ Role Hierarchy Redesign
-- ============================================================

-- Step 1: Add the column (safe: only if it doesn't exist)
ALTER TABLE utilisateurs
  ADD COLUMN IF NOT EXISTS assigned_doctor_id INT(10) UNSIGNED NULL DEFAULT NULL AFTER role;

-- Step 2: Add index for fast hierarchy lookups
ALTER TABLE utilisateurs
  ADD INDEX IF NOT EXISTS idx_assigned_doctor (assigned_doctor_id, role);

-- Step 3: Add FK constraint (safe: will fail silently if already exists)
-- We use a named constraint so we can check for it
SET @constraint_exists = (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE CONSTRAINT_SCHEMA = DATABASE()
    AND TABLE_NAME = 'utilisateurs'
    AND CONSTRAINT_NAME = 'fk_assigned_doctor'
);

-- Only add if not already there (executed via application script)
-- The application migrate.js handles the conditional FK addition

-- Step 4: Verify the column was added
SELECT 
  COLUMN_NAME, 
  DATA_TYPE, 
  IS_NULLABLE, 
  COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'utilisateurs'
  AND COLUMN_NAME = 'assigned_doctor_id';
