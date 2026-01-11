import { z } from "zod";
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';

const execAsync = promisify(exec);

export default (server) => {
  server.tool(
    "open_proteus",
    {
      filePath: z.string().optional().describe("Optional path to a Proteus project file to open"),
    },
    async ({ filePath }) => {
      const proteusPath = 'C:\\Program Files (x86)\\Labcenter Electronics\\Proteus 8 Professional\\BIN\\PDS.EXE';
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
};