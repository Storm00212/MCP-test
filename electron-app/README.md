# Futuristic Terminal Electron App

A sleek, futuristic desktop application built with Electron that provides a terminal-like interface for interacting with various MCP (Model Context Protocol) tools. Features advanced UI elements including holographic overlays, animated grids, voice input, and multiple themes.

## Project Overview

This Electron application serves as a user-friendly frontend for an MCP server, allowing users to execute commands that launch applications, perform RAG queries on class notes, and integrate with engineering software. The interface combines a retro terminal aesthetic with modern holographic and neon-themed visual effects.

## Features

- **Terminal Interface**: Command-line style input with output display
- **Voice Input**: Speech recognition for hands-free command entry
- **Multiple Themes**: Neon color schemes (green, blue, red, purple, dark)
- **Keyboard Shortcuts**: Efficient navigation and control
- **Holographic UI Elements**: Animated overlays and data streams
- **Grid Background**: Dynamic animated grid pattern
- **MCP Integration**: Seamless connection to MCP server for tool execution
- **Cross-Platform**: Runs on Windows, macOS, and Linux

## Prerequisites

- Node.js (version 14 or higher)
- npm (comes with Node.js)
- OpenAI API key (for RAG functionality)
- Chrome browser (for web-based tools)

## Installation

1. Navigate to the electron-app directory:
   ```bash
   cd electron-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory (next to package.json)
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=your_openai_api_key_here
     ```

## Running the App

Start the application with:
```bash
npm start
```

This will launch the Electron window displaying the terminal interface.

## Usage Instructions

### Basic Commands

Enter commands in the input field and press Ctrl+Enter to execute. Commands are sent to the MCP server for processing.

Example commands:
- `open_chrome https://example.com` - Opens Chrome with the specified URL
- `open_github username` - Opens GitHub profile for the specified user
- `query_class_notes "What is electromagnetic induction?"` - Queries the RAG system for information from class notes

### Voice Input

1. Click the microphone button or press Ctrl+M to start voice recognition
2. Speak your command clearly
3. The speech will be transcribed into the input field
4. Press Ctrl+Enter to execute

Note: Voice input requires a compatible browser with speech recognition support.

### Themes

Change the visual theme using:
- The dropdown selector in the top-left corner
- Keyboard shortcut: Ctrl+T to cycle through themes

Available themes:
- Default Dark: Classic black background with green accents
- Neon Green: Dark green background with bright green glows
- Neon Blue: Dark blue background with blue accents
- Neon Red: Dark red background with red highlights
- Neon Purple: Dark purple background with purple effects

### Keyboard Shortcuts

- **Ctrl+Enter**: Submit command
- **Ctrl+M**: Toggle microphone (voice input)
- **Ctrl+T**: Cycle through themes
- **Ctrl+L**: Clear terminal output
- **Ctrl+H**: Show help overlay

### UI Elements Description

- **Terminal Area**: Main command input and output display with scrolling history
- **Theme Selector**: Dropdown in top-left for theme selection
- **Holographic Overlay**: Semi-transparent animated panels with glow effects
- **Grid Background**: Animated grid pattern that responds to theme changes
- **Data Streams**: Flowing data visualizations in the background
- **Help Overlay**: Press Ctrl+H to display available shortcuts and commands

## Available MCP Tools

The application integrates with the following MCP tools:

### Application Launchers
- **open_chrome** [url]: Opens Google Chrome browser, optionally with a specified URL
- **open_github** [username]: Opens GitHub profile page (defaults to Storm00212)
- **open_whatsapp**: Opens WhatsApp desktop application
- **send_whatsapp** [message]: Sends a message via WhatsApp (requires WhatsApp to be open)
- **open_youtube**: Opens YouTube in the default browser

### Engineering Software
- **open_ltspice**: Launches LTSpice circuit simulation software
- **open_matlab**: Opens MATLAB engineering software
- **open_proteus**: Launches Proteus design suite
- **open_cursor**: Opens Cursor code editor

### Development Tools
- **open_git_bash**: Opens Git Bash terminal

### AI/ML Tools
- **load_vector_store**: Initializes the FAISS vector store for RAG queries
- **query_class_notes** [question]: Performs retrieval-augmented generation queries on electrical engineering class notes

## Troubleshooting

### Common Issues

1. **"Speech recognition not supported"**
   - Voice input requires a browser with Web Speech API support
   - Ensure you're using a modern browser version

2. **"Unknown tool" error**
   - Verify the command name is spelled correctly
   - Check that the MCP server is running properly

3. **RAG queries not working**
   - Ensure OPENAI_API_KEY is set in the .env file
   - Run `load_vector_store` first to initialize the vector database
   - Check that FAISS index files are present in the faiss_index directory

4. **Application won't start**
   - Verify Node.js and npm are installed
   - Run `npm install` to ensure all dependencies are installed
   - Check that the MCP server (../src/index.js) exists and is executable

5. **Tools fail to launch applications**
   - Ensure the target applications are installed on your system
   - Check system PATH for executable locations
   - On Windows, some tools may require Chrome to be in the default location

### Debug Mode

For development debugging:
- Open Developer Tools: View → Toggle Developer Tools
- Check the console for MCP server output and errors
- Verify IPC communication in the main process logs

## Development Notes

### Architecture

The application follows Electron's main/renderer process architecture:
- **Main Process** (main.js): Handles window management, MCP server spawning, and IPC
- **Renderer Process** (src/App.js): Manages UI, user input, and command processing

### Adding New Tools

To add new MCP tools:

1. Create a new route file in `../src/routes/your_tool.js`
2. Define the tool using the MCP SDK:
   ```javascript
   export default (server) => {
     server.tool(
       "your_tool_name",
       {
         param: z.string().describe("Parameter description"),
       },
       async ({ param }) => {
         // Tool implementation
         return {
           content: [{ type: "text", text: "Result" }],
         };
       }
     );
   };
   ```
3. Import and register the route in `../src/index.js`

### UI Customization

- Themes are defined in `src/App.js` in the `themes` object
- CSS variables are used for dynamic theming
- Components are located in `src/` directory

### Building for Production

To build distributable packages:
```bash
npm run build  # If build script is configured
```

Note: Build configuration may need to be added to package.json for production releases.

### Contributing

When contributing:
- Follow the existing code style and structure
- Test new tools thoroughly
- Update this README with new features or tools
- Ensure cross-platform compatibility

For questions or issues, refer to the troubleshooting section or check the Developer Tools console.