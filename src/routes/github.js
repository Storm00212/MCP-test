import { z } from "zod";
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default (server) => {
  server.tool(
    "open_github",
    {
      username: z.string().optional().describe("GitHub username to open profile for, defaults to Storm00212"),
    },
    async ({ username }) => {
      try {
        const user = username || 'Storm00212';
        const url = `https://github.com/${user}`;
        const command = process.platform === 'win32'
          ? `start chrome "${url}"`
          : `google-chrome "${url}"`; // Assuming chrome command
        await execAsync(command);
        console.error(`Opened GitHub at ${new Date().toISOString()}`);
        return {
          content: [
            {
              type: "text",
              text: `GitHub profile for ${user} opened successfully.`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error opening GitHub: ${error.message}. Chrome may not be installed.`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};