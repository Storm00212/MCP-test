import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/core';

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
      // Check Python backend connection
      try {
        await invoke('check_python_backend');
        set({ backendPython: 'connected' });
      } catch {
        set({ backendPython: 'disconnected' });
      }
      
      // Check Node.js backend connection  
      try {
        await invoke('check_node_backend');
        set({ backendNode: 'connected' });
      } catch {
        set({ backendNode: 'disconnected' });
      }
      
      // Start metrics polling
      get().updateSystemMetrics();
    } catch (error) {
      console.error('Failed to initialize system:', error);
    }
  },
  
  updateSystemMetrics: async () => {
    try {
      const metrics = await invoke<SystemMetrics>('get_system_metrics');
      set({ systemMetrics: metrics });
    } catch (error) {
      console.error('Failed to get system metrics:', error);
    }
  },
  
  launchApp: async (appName: string) => {
    if (!WHITELISTED_APPS.includes(appName as AppName)) {
      console.error(`App ${appName} is not whitelisted`);
      return;
    }
    
    try {
      await invoke('launch_application', { appName });
      set(state => ({
        apps: state.apps.map(app =>
          app.name === appName ? { ...app, status: 'running' } : app
        )
      }));
    } catch (error) {
      console.error(`Failed to launch ${appName}:`, error);
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
      const response = await invoke<{ response: string }>('query_rag', { query });
      
      const assistantMessage: RAGMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date().toISOString()
      };
      
      set(state => ({
        ragMessages: [...state.ragMessages, assistantMessage],
        ragLoading: false
      }));
    } catch (error) {
