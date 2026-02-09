# Engineering Command OS

## Tauri-Based AI-Powered Desktop Engineering Interface

A modern, local-first desktop command cockpit designed for engineers to launch and control software, orchestrate AI agents, render 3D telemetry, and perform secure OS-level automation.

### Features

- **Application Launcher**: Launch engineering software (Proteus, LTSpice, MATLAB, VSCode, Chrome, WhatsApp, YouTube)
- **AI Terminal**: Query a RAG-powered knowledge base with natural language
- **3D Telemetry Visualization**: Real-time 3D visualizations using Three.js
- **MCP Activity Logging**: Track all MCP tool calls and agent interactions
- **System Monitoring**: CPU, RAM, temperature, and network status
- **Voice Activation**: Toggle voice recognition for hands-free control

### Architecture

```
[ React UI + Three.js 3D Panels ]
              ↓
[ Tauri Minimal Rust Bridge (IPC) ]
              ↓
[ Local Backend Layer ]
    ├─ Python: AI, RAG, MCP, Voice, Automation Logic
    └─ Node.js: Browser automation, App launching, Web API calls
              ↓
[ OS & External Applications ]
```

### Tech Stack

- **Desktop Framework**: Tauri v2 (Rust + WebView2)
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **State Management**: Zustand
- **Backend (Primary)**: Python FastAPI (RAG, MCP, Voice, Automation)
- **Backend (Supplementary)**: Node.js Express (Browser automation)
- **Visualization**: Three.js, @react-three/fiber, ECharts, xterm.js
- **Security**: Whitelisted commands only, secure IPC via Tauri

### Quick Start

#### Prerequisites

- Node.js 18+
- Python 3.11+
- Rust & Cargo (for Tauri)
- Windows 10/11 (current platform)

#### Installation

1. **Clone and setup**

```bash
# Install frontend dependencies
npm install

# Install Python backend dependencies
cd backend/python
pip install -r requirements.txt
cd ../..

# Install Node.js backend dependencies
cd backend/node
npm install
cd ../..
```

2. **Configure environment**

Create a `.env` file in the root:

```env
OPENAI_API_KEY=your-api-key-here
```

3. **Run development servers**

```bash
# Start all services (Python, Node.js, and Vite frontend)
npm run start:all
```

Or run individually:

```bash
# Terminal 1: Python backend (port 8000)
npm run backend:python

# Terminal 2: Node.js backend (port 3001)
npm run backend:node

# Terminal 3: Vite dev server (port 5173)
npm run dev
```

4. **Build Tauri app**

```bash
npm run tauri build
```

### Project Structure

```
engineering-command-os/
├── src/                    # React frontend
│   ├── components/        # UI components
│   │   ├── Sidebar.tsx
│   │   ├── MainDashboard.tsx
│   │   ├── TelemetryPanel.tsx
│   │   ├── AITerminal.tsx
│   │   ├── MCPActivity.tsx
│   │   ├── SystemStatus.tsx
│   │   └── AppLauncher.tsx
│   ├── store/            # Zustand state management
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── src-tauri/            # Tauri Rust backend
│   ├── src/
│   │   ├── main.rs
│   │   └── backend.rs
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── build.rs
├── backend/
│   ├── python/           # FastAPI backend
│   │   ├── main.py
│   │   └── requirements.txt
│   └── node/            # Express backend
│       ├── src/index.js
│       └── package.json
├── data/                 # Engineering documents (PDFs)
├── faiss_index/          # FAISS vector index
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

### Whitelisted Applications

| App Name    | Description                  |
|-------------|------------------------------|
| ltspice     | Circuit simulation           |
| matlab      | Numerical computing          |
| proteus     | PCB design & simulation     |
| vscode      | Code editor                 |
| chrome      | Web browser                 |
| whatsapp    | Messaging (web interface)   |
| youtube     | Video platform (web)        |

### API Endpoints

#### Python Backend (port 8000)

- `GET /health` - Health check
- `GET /system/metrics` - Get CPU, RAM, temperature
- `POST /app/launch` - Launch whitelisted application
- `POST /rag/query` - Query RAG knowledge base
- `WS /ws/logs` - WebSocket for real-time logs

#### Node.js Backend (port 3001)

- `GET /health` - Health check
- `POST /browser/open` - Open URL in browser
- `POST /whatsapp/send` - Send WhatsApp message
- `POST /youtube/search` - Search YouTube
- `GET /processes` - List active processes
- `POST /process/spawn` - Spawn new process

### RAG System

The RAG system uses:
- **Embeddings**: OpenAI text-embedding-ada-002
- **Vector Store**: FAISS (loaded from `faiss_index/`)
- **LLM**: GPT-3.5-turbo
- **Documents**: Engineering PDFs from `data/`

To rebuild the vector index, run:
```bash
cd backend/python
python -c "from rag_builder import rebuild_index; rebuild_index()"
```

### Security

- All application launches are whitelisted
- No arbitrary shell execution allowed
- Rust bridge validates all inputs from UI
- MCP tool calls are logged for auditing

### License

MIT License
