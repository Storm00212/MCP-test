import React, { useEffect } from 'react';
import { useStore } from './store';
import Sidebar from './components/Sidebar';
import MainDashboard from './components/MainDashboard';

function App() {
  const { initializeSystem } = useStore();

  useEffect(() => {
    initializeSystem();
  }, [initializeSystem]);

  return (
    <div className="flex h-screen w-screen bg-cyber-dark text-gray-100 overflow-hidden">
      <Sidebar />
      <MainDashboard />
    </div>
  );
}

export default App;
