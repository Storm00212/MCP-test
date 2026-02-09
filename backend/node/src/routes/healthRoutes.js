/*
 * Health Routes - Health check and status endpoints
 */

import { Router } from 'express';

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
  // Add any readiness checks here (e.g., database connections, etc.)
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
  const pkg = await import('../package.json', { assert: { type: 'json' } }).catch(() => ({}));
  
  return res.json({ 
    success: true, 
    data: {
      name: pkg.default?.name || 'engineering-command-os-node',
      version: pkg.default?.version || '1.0.0',
      nodeVersion: process.version
    }
  });
});

export default router;
