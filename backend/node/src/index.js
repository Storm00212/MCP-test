/*
 * Engineering Command OS - Node.js Backend (Main Server)
 * Modular architecture with Express Router pattern
 */

import express from 'express';
import cors from 'cors';

// Import route modules
import browserRoutes from './routes/browserRoutes.js';
import processRoutes from './routes/processRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import healthRoutes from './routes/healthRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ============================================
// API ROUTES
// ============================================

// Health check routes - mounted at /health
app.use('/health', healthRoutes);

// Browser automation routes - mounted at /api/browser
app.use('/api/browser', browserRoutes);

// Process management routes - mounted at /api/processes
app.use('/api/processes', processRoutes);

// System info routes - mounted at /api/system
app.use('/api/system', systemRoutes);

// ============================================
// API DOCUMENTATION
// ============================================
app.get('/api', (req, res) => {
  res.json({
    name: 'Engineering Command OS API',
    version: '1.0.0',
    endpoints: {
      health: {
        'GET /health': 'Basic health check',
        'GET /health/ready': 'Readiness check',
        'GET /health/live': 'Liveness check',
        'GET /health/version': 'Version info'
      },
      browser: {
        'POST /api/browser/open': 'Open URL in browser',
        'POST /api/browser/whatsapp/send': 'Send WhatsApp message',
        'POST /api/browser/youtube/search': 'Search YouTube'
      },
      processes: {
        'GET /api/processes': 'List all processes',
        'GET /api/processes/:id': 'Get process by ID',
        'POST /api/processes/spawn': 'Spawn new process',
        'POST /api/processes/:id/kill': 'Kill a process',
        'GET /api/processes/:id/output': 'Get process output'
      },
      system: {
        'GET /api/system/info': 'Get system info',
        'GET /api/system/environment': 'Get environment (safe)',
        'GET /api/system/uptime': 'Get server uptime'
      }
    }
  });
});

// ============================================
// ROOT ENDPOINT
// ============================================
app.get('/', (req, res) => {
  res.json({
    service: 'Engineering Command OS - Node.js Backend',
    status: 'running',
    health: `http://localhost:${PORT}/health`,
    api: `http://localhost:${PORT}/api`
  });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`╔════════════════════════════════════════════════════════════╗`);
  console.log(`║  Engineering Command OS - Node.js Backend                  ║`);
  console.log(`║  JARVIS ONLINE Running on port ${PORT}                     ║`);
  console.log(`╠════════════════════════════════════════════════════════════╣`);
  console.log(`║  Health:    http://localhost:${PORT}/health                ║`);
  console.log(`║  API Docs:  http://localhost:${PORT}/api                   ║`);
  console.log(`║  Root:      http://localhost:${PORT}/                      ║`);
  console.log(`╚════════════════════════════════════════════════════════════╝`);
});

export default app;
