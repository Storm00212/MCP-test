import { create } from 'zustand';
import axios from 'axios';

// API base URL - proxied through Vite
const API_BASE = ''; // Uses Vite proxy to localhost:3001

// Types
export interface SystemMetrics {
  cpu: number;
  ram: number;
  temperature: number;
  network: 'online' | 'offline';
}

export interface AppState {
  name: string;
  status: 'running' | 'stopped' | 'error';
}

export interface MCPLog {
  id: string;
  timestamp: string;
  tool: string;
  input: Record<string, unknown>;
  output: string;
  status: 'success' | 'error';
}

export interface RAGMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface StoreState {
  // System state
  systemMetrics: SystemMetrics;
  backendPython: 'connected' | 'disconnected' | 'error';
  backendNode: 'connected' | 'disconnected' | 'error';
  
  // App state
  apps: AppState[];
  voiceActive: boolean;
  
  // RAG state
  ragMessages: RAGMessage[];
  ragLoading: boolean;
  
  // MCP state
  mcpLogs: MCPLog[];
  
  // Actions
  initializeSystem: () => Promise<void>;
  updateSystemMetrics: () => Promise<void>;
  launchApp: (appName: string) => Promise<void>;
  sendRAGQuery: (query: string) => Promise<void>;
  toggleVoice: () => Promise<void>;
  addMCPLog: (log: MCPLog) => void;
}

// Application whitelist
const WHITELISTED_APPS = [
  'ltspice', 'matlab', 'proteus', 'vscode', 'chrome', 'whatsapp', 'youtube'
] as const;

type AppName = typeof WHITELISTED_APPS[number];

// Simulated system metrics for demo
const getSimulatedMetrics = (): SystemMetrics => ({
  cpu: Math.floor(Math.random() * 30) + 10,
  ram: Math.floor(Math.random() * 40) + 30,
  temperature: Math.floor(Math.random() * 15) + 40,
  network: 'online'
});

export const useStore = create<StoreState>((set, get) => ({
  // Initial state
  systemMetrics: {
    cpu: 0,
    ram: 0,
    temperature: 45,
    network: 'online'
  },
  backendPython: 'disconnected',
  backendNode: 'disconnected',
  apps: WHITELISTED_APPS.map(name => ({ name, status: 'stopped' })),
  voiceActive: false,
  ragMessages: [],
  ragLoading: false,
  mcpLogs: [],
  
  // Actions
  initializeSystem: async () => {
    try {
      // Check Node.js backend connection
      try {
        const response = await axios.get(`${API_BASE}/health`, { timeout: 2000 });
        if (response.status === 200) {
          set({ backendNode: 'connected' });
        }
      } catch {
        set({ backendNode: 'disconnected' });
      }
      
      // Check Python backend connection
      try {
        const response = await axios.get('http://localhost:8000/health', { timeout: 2000 });
        if (response.status === 200) {
          set({ backendPython: 'connected' });
        }
      } catch {
        // Python backend might not be running, that's okay
        set({ backendPython: 'disconnected' });
      }
      
      // Start metrics polling with simulated data
      get().updateSystemMetrics();
    } catch (error) {
      console.error('Failed to initialize system:', error);
    }
  },
  
  updateSystemMetrics: async () => {
    try {
      // Try to get real metrics from backend
      const response = await axios.get(`${API_BASE}/api/system/info`, { timeout: 2000 });
      if (response.data?.data?.memoryUsage) {
        const memUsage = response.data.data.memoryUsage;
        const memPercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
        
        set({ 
          systemMetrics: {
            cpu: Math.floor(Math.random() * 30) + 10, // Simulated for now
            ram: memPercent,
            temperature: Math.floor(Math.random() * 15) + 40,
            network: 'online'
          }
        });
      }
    } catch {
      // Use simulated metrics if backend unavailable
      set({ systemMetrics: getSimulatedMetrics() });
    }
    
    // Poll every 5 seconds
    setTimeout(() => get().updateSystemMetrics(), 5000);
  },
  
  launchApp: async (appName: string) => {
    if (!WHITELISTED_APPS.includes(appName as AppName)) {
      console.error(`App ${appName} is not whitelisted`);
      return;
    }
    
    try {
      // Use Node.js backend to spawn the application
      await axios.post(`${API_BASE}/api/processes/spawn`, {
        command: getAppCommand(appName),
        name: appName
      });
      
      set(state => ({
        apps: state.apps.map(app =>
          app.name === appName ? { ...app, status: 'running' } : app
        )
      }));
    } catch (error) {
      console.error(`Failed to launch ${appName}:`, error);
      // Mark as running anyway for demo purposes
      set(state => ({
        apps: state.apps.map(app =>
          app.name === appName ? { ...app, status: 'running' } : app
        )
      }));
    }
  },
  
  sendRAGQuery: async (query: string) => {
    set({ ragLoading: true });
    
    // Add user message
    const userMessage: RAGMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toISOString()
    };
    
    set(state => ({
      ragMessages: [...state.ragMessages, userMessage]
    }));
    
    try {
      // Try Python backend first
      const response = await axios.post('http://localhost:8000/query', { query }, { timeout: 30000 });
      
      const assistantMessage: RAGMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response || response.data,
        timestamp: new Date().toISOString()
      };
      
      set(state => ({
        ragMessages: [...state.ragMessages, assistantMessage],
        ragLoading: false
      }));
    } catch (error) {
      // Fallback demo response
      const assistantMessage: RAGMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
