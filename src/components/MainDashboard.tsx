import React from 'react';
import TelemetryPanel from './TelemetryPanel';
import AITerminal from './AITerminal';
import MCPActivity from './MCPActivity';

const MainDashboard: React.FC = () => {
  return (
    <main className="flex-1 p-4 grid grid-cols-2 grid-rows-2 gap-4 bg-transparent">
      {/* Top-left: Telemetry */}
      <div className="cyber-panel col-span-1 row-span-1">
        <TelemetryPanel />
      </div>

      {/* Top-right: MCP Activity */}
      <div className="cyber-panel col-span-1 row-span-1">
        <MCPActivity />
      </div>

      {/* Bottom: AI Terminal */}
      <div className="cyber-panel col-span-2 row-span-1">
        <AITerminal />
      </div>
    </main>
  );
};

export default MainDashboard;
