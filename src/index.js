#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

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
      let execOptions = {};
      if (process.platform === 'win32') {
        // For Windows-specific commands like 'start', don't use bash shell
        if (command.startsWith('start ')) {
          // Use default shell (cmd.exe) for start commands
          execOptions = {};
        } else {
          // Use git bash for other commands
          execOptions = { shell: 'C:\\Program Files\\Git\\bin\\bash.exe' };
        }
      } else {
        execOptions = { shell: 'bash' };
      }
      const { stdout, stderr } = await execAsync(command, execOptions);
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
      // Ensure phone starts with +
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
      // Encode the text for URL
      const encodedText = encodeURIComponent(text);
      // On Windows, use 'start' to open WhatsApp send URL
      const command = process.platform === 'win32'
        ? `start "" "whatsapp://send?phone=${formattedPhone}&text=${encodedText}"`
        : `open whatsapp://send?phone=${formattedPhone}&text=${encodedText}`;
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

// Tool for opening Proteus 8
server.tool(
  "open_proteus",
  {
    filePath: z.string().optional().describe("Optional path to a Proteus project file to open"),
  },
  async ({ filePath }) => {
    const proteusPath = 'C:\\Program Files (x86)\\Labcenter Electronics\\Proteus 8 Professional\\BIN\\PROTEUS.EXE';
    if (!existsSync(proteusPath)) {
      return {
        content: [
          {
            type: "text",
            text: "Proteus 8 is not installed or the executable path is incorrect.",
          },
        ],
        isError: true,
      };
    }
    try {
      const command = process.platform === 'win32'
        ? `start "" "${proteusPath}"${filePath ? ` "${filePath}"` : ''}`
        : `proteus${filePath ? ` "${filePath}"` : ''}`; // Assuming proteus command on other platforms
      await execAsync(command);
      console.error(`Launched Proteus 8 at ${new Date().toISOString()}`);
      return {
        content: [
          {
            type: "text",
            text: `Proteus 8 opened successfully${filePath ? ` with file: ${filePath}` : ''}.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error opening Proteus 8: ${error.message}.`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool for opening LTSpice
server.tool(
  "open_ltspice",
  {
    filePath: z.string().optional().describe("Optional path to an LTSpice schematic file to open"),
  },
  async ({ filePath }) => {
    try {
      const ltspicePath = '"C:\\Program Files\\LTC\\LTspiceXVII\\XVIIx64.exe"'; // Adjust path as needed
      const command = process.platform === 'win32'
        ? `start "" ${ltspicePath}${filePath ? ` "${filePath}"` : ''}`
        : `ltspice${filePath ? ` "${filePath}"` : ''}`; // Assuming ltspice command
      await execAsync(command);
      console.error(`Launched LTSpice at ${new Date().toISOString()}`);
      return {
        content: [
          {
            type: "text",
            text: `LTSpice opened successfully${filePath ? ` with file: ${filePath}` : ''}.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error opening LTSpice: ${error.message}. It may not be installed or the path is incorrect.`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool for opening YouTube
server.tool(
  "open_youtube",
  {
    query: z.string().optional().describe("Optional search query or video URL to open on YouTube"),
  },
  async ({ query }) => {
    try {
      let url = 'https://www.youtube.com';
      if (query) {
        if (query.startsWith('http')) {
          url = query;
        } else {
          url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        }
      }
      const command = process.platform === 'win32'
        ? `start chrome "${url}"`
        : `google-chrome "${url}"`; // Assuming chrome command
      await execAsync(command);
      console.error(`Opened YouTube at ${new Date().toISOString()}`);
      return {
        content: [
          {
            type: "text",
            text: `YouTube opened successfully${query ? ` with query/URL: ${query}` : ''}.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error opening YouTube: ${error.message}. Chrome may not be installed.`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool for opening MATLAB
server.tool(
  "open_matlab",
  {
    args: z.string().optional().describe("Optional arguments to pass to MATLAB, e.g., -r 'script.m'"),
  },
  async ({ args }) => {
    try {
      const matlabPath = '"C:\\Program Files\\MATLAB\\R2023a\\bin\\matlab.exe"'; // Adjust version as needed
      const command = process.platform === 'win32'
        ? `start "" ${matlabPath}${args ? ` ${args}` : ''}`
        : `matlab${args ? ` ${args}` : ''}`; // Assuming matlab command
      await execAsync(command);
      console.error(`Launched MATLAB at ${new Date().toISOString()}`);
      return {
        content: [
          {
            type: "text",
            text: `MATLAB opened successfully${args ? ` with args: ${args}` : ''}.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error opening MATLAB: ${error.message}. It may not be installed or the path is incorrect.`,
          },
        ],
        isError: true,
      };
    }
  }
);

// Tool for opening Google Chrome
server.tool(
  "open_chrome",
  {
    url: z.string().optional().describe("Optional URL to open in Chrome"),
  },
  async ({ url }) => {
    try {
      const command = process.platform === 'win32'
        ? `start chrome${url ? ` "${url}"` : ''}`
        : `google-chrome${url ? ` "${url}"` : ''}`;
      await execAsync(command);
      console.error(`Opened Chrome at ${new Date().toISOString()}`);
      return {
        content: [
          {
            type: "text",
            text: `Google Chrome opened successfully${url ? ` with URL: ${url}` : ''}.`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error opening Google Chrome: ${error.message}. It may not be installed.`,
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