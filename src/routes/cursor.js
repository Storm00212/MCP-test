import { z } from "zod";
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

export default (server) => {
  server.tool(
    "open_cursor",
    {
      filePath: z.string().optional().describe("Optional path to a file or folder to open in Cursor"),
    },
    async ({ filePath }) => {
      const cursorPath = 'C:\\Users\\User\\AppData\\Local\\Programs\\cursor\\Cursor.exe'; // Adjust if different
      if (!existsSync(cursorPath)) {
        return {
          content: [
            {
              type: "text",
              text: "Cursor is not installed or the executable path is incorrect.",
            },
          ],
          isError: true,
        };
      }
      try {
        const command = process.platform === 'win32'
          ? `start "" "${cursorPath}"${filePath ? ` "${filePath}"` : ''}`
          : `cursor${filePath ? ` "${filePath}"` : ''}`; // Assuming cursor command on other platforms
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
              text: `Error opening Cursor: ${error.message}.`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};