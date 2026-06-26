// backend/tests/setup/jest.setup.js
// Global setup for Cabinet+ test suite

import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables
dotenv.config({ path: path.join(__dirname, '../../.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'cabinet_plus_test_secret_2024';
process.env.JWT_EXPIRES_IN = '1h';

// Increase test timeout for DB operations
jest.setTimeout(30000);

// Suppress console.warn/log in tests (keep console.error for debugging)
global.console.warn = jest.fn();
global.console.log = jest.fn();
