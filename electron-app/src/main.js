console.log('process.type:', process.type);
console.log('process.versions.electron:', process.versions.electron);
console.log('global.app:', global.app);
const electron = require('electron');
console.log('electron:', electron);
const { app, BrowserWindow, ipcMain } = electron;
console.log('app:', app);
const path = require('path');
const { spawn } = require('child_process');
let mainWindow;

let mcpProcess;

let client;

function createWindow() {
  console.log('__dirname:', __dirname);
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // For React require, will change to false later with preload
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
}

app.on('ready', async () => {
  createWindow();

  // Spawn MCP server as child process
  mcpProcess = spawn('node', ['../src/index.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: ['pipe', 'pipe', 'pipe']
  });

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

    await client.connect(new StdioClientTransport(mcpProcess.stdout, mcpProcess.stdin));
    console.log('MCP client connected');
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
    try {
      const result = await client.callTool({
        name: toolName,
        arguments: args,
      });
      return result;
    } catch (error) {
      let errorMsg = error.message;
      if (errorMsg.toLowerCase().includes('tool') && errorMsg.toLowerCase().includes('not found')) {
        errorMsg = 'Unknown tool';
      }
      return { error: errorMsg };
    }
  });
});

app.on('window-all-closed', () => {
  if (mcpProcess) mcpProcess.kill();
  if (process.platform !== 'darwin') app.quit();
});