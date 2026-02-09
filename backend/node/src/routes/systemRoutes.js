/*
 * System Routes - System information and metrics endpoints
 */

import { Router } from 'express';

const router = Router();

/**
 * GET /system/info
 * Get system information
 */
router.get('/info', (req, res) => {
  const systemInfo = {
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    pid: process.pid,
    uptime: process.uptime(),
    cwd: process.cwd(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage()
  };
  
  return res.json({ 
    success: true, 
    data: systemInfo 
  });
});

/**
 * GET /system/environment
 * Get environment variables (filtered for security)
 */
router.get('/environment', (req, res) => {
  const safeEnv = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    // Note: Don't expose sensitive env vars
  };
  
  return res.json({ 
    success: true, 
    data: safeEnv 
  });
});

/**
 * GET /system/uptime
 * Get server uptime
 */
router.get('/uptime', (req, res) => {
  return res.json({ 
    success: true, 
    data: { 
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    } 
  });
});

export default router;
