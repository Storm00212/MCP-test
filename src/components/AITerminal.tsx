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
        background: '#0a0a0f',
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
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'bar',
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    // Welcome message
    term.writeln('\x1b[1;34m╔════════════════════════════════════════════════════════════╗\x1b[0m');
    term.writeln('\x1b[1;34m║\x1b[0m \x1b[1;36mEngineering Command OS - AI Terminal\x1b[0m                      \x1b[1;34m║\x1b[0m');
    term.writeln('\x1b[1;34m║\x1b[0m \x1b[33mRAG-Powered Knowledge Base & MCP Agent Control\x1b[0m         \x1b[1;34m║\x1b[0m');
    term.writeln('\x1b[1;34m╚════════════════════════════════════════════════════════════╝\x1b[0m');
    term.writeln('');
    term.writeln('\x1b[32m◆ System ready\x1b[0m');
    term.writeln('\x1b[32m◆ Type a query to search knowledge base\x1b[0m');
    term.writeln('\x1b[32m◆ Try: "Explain BJT amplifiers" or "How do transformers work"\x1b[0m');
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
      term.writeln('\b \b\b \b');
      term.writeln('');
      term.writeln(`\x1b[35mAssistant:\x1b[0m`);
      // Word wrap response
      const words = lastMessage.content.split(' ');
      let line = '';
      words.forEach((word) => {
        if (line.length + word.length > 80) {
          term.writeln(line);
          line = word + ' ';
        } else {
          line += word + ' ';
        }
      });
      if (line) term.writeln(line);
      term.writeln('');
      term.write('\x1b[1;32m>\x1b[0m ');
    }
  }, [ragMessages]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleQuickQuery = (query: string) => {
    sendRAGQuery(query);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-cyber-border bg-cyber-panel">
        <h2 className="text-xs font-mono text-cyber-accent uppercase tracking-wider flex items-center gap-2">
          <span>◆</span> AI Terminal / RAG Output
        </h2>
        <div className="flex gap-2">
          <button 
            onClick={() => handleQuickQuery('Explain BJT amplifiers')}
            className="px-2 py-1 text-[10px] font-mono bg-cyber-border hover:bg-cyber-accent hover:text-cyber-dark rounded transition-colors"
          >
            BJT
          </button>
          <button 
            onClick={() => handleQuickQuery('How do transformers work?')}
            className="px-2 py-1 text-[10px] font-mono bg-cyber-border hover:bg-cyber-accent hover:text-cyber-dark rounded transition-colors"
          >
            Transformers
          </button>
          <button 
            onClick={() => handleQuickQuery('What is Laplace transform?')}
            className="px-2 py-1 text-[10px] font-mono bg-cyber-border hover:bg-cyber-accent hover:text-cyber-dark rounded transition-colors"
          >
            Laplace
          </button>
        </div>
      </div>

      {/* Terminal */}
      <div ref={terminalRef} className="flex-1 p-2 overflow-hidden" />

      {/* Loading indicator */}
      {ragLoading && (
        <div className="absolute inset-0 bg-cyber-dark/50 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="text-cyber-accent animate-spin">◆</span>
            <span className="font-mono text-sm text-gray-300">Processing query...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITerminal;
