#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Create an MCP server
const server = new McpServer({
  name: "git-whatsapp-server",
  version: "0.1.0"
});

// Tool for executing git bash commands
server.tool(
  "execute_git_bash_command",
  {
    command: z.string().describe("The git bash command to execute, e.g., 'mkdir newfolder' or 'touch newfile.txt'"),
  },
  async ({ command }) => {
    try {
      // On Windows, git bash is typically at C:\Program Files\Git\bin\bash.exe
      // But we'll try to use 'bash' assuming it's in PATH
      const shell = process.platform === 'win32' ? 'C:\\Program Files\\Git\\bin\\bash.exe' : 'bash';
      const { stdout, stderr } = await execAsync(command, { shell });
      return {
        content: [
          {
            type: "text",
            text: `Command executed successfully.\nStdout: ${stdout}\nStderr: ${stderr}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error executing command: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool for opening WhatsApp
server.tool(
  "open_whatsapp",
  {},
  async () => {
    try {
      // On Windows, use 'start' to open WhatsApp protocol
      const command = process.platform === 'win32' ? 'start whatsapp:' : 'open whatsapp:';
      await execAsync(command);
      return {
        content: [
          {
            type: "text",
            text: "WhatsApp opened successfully.",
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error opening WhatsApp: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool for sending WhatsApp message
server.tool(
  "send_whatsapp_message",
  {
    phone: z.string().describe("Phone number with country code (e.g., 1234567890)"),
    text: z.string().describe("Message text to send"),
  },
  async ({ phone, text }) => {
    try {
      // Encode the text for URL
      const encodedText = encodeURIComponent(text);
      // On Windows, use 'start' to open WhatsApp send URL
      const command = process.platform === 'win32'
        ? `start whatsapp://send?phone=${phone}&text=${encodedText}`
        : `open whatsapp://send?phone=${phone}&text=${encodedText}`;
      await execAsync(command);
      return {
        content: [
          {
            type: "text",
            text: `WhatsApp message prepared for ${phone}. Please review and send in the opened WhatsApp window.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error sending WhatsApp message: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Git WhatsApp MCP server running on stdio');