import React from 'react';
import { useStore } from '../store';
import SystemStatus from './SystemStatus';
import AppLauncher from './AppLauncher';

const Sidebar: React.FC = () => {
  const { voiceActive, toggleVoice } = useStore();

  return (
    <aside className="w-64 bg-cyber-panel border-r border-cyber-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-cyber-border">
        <h1 className="text-lg font-bold text-cyber-accent font-mono">
          ENGINEERING<br />
          COMMAND OS
        </h1>
        <div className="text-xs text-gray-500 mt-1">v1.0.0 • Tauri</div>
      </div>

      {/* System Status */}
      <SystemStatus />

      {/* App Launcher */}
      <AppLauncher />

      {/* Voice Toggle */}
      <div className="p-4 border-t border-cyber-border">
        <button
          onClick={toggleVoice}
          className={`w-full py-2 px-4 rounded-lg font-mono text-sm transition-all ${
            voiceActive
              ? 'bg-cyber-accent text-cyber-dark glow-accent'
              : 'bg-cyber-border text-gray-300 hover:bg-gray-700'
          }`}
        >
          {voiceActive ? '🎤 VOICE ACTIVE' : '🎤 VOICE OFF'}
        </button>
      </div>

      {/* Backend Status */}
      <div className="p-4 border-t border-cyber-border text-xs font-mono">
        <div className="flex items-center gap-2 mb-2">
          <span className="status-dot status-online"></span>
          <span>Python: Connected</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="status-dot status-online"></span>
          <span>Node.js: Connected</span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
