/*
 * Health Routes - Health check and status endpoints
 */

import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const router = Router();

/**
 * GET /health
 * Basic health check endpoint
 */
router.get('/', (req, res) => {
  return res.json({ 
    success: true, 
    status: 'healthy',
    service: 'node-backend',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /health/ready
 * Readiness check - verifies the server is ready to accept requests
 */
router.get('/ready', (req, res) => {
  return res.json({ 
    success: true, 
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /health/live
 * Liveness check - verifies the server is running
 */
router.get('/live', (req, res) => {
  return res.json({ 
    success: true, 
    status: 'alive',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

/**
 * GET /health/version
 * Get version information
 */
router.get('/version', (req, res) => {
  let version = '1.0.0';
  try {
    const pkgPath = join(__dirname, '../package.json');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    version = pkg.version || '1.0.0';
  } catch (e) {
    // Use default version
  }
  
  return res.json({ 
    success: true, 
    data: {
      name: 'engineering-command-os-node',
      version,
      nodeVersion: process.version
    }
  });
});

export default router;
