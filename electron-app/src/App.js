import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import './App.css';
import GridBackground from './GridBackground';
import HolographicOverlay from './HolographicOverlay';
import Terminal from './Terminal';
import DataStream from './DataStream';
const { ipcRenderer } = require('electron');

const themes = {
  'default-dark': {
    bgColor: '#000',
    textColor: '#00ff00',
    accentColor: '#00ff00',
    glowColor: '#00ff00',
    secondaryBg: 'rgba(0, 0, 0, 0.8)',
    borderColor: '#00ff00',
  },
  'neon-green': {
    bgColor: '#001100',
    textColor: '#00ff00',
    accentColor: '#00ff00',
    glowColor: '#00ff00',
    secondaryBg: 'rgba(0, 17, 0, 0.8)',
    borderColor: '#00ff00',
  },
  'neon-blue': {
    bgColor: '#000011',
    textColor: '#0080ff',
    accentColor: '#0080ff',
    glowColor: '#0080ff',
    secondaryBg: 'rgba(0, 0, 17, 0.8)',
    borderColor: '#0080ff',
  },
  'neon-red': {
    bgColor: '#110000',
    textColor: '#ff0040',
    accentColor: '#ff0040',
    glowColor: '#ff0040',
    secondaryBg: 'rgba(17, 0, 0, 0.8)',
    borderColor: '#ff0040',
  },
  'neon-purple': {
    bgColor: '#110011',
    textColor: '#8000ff',
    accentColor: '#8000ff',
    glowColor: '#8000ff',
    secondaryBg: 'rgba(17, 0, 17, 0.8)',
    borderColor: '#8000ff',
  },
};

function App() {
  const [currentTheme, setCurrentTheme] = useState('default-dark');
  const [output, setOutput] = useState(['Welcome to the Futuristic Terminal']);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved && themes[saved]) setCurrentTheme(saved);
  }, []);

  useEffect(() => {
    const theme = themes[currentTheme];
    const root = document.documentElement;
    root.style.setProperty('--bg-color', theme.bgColor);
    root.style.setProperty('--text-color', theme.textColor);
    root.style.setProperty('--accent-color', theme.accentColor);
    root.style.setProperty('--glow-color', theme.glowColor);
    root.style.setProperty('--secondary-bg', theme.secondaryBg);
    root.style.setProperty('--border-color', theme.borderColor);
    localStorage.setItem('theme', currentTheme);
  }, [currentTheme]);

  const toggleVoiceRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setOutput(prev => [...prev, 'Speech recognition not supported in this browser.']);
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onstart = () => {
        setIsListening(true);
      };
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        inputRef.current.focus();
      };
      recognition.onend = () => {
        setIsListening(false);
      };
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setOutput(prev => [...prev, `Speech recognition error: ${event.error}`]);
      };
      recognition.start();
      recognitionRef.current = recognition;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            if (input.trim()) {
              const command = input.trim();
              const parts = command.split(/\s+/);
              const toolName = parts[0];
              const args = parts.slice(1);
              setOutput(prev => [...prev, `> ${command}`]);
              ipcRenderer.invoke('execute-tool', { toolName, args }).then(result => {
                if (result.error) {
                  setOutput(prev => [...prev, `Error: ${result.error}`]);
                } else {
                  setOutput(prev => [...prev, JSON.stringify(result, null, 2)]);
                }
              }).catch(err => {
                setOutput(prev => [...prev, `IPC Error: ${err.message}`]);
              });
              setInput('');
              inputRef.current.focus();
            }
            break;
          case 'm':
          case 'M':
            e.preventDefault();
            toggleVoiceRecognition();
            break;
          case 't':
          case 'T':
            e.preventDefault();
            const themeKeys = Object.keys(themes);
            const currentIndex = themeKeys.indexOf(currentTheme);
            const nextIndex = (currentIndex + 1) % themeKeys.length;
            setCurrentTheme(themeKeys[nextIndex]);
            break;
          case 'l':
          case 'L':
            e.preventDefault();
            setOutput([]);
            break;
          case 'h':
          case 'H':
            e.preventDefault();
            setShowHelp(true);
            break;
          default:
            break;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [input, currentTheme, toggleVoiceRecognition, setOutput, setInput, inputRef]);

  return (
    <div className="app">
      <ThemeSelector currentTheme={currentTheme} setCurrentTheme={setCurrentTheme} />
      <GridBackground />
      <HolographicOverlay accentColor={themes[currentTheme].accentColor} />
      <Terminal
        output={output}
        setOutput={setOutput}
        input={input}
        setInput={setInput}
        isListening={isListening}
        setIsListening={setIsListening}
        inputRef={inputRef}
        recognitionRef={recognitionRef}
        toggleVoiceRecognition={toggleVoiceRecognition}
      />
      <DataStream />
      {showHelp && (
        <div className="help-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          color: 'white'
        }}>
          <div className="help-content" style={{
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: '20px',
            borderRadius: '10px',
            border: '1px solid #00ff00'
          }}>
            <h2>Keyboard Shortcuts</h2>
            <ul>
              <li>Ctrl+Enter: Submit command</li>
              <li>Ctrl+M: Toggle microphone</li>
              <li>Ctrl+T: Cycle themes</li>
              <li>Ctrl+L: Clear terminal</li>
              <li>Ctrl+H: Show help</li>
            </ul>
            <button onClick={() => setShowHelp(false)} style={{
              backgroundColor: '#00ff00',
              color: 'black',
              border: 'none',
              padding: '10px 20px',
              cursor: 'pointer'
            }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

const ThemeSelector = ({ currentTheme, setCurrentTheme }) => {
  return (
    <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
      <select value={currentTheme} onChange={(e) => setCurrentTheme(e.target.value)}>
        {Object.keys(themes).map(theme => (
          <option key={theme} value={theme}>{theme.replace('-', ' ')}</option>
        ))}
      </select>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));