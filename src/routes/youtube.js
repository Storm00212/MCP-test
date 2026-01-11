import { z } from "zod";
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default (server) => {
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
};