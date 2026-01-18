import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client';
let mainWindow;

let mcpProcess;

let client;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // For React require, will change to false later with preload
      contextIsolation: false
    }
  });

  mainWindow.loadFile('dist/index.html');
}

app.whenReady().then(async () => {
  createWindow();

  // Spawn MCP server as child process
  mcpProcess = spawn('node', ['../src/index.js'], {
    cwd: path.join(__dirname, '..'),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Dynamically import MCP SDK
  const { Client } = await import('@modelcontextprotocol/sdk/client');
  const { StdioClientTransport } = await import('@modelcontextprotocol/sdk/client');

  // Set up MCP client
  client = new Client({
    name: 'electron-client',
    version: '1.0.0',
  });

  await client.connect(new StdioClientTransport(mcpProcess.stdout, mcpProcess.stdin));

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