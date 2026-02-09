import React from 'react';
import { useStore } from '../store';

const APPS_CONFIG = [
  { name: 'ltspice', icon: '🔌', label: 'LTSpice' },
  { name: 'matlab', icon: '📊', label: 'MATLAB' },
  { name: 'proteus', icon: '🔧', label: 'Proteus' },
  { name: 'vscode', icon: '💻', label: 'VSCode' },
  { name: 'chrome', icon: '🌐', label: 'Chrome' },
  { name: 'whatsapp', icon: '💬', label: 'WhatsApp' },
  { name: 'youtube', icon: '▶️', label: 'YouTube' },
] as const;

const AppLauncher: React.FC = () => {
  const { apps, launchApp } = useStore();

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <h2 className="text-xs font-mono text-gray-400 mb-3 uppercase tracking-wider">
        App Launcher
      </h2>
      
      <div className="grid grid-cols-2 gap-2">
        {APPS_CONFIG.map((app) => {
          const appState = apps.find(a => a.name === app.name);
          const isRunning = appState?.status === 'running';
          
          return (
            <button
              key={app.name}
              onClick={() => launchApp(app.name)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg transition-all ${
                isRunning
                  ? 'bg-cyber-accent/20 border border-cyber-accent glow-accent'
                  : 'bg-cyber-dark border border-cyber-border hover:border-cyber-accent'
              }`}
            >
              <span className="text-2xl mb-1">{app.icon}</span>
              <span className="text-xs font-mono text-gray-300">{app.label}</span>
              {isRunning && (
                <span className="text-[10px] text-cyber-success mt-1">RUNNING</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AppLauncher;
