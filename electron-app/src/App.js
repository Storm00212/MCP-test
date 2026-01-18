import React from 'react';
import ReactDOM from 'react-dom';
import './App.css';
import GridBackground from './GridBackground';
import HolographicOverlay from './HolographicOverlay';
import Terminal from './Terminal';
import DataStream from './DataStream';

function App() {
  return (
    <div className="app">
      <GridBackground />
      <HolographicOverlay />
      <Terminal />
      <DataStream />
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));