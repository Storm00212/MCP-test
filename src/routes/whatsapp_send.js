import { z } from "zod";
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default (server) => {
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
};