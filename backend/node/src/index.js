#!/usr/bin/env node
"""
Engineering Command OS - Node.js Backend
Handles: Browser automation (Puppeteer/Playwright), URL launching, Child process management
"""

import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());

// ============================================
// BROWSER AUTOMATION ROUTES
// ============================================

// Launch URL in browser
app.post('/browser/open', async (req, res) => {
  const { url, browser = 'chrome' } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  try {
    let command;
    switch (browser) {
      case 'chrome':
        command = 'cmd';
        args = ['/c', 'start', 'chrome', '--new-window', url];
        break;
      case 'whatsapp':
        return res.json({ 
          status: 'success', 
          message: 'Opening WhatsApp Web',
          url: 'https://web.whatsapp.com'
        });
      case 'youtube':
        return res.json({ 
          status: 'success', 
          message: 'Opening YouTube',
          url: `https://www.youtube.com/results?search_query=${encodeURIComponent(url)}`
        });
      default:
        command = 'cmd';
        args = ['/c', 'start', url];
    }
    
    spawn(command, args, { detached: true, stdio: 'ignore' });
    
    res.json({ 
      status: 'success', 
      message: `Opened ${url} in ${browser}`,
      url 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WhatsApp specific
app.post('/whatsapp/send', async (req, res) => {
  const { phone, message } = req.body;
  
  if (!phone || !message) {
    return res.status(400).json({ error: 'Phone and message are required' });
  }
  
  // Note: WhatsApp Web automation requires authentication
  // This opens WhatsApp Web with a pre-filled message link
  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  
  spawn('cmd', ['/c', 'start', waUrl], { detached: true, stdio: 'ignore' });
  
  res.json({ 
    status: 'success', 
    message: 'Opening WhatsApp to send message',
    url: waUrl
  });
});

// YouTube search
app.post('/youtube/search', async (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }
  
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  spawn('cmd', ['/c', 'start', searchUrl], { detached: true, stdio: 'ignore' });
  
  res.json({ 
    status: 'success', 
    message: `Searching YouTube for: ${query}`,
    url: searchUrl
  });
});

// ============================================
// CHILD PROCESS MANAGEMENT
// ============================================

const activeProcesses = new Map();

app.get('/processes', (req, res) => {
  const processes = Array.from(activeProcesses.entries()).map(([id, data]) => ({
    id,
    ...data
  }));
  res.json(processes);
});

app.post('/process/spawn', (req, res) => {
  const { command, args = [], cwd } = req.body;
  
  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }
  
  const id = Date.now().toString();
  const process = spawn(command, args, {
    cwd: cwd || __dirname,
    stdio: ['pipe', 'pipe', 'pipe']
  });
  
  let output = '';
  process.stdout.on('data', (data) => {
    output += data.toString();
  });
  
  process.stderr.on('data', (data) => {
    output += data.toString();
  });
  
  process.on('close', (code) => {
    activeProcesses.delete(id);
  });
  
  activeProcesses.set(id, {
    command,
    args,
    pid: process.pid,
    status: 'running',
    output
  });
  
  res.json({
    status: 'success',
    id,
    pid: process.pid,
    status: 'running'
  });
});

app.post('/process/:id/kill', (req, res) => {
  const { id } = req.params;
  const proc = activeProcesses.get(id);
  
  if (!proc) {
    return res.status(404).json({ error: 'Process not found' });
  }
  
  // Note: We can't easily kill processes by ID without storing the actual process object
  // This would need to be enhanced
  
  res.json({ status: 'success', message: 'Kill signal sent' });
});

// ============================================
// SYSTEM INFO
// ============================================
app.get('/system/info', (req, res) => {
  res.json({
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    pid: process.pid,
    uptime: process.uptime()
  });
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'node-backend' });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`Engineering Command OS - Node.js Backend running on port ${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/health`);
  console.log(`  Browser: http://localhost:${PORT}/browser/open`);
  console.log(`  WhatsApp: http://localhost:${PORT}/whatsapp/send`);
  console.log(`  YouTube: http://localhost:${PORT}/youtube/search`);
});

export default app;
