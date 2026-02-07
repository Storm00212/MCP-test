const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let mcpProcess;
let client;

function createWindow() {
  console.log('createWindow called, __dirname:', __dirname);
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  console.log('BrowserWindow created');
  
  mainWindow.center();
  
  const filePath = path.join(__dirname, '../dist/index.html');
  console.log('Loading file:', filePath);
  mainWindow.loadFile(filePath);
  
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
  });
  
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load page:', errorCode, errorDescription);
  });
  
  mainWindow.webContents.openDevTools();
}

async function startMCPServer() {
  console.log('Starting MCP server...');
  
  // Spawn MCP server as child process
  mcpProcess = spawn('node', ['../src/index.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: ['pipe', 'pipe', 'pipe']
  });
  console.log('MCP server process spawned, PID:', mcpProcess.pid);
  
  // Handle MCP output
  mcpProcess.stdout.on('data', (data) => {
    console.log(`MCP: ${data}`);
  });
  
  mcpProcess.stderr.on('data', (data) => {
    console.error(`MCP Error: ${data}`);
  });
  
  // Import MCP SDK
  const { Client } = require('@modelcontextprotocol/sdk/client');
  const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client');
  console.log('MCP SDK imported');
  
  // Set up MCP client
  client = new Client({
    name: 'electron-client',
    version: '1.0.0',
  });
  
  // Connect with retry logic
  let retries = 3;
  while (retries > 0) {
    try {
      console.log('Connecting MCP client... (attempt ' + (4 - retries) + ')');
      await client.connect(new StdioClientTransport(mcpProcess.stdout, mcpProcess.stdin));
      console.log('MCP client connected successfully');
      return true;
    } catch (error) {
      console.error('MCP connection error:', error.message);
      retries--;
      if (retries > 0) {
        console.log('Retrying in 1 second...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  console.error('Failed to connect MCP client after 3 attempts');
  return false;
}

// IPC handler
ipcMain.handle('execute-tool', async (event, { toolName, args }) => {
  console.log('IPC: execute-tool:', toolName);
  try {
    const result = await client.callTool({
      name: toolName,
      arguments: args,
    });
    console.log('IPC: Tool result:', result);
    return result;
  } catch (error) {
    console.error('IPC: Tool error:', error);
    return { error: error.message };
  }
});

// Proper async flow using app.whenReady()
async function main() {
  console.log('Main function starting...');
  
  // Wait for app to be ready (proper Electron pattern)
  await app.whenReady();
  console.log('App is ready');
  
  // Create window first
  createWindow();
  console.log('Window created');
  
  // Then start MCP server
  const mcpConnected = await startMCPServer();
  console.log('MCP server started:', mcpConnected);
  
  app.on('window-all-closed', () => {
    if (mcpProcess) {
      mcpProcess.kill();
    }
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
  
  console.log('Electron app fully initialized');
}

// Start the app
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});