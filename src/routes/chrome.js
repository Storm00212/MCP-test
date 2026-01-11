import { z } from "zod";
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default (server) => {
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
};