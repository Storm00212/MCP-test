import React from 'react';
import { appWindow } from '@tauri-apps/api/window';

const TitleBar: React.FC = () => {
  return (
    <div
      data-tauri-drag-region
      className="fixed top-0 left-0 right-0 h-10 bg-cyber-dark/80 backdrop-blur-md flex justify-between items-center z-50 select-none"
      style={{ borderBottom: '1px solid var(--color-cyber-border)' }}
    >
      <div className="flex items-center pl-4">
        <span className="font-mono text-sm text-cyber-accent">ECO // Engineering Command OS</span>
      </div>
      <div className="flex items-center">
        <div onClick={() => appWindow.minimize()} className="h-10 w-10 flex justify-center items-center hover:bg-cyber-panel cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M14 8H2v-1h12v1z"/>
          </svg>
        </div>
        <div onClick={() => appWindow.toggleMaximize()} className="h-10 w-10 flex justify-center items-center hover:bg-cyber-panel cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M3.5 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-8zM4 4v8h8V4H4z"/>
          </svg>
        </div>
        <div onClick={() => appWindow.close()} className="h-10 w-10 flex justify-center items-center hover:bg-red-500/50 cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default TitleBar;
