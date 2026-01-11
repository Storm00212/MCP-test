import { z } from "zod";
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default (server) => {
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
};