import React, { useEffect } from 'react';
import { useStore } from './store';
import Sidebar from './components/Sidebar';
import MainDashboard from './components/MainDashboard';
import TitleBar from './components/TitleBar';

function App() {
  const { initializeSystem } = useStore();

  useEffect(() => {
    initializeSystem();
  }, [initializeSystem]);

  return (
    <div className="h-screen w-screen bg-transparent text-gray-100 overflow-hidden">
      <TitleBar />
      <div className="flex h-full pt-10">
        <Sidebar />
        <MainDashboard />
      </div>
    </div>
  );
}

export default App;
