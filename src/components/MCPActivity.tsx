import React from 'react';
import { useStore } from '../store';

const MCPActivity: React.FC = () => {
  const { mcpLogs } = useStore();

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-cyber-border bg-cyber-panel">
        <h2 className="text-xs font-mono text-cyber-secondary uppercase tracking-wider flex items-center gap-2">
          <span>◇</span> MCP Activity Log
        </h2>
        <div className="text-xs text-gray-500">
          {mcpLogs.length} events
        </div>
      </div>

      {/* Logs */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {mcpLogs.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            No MCP activity yet. Launch an app to see logs.
          </div>
        ) : (
          mcpLogs.map((log) => (
            <div 
              key={log.id}
              className={`p-2 rounded border text-xs font-mono ${
                log.status === 'success'
                  ? 'border-cyber-success/30 bg-cyber-success/5'
                  : 'border-cyber-error/30 bg-cyber-error/5'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`font-semibold ${
                  log.status === 'success' ? 'text-cyber-success' : 'text-cyber-error'
                }`}>
                  {log.tool.toUpperCase()}
                </span>
                <span className="text-gray-500">{formatTime(log.timestamp)}</span>
              </div>
              <div className="text-gray-300 break-all">
                {JSON.stringify(log.input, null, 2)}
              </div>
              {log.output && (
                <div className="mt-1 text-gray-400 border-l-2 border-gray-600 pl-2">
                  {typeof log.output === 'string' 
                    ? log.output 
                    : JSON.stringify(log.output, null, 2)
                  }
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MCPActivity;
