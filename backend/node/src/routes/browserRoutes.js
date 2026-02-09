/*
 * Browser Routes - Browser automation and URL launching endpoints
 */

import { Router } from 'express';
import { spawn } from 'child_process';

const router = Router();

/**
 * POST /browser/open
 * Launch a URL in the specified browser
 */
router.post('/open', (req, res) => {
  const { url, browser = 'chrome' } = req.body;
  
  if (!url) {
    return res.status(400).json({ 
      success: false,
      error: 'URL is required' 
    });
  }
  
  try {
    let command, args;
    
    switch (browser) {
      case 'chrome':
        command = 'cmd';
        args = ['/c', 'start', 'chrome', '--new-window', url];
        break;
      case 'whatsapp':
        return res.json({ 
          success: true, 
          message: 'Opening WhatsApp Web',
          data: { url: 'https://web.whatsapp.com' }
        });
      case 'youtube':
        return res.json({ 
          success: true, 
          message: 'Opening YouTube',
          data: { url: `https://www.youtube.com/results?search_query=${encodeURIComponent(url)}` }
        });
      default:
        command = 'cmd';
        args = ['/c', 'start', url];
    }
    
    spawn(command, args, { detached: true, stdio: 'ignore' });
    
    return res.json({ 
      success: true, 
      message: `Opened ${url} in ${browser}`,
      data: { url, browser }
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

/**
 * POST /whatsapp/send
 * Send a WhatsApp message by opening WhatsApp Web with pre-filled message
 */
router.post('/whatsapp/send', (req, res) => {
  const { phone, message } = req.body;
  
  if (!phone || !message) {
    return res.status(400).json({ 
      success: false,
      error: 'Phone and message are required' 
    });
  }
  
  const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  
  spawn('cmd', ['/c', 'start', waUrl], { detached: true, stdio: 'ignore' });
  
  return res.json({ 
    success: true, 
    message: 'Opening WhatsApp to send message',
    data: { url: waUrl }
  });
});

/**
 * POST /youtube/search
 * Search YouTube with a query
 */
router.post('/youtube/search', (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({ 
      success: false,
      error: 'Search query is required' 
    });
  }
  
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  
  spawn('cmd', ['/c', 'start', searchUrl], { detached: true, stdio: 'ignore' });
  
  return res.json({ 
    success: true, 
    message: `Searching YouTube for: ${query}`,
    data: { url: searchUrl, query }
  });
});

export default router;
