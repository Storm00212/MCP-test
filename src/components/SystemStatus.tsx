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
