import { z } from "zod";
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default (server) => {
  server.tool(
    "open_cursor",
    {
      filePath: z.string().optional().describe("Optional path to a file or folder to open in Cursor"),
    },
    async ({ filePath }) => {
      try {
        const command = process.platform === 'win32'
          ? `start cursor${filePath ? ` "${filePath}"` : ''}`
          : `cursor${filePath ? ` "${filePath}"` : ''}`;
        await execAsync(command);
        console.error(`Launched Cursor at ${new Date().toISOString()}`);
        return {
          content: [
            {
              type: "text",
              text: `Cursor opened successfully${filePath ? ` with file/folder: ${filePath}` : ''}.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error opening Cursor: ${error.message}. It may not be installed or not in PATH.`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};