import React from 'react';
import { useStore } from '../store';
import SystemStatus from './SystemStatus';
import AppLauncher from './AppLauncher';

const Sidebar: React.FC = () => {
  const { voiceActive, toggleVoice } = useStore();

  return (
    <aside className="w-64 bg-transparent border-r border-cyber-border/50 flex flex-col p-4 space-y-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl font-bold text-cyber-accent font-mono">
          E C O S
        </h1>
      </div>

      {/* System Status */}
      <SystemStatus />

      {/* App Launcher */}
      <AppLauncher />

      {/* Voice Toggle */}
      <div className="pt-4 border-t border-cyber-border/30">
        <button
          onClick={toggleVoice}
          className={`w-full py-2 px-4 rounded-md font-mono text-sm transition-all border ${
            voiceActive
              ? 'bg-cyber-accent/20 text-cyber-accent border-cyber-accent'
              : 'bg-transparent text-gray-400 border-cyber-border/50 hover:bg-cyber-panel/50 hover:text-white'
          }`}
        >
          {voiceActive ? 'VOICE: ON' : 'VOICE: OFF'}
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
