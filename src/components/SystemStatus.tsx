import React from 'react';
import { useStore } from '../store';

const SystemStatus: React.FC = () => {
  const { systemMetrics } = useStore();

  return (
    <div className="p-4 border-b border-cyber-border">
      <h2 className="text-xs font-mono text-gray-400 mb-3 uppercase tracking-wider">
        System Status
      </h2>
      
      <div className="space-y-3">
        {/* CPU */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">CPU</span>
            <span className="font-mono text-cyber-accent">{systemMetrics.cpu}%</span>
          </div>
          <div className="h-1 bg-cyber-dark rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyber-accent transition-all duration-500"
              style={{ width: `${systemMetrics.cpu}%` }}
            />
          </div>
        </div>

        {/* RAM */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">RAM</span>
            <span className="font-mono text-cyber-secondary">{systemMetrics.ram}%</span>
          </div>
          <div className="h-1 bg-cyber-dark rounded-full overflow-hidden">
            <div 
              className="h-full bg-cyber-secondary transition-all duration-500"
              style={{ width: `${systemMetrics.ram}%` }}
            />
          </div>
        </div>

        {/* Temperature */}
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-gray-400">TEMP</span>
            <span className={`font-mono ${
              systemMetrics.temperature > 80 ? 'text-cyber-error' : 
              systemMetrics.temperature > 60 ? 'text-cyber-warning' : 'text-cyber-success'
            }`}>
              {systemMetrics.temperature}°C
            </span>
          </div>
          <div className="h-1 bg-cyber-dark rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                systemMetrics.temperature > 80 ? 'bg-cyber-error' :
                systemMetrics.temperature > 60 ? 'bg-cyber-warning' : 'bg-cyber-success'
              }`}
              style={{ width: `${Math.min((systemMetrics.temperature / 100) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Network */}
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-400">Network</span>
          <span className={`text-xs font-mono ${
            systemMetrics.network === 'online' ? 'text-cyber-success' : 'text-cyber-error'
          }`}>
            {systemMetrics.network.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;
