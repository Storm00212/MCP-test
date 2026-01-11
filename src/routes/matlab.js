import { z } from "zod";
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default (server) => {
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
};