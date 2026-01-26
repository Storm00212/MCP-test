import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { spawn } from 'child_process';

console.log('process.type:', process.type);
console.log('process.versions.electron:', process.versions.electron);
console.log('global.app:', global.app);
console.log('app:', app);
console.log('BrowserWindow:', BrowserWindow);
console.log('ipcMain:', ipcMain);
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
      nodeIntegration: true, // For React require, will change to false later with preload
      contextIsolation: false
    }
  });
  console.log('BrowserWindow webPreferences:', mainWindow.webContents.getWebPreferences());

  mainWindow.center();
  console.log('Window created, centering applied');

  const filePath = path.join(__dirname, '../dist/index.html');
  console.log('Attempting to load file:', filePath);
  mainWindow.loadFile(filePath);

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('Page loaded successfully');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load page:', errorCode, errorDescription);
  });

  mainWindow.webContents.openDevTools();
}

setTimeout(() => {
  console.log('delayed app:', app);
  app.on('ready', async () => {
    console.log('App ready event fired');
    try {
      createWindow();
    } catch (error) {
      console.error('Error creating window:', error);
    }

  // Spawn MCP server as child process
  console.log('Spawning MCP server process...');
  mcpProcess = spawn('node', ['../src/index.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: ['pipe', 'pipe', 'pipe']
  });
  console.log('MCP server process spawned, PID:', mcpProcess.pid);

  try {
    // Import MCP SDK
    const { Client } = require('@modelcontextprotocol/sdk/client');
    const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client');
    console.log('MCP SDK imported successfully');

    // Set up MCP client
    client = new Client({
      name: 'electron-client',
      version: '1.0.0',
    });

    console.log('Attempting to connect MCP client...');
    await client.connect(new StdioClientTransport(mcpProcess.stdout, mcpProcess.stdin));
    console.log('MCP client connected successfully');
  } catch (error) {
    console.error('Error initializing MCP client:', error);
  }

  // Optional: Handle MCP output
  mcpProcess.stdout.on('data', (data) => {
    console.log(`MCP: ${data}`);
  });

  mcpProcess.stderr.on('data', (data) => {
    console.error(`MCP Error: ${data}`);
  });

  // IPC handler
  ipcMain.handle('execute-tool', async (event, { toolName, args }) => {
    console.log('IPC: Received execute-tool request for tool:', toolName, 'with args:', args);
    try {
      const result = await client.callTool({
        name: toolName,
        arguments: args,
      });
      console.log('IPC: Tool execution result:', result);
      return result;
    } catch (error) {
      console.error('IPC: Error executing tool:', error);
      let errorMsg = error.message;
      if (errorMsg.toLowerCase().includes('tool') && errorMsg.toLowerCase().includes('not found')) {
        errorMsg = 'Unknown tool';
      }
      return { error: errorMsg };
    }
  });

  app.on('window-all-closed', () => {
    if (mcpProcess) mcpProcess.kill();
    if (process.platform !== 'darwin') app.quit();
  });
});
}, 1000);