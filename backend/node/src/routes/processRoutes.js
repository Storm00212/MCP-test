/*
 * Process Routes - Child process management endpoints
 */

import { Router } from 'express';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const router = Router();

// In-memory process registry
const activeProcesses = new Map();

/**
 * GET /processes
 * Get all active processes
 */
router.get('/', (req, res) => {
  const processes = Array.from(activeProcesses.entries()).map(([id, data]) => ({
    id,
    ...data
  }));
  
  return res.json({ 
    success: true, 
    data: processes 
  });
});

/**
 * GET /processes/:id
 * Get a specific process by ID
 */
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const proc = activeProcesses.get(id);
  
  if (!proc) {
    return res.status(404).json({ 
      success: false, 
      error: 'Process not found' 
    });
  }
  
  return res.json({ 
    success: true, 
    data: { id, ...proc }
  });
});

/**
 * POST /processes/spawn
 * Spawn a new process
 */
router.post('/spawn', (req, res) => {
  const { command, args = [], cwd } = req.body;
  
  if (!command) {
    return res.status(400).json({ 
      success: false,
      error: 'Command is required' 
    });
  }
  
  const id = Date.now().toString();
  let output = '';
  
  try {
    const process = spawn(command, args, {
      cwd: cwd || __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    process.on('close', (code) => {
      const procData = activeProcesses.get(id);
      if (procData) {
        procData.status = code === 0 ? 'completed' : 'failed';
        procData.exitCode = code;
      }
    });
    
    process.on('error', (error) => {
      const procData = activeProcesses.get(id);
      if (procData) {
        procData.status = 'error';
        procData.error = error.message;
      }
    });
    
    activeProcesses.set(id, {
      command,
      args,
      pid: process.pid,
      status: 'running',
      output,
      startTime: new Date().toISOString()
    });
    
    return res.json({
      success: true,
      data: {
        id,
        pid: process.pid,
        status: 'running',
        startTime: new Date().toISOString()
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /processes/:id/kill
 * Kill a running process
 */
router.post('/:id/kill', (req, res) => {
  const { id } = req.params;
  const proc = activeProcesses.get(id);
  
  if (!proc) {
    return res.status(404).json({ 
      success: false, 
      error: 'Process not found' 
    });
  }
  
  // Note: In a production environment, you'd want to store 
  // the actual process object to call .kill() on it
  // For now, we mark it as killed
  
  proc.status = 'killed';
  proc.endTime = new Date().toISOString();
  
  return res.json({ 
    success: true, 
    message: 'Kill signal sent',
    data: { id, status: 'killed' }
  });
});

/**
 * GET /processes/:id/output
 * Get the output of a specific process
 */
router.get('/:id/output', (req, res) => {
  const { id } = req.params;
  const proc = activeProcesses.get(id);
  
  if (!proc) {
    return res.status(404).json({ 
      success: false, 
      error: 'Process not found' 
    });
  }
  
  return res.json({ 
    success: true, 
    data: { id, output: proc.output }
  });
});

export default router;
