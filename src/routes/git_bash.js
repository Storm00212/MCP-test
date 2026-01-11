import { z } from "zod";
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default (server) => {
  server.tool(
    "execute_git_bash_command",
    {
      command: z.string().describe("The git bash command to execute, e.g., 'mkdir newfolder' or 'touch newfile.txt'"),
    },
    async ({ command }) => {
      try {
        let execOptions = {};
        if (process.platform === 'win32') {
          // For Windows-specific commands like 'start', don't use bash shell
          if (command.startsWith('start ')) {
            // Use default shell (cmd.exe) for start commands
            execOptions = {};
          } else {
            // Use git bash for other commands
            execOptions = { shell: 'C:\\Program Files\\Git\\bin\\bash.exe' };
          }
        } else {
          execOptions = { shell: 'bash' };
        }
        const { stdout, stderr } = await execAsync(command, execOptions);
        return {
          content: [
            {
              type: "text",
              text: `Command executed successfully.\nStdout: ${stdout}\nStderr: ${stderr}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing command: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
};