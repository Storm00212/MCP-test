import React from 'react';
import TelemetryPanel from './TelemetryPanel';
import AITerminal from './AITerminal';
import MCPActivity from './MCPActivity';

const MainDashboard: React.FC = () => {
  return (
    <main className="flex-1 flex flex-col bg-cyber-dark overflow-hidden">
      {/* Top section: 3D Telemetry */}
      <div className="h-1/3 border-b border-cyber-border">
        <TelemetryPanel />
      </div>

      {/* Middle section: AI Terminal */}
      <div className="h-1/3 border-b border-cyber-border">
        <AITerminal />
      </div>

      {/* Bottom section: MCP Activity Log */}
      <div className="h-1/3">
        <MCPActivity />
      </div>
    </main>
  );
};

export default MainDashboard;
