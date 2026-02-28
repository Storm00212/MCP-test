import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { useStore } from '../store';

const AITerminal: React.FC = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const { ragMessages, sendRAGQuery, ragLoading } = useStore();
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!terminalRef.current || terminalInstance.current) return;

    // Initialize xterm.js
    const term = new Terminal({
      theme: {
        background: 'transparent',
        foreground: '#e0e0e0',
        cursor: '#00f0ff',
        selectionBackground: 'rgba(0, 240, 255, 0.3)',
        black: '#12121a',
        red: '#ff4444',
        green: '#00ff88',
        yellow: '#ffaa00',
        blue: '#00f0ff',
        magenta: '#7b61ff',
        cyan: '#00f0ff',
        white: '#e0e0e0',
      },
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 14,
      lineHeight: 1.3,
      cursorBlink: true,
      cursorStyle: 'bar',
      allowTransparency: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    // Welcome message
    term.writeln('\x1b[1;36mAI TERMINAL\x1b[0m');
    term.writeln('\x1b[33mRAG-Powered Knowledge Base & MCP Agent Control\x1b[0m');
    term.writeln('');
    term.writeln('\x1b[32m◆ System ready. Type a query to search knowledge base.\x1b[0m');
    term.writeln('');
    term.write('\x1b[1;32m>\x1b[0m ');

    terminalInstance.current = term;

    // Handle user input
    term.onData((data) => {
      if (data === '\r') { // Enter key
        const line = term.buffer.active.getLine(term.buffer.active.cursorY)?.translateToString();
        if (line) {
          const command = line.replace(/^> /, '').trim();
          if (command) {
            term.writeln('');
            sendRAGQuery(command);
          }
          term.write('\x1b[1;32m>\x1b[0m ');
        }
      } else if (data === '\x7f') { // Backspace
        const line = term.buffer.active.getLine(term.buffer.active.cursorY);
        if (line && line.length > 2) {
          term.write('\b \b');
        }
      } else {
        term.write(data);
      }
    });

    // Handle resize
    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Display RAG messages
  useEffect(() => {
    if (!terminalInstance.current || ragMessages.length === 0) return;

    const term = terminalInstance.current;
    const lastMessage = ragMessages[ragMessages.length - 1];
    
    if (lastMessage.role === 'user') {
      term.writeln(`\x1b[33mUser:\x1b[0m ${lastMessage.content}`);
      term.write('\x1b[36mThinking...\x1b[0m ');
    } else {
      // Clear "Thinking..." and write response
      term.writeln('\r\x1b[K'); // Clear line
      term.writeln(`\x1b[35mAssistant:\x1b[0m`);
      // Word wrap response
      const words = lastMessage.content.split(' ');
      let line = '';
      words.forEach((word) => {
        if (line.length + word.length > term.cols - 4) {
          term.writeln('  ' + line);
          line = word + ' ';
        } else {
          line += word + ' ';
        }
      });
      if (line) term.writeln('  ' + line);
      term.writeln('');
      term.write('\x1b[1;32m>\x1b[0m ');
    }
  }, [ragMessages]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleQuickQuery = (query: string) => {
    if (!terminalInstance.current) return;
    terminalInstance.current.writeln(`\x1b[1;32m> \x1b[0m${query}`);
    sendRAGQuery(query);
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-cyber-border/30">
        <h2 className="text-xs font-mono text-cyber-accent uppercase tracking-wider flex items-center gap-2">
          <span>◆</span> AI Terminal / RAG Output
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={() => handleQuickQuery('Explain BJT amplifiers')}
            className="px-2 py-1 text-[10px] font-mono border border-cyber-border/50 text-gray-400 hover:bg-cyber-accent hover:text-cyber-dark hover:border-cyber-accent rounded transition-colors"
          >
            BJT
          </button>
          <button 
            onClick={() => handleQuickQuery('How do transformers work?')}
            className="px-2 py-1 text-[10px] font-mono border border-cyber-border/50 text-gray-400 hover:bg-cyber-accent hover:text-cyber-dark hover:border-cyber-accent rounded transition-colors"
          >
            Transformers
          </button>
          <button 
            onClick={() => handleQuickQuery('What is Laplace transform?')}
            className="px-2 py-1 text-[10px] font-mono border border-cyber-border/50 text-gray-400 hover:bg-cyber-accent hover:text-cyber-dark hover:border-cyber-accent rounded transition-colors"
          >
            Laplace
          </button>
        </div>
      </div>

      {/* Terminal */}
      <div ref={terminalRef} className="flex-1 p-2 overflow-hidden" />

      {/* Loading indicator */}
      {ragLoading && (
        <div className="absolute inset-0 bg-cyber-dark/30 backdrop-blur-sm flex items-center justify-center z-10">
          <div className="flex items-center gap-2 cyber-panel p-4">
            <svg className="animate-spin h-5 w-5 text-cyber-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-mono text-sm text-gray-300">Processing query...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITerminal;
