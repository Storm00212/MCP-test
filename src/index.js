#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Import route handlers
import gitBash from './routes/git_bash.js';
import whatsappOpen from './routes/whatsapp_open.js';
import whatsappSend from './routes/whatsapp_send.js';
import proteus from './routes/proteus.js';
import ltspice from './routes/ltspice.js';
import youtube from './routes/youtube.js';
import matlab from './routes/matlab.js';
import chrome from './routes/chrome.js';
import cursor from './routes/cursor.js';
import github from './routes/github.js';

// Create an MCP server
const server = new McpServer({
  name: "app-launcher-server",
  version: "0.1.0"
});

// Register tools
gitBash(server);
whatsappOpen(server);
whatsappSend(server);
proteus(server);
ltspice(server);
youtube(server);
matlab(server);
chrome(server);
cursor(server);
github(server);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Git WhatsApp MCP server running on stdio');