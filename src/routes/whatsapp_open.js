import { z } from "zod";
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default (server) => {
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
};