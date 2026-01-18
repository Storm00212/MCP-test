import React, { useEffect, useRef } from 'react';
import anime from 'animejs';

const { ipcRenderer } = require('electron');

const Terminal = ({
  output,
  setOutput,
  input,
  setInput,
  isListening,
  setIsListening,
  inputRef,
  recognitionRef,
  toggleVoiceRecognition
}) => {
  const errorRef = useRef();

  useEffect(() => {
    if (errorRef.current) {
      anime({
        targets: errorRef.current,
        color: ['#ff0000', '#ffffff', '#ff0000'],
        duration: 600,
        easing: 'easeInOutQuad',
        loop: 2
      });
    }
  }, [output]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      const command = input.trim();
      if (command) {
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
    }
  };

  return (
    <div className="terminal">
      <div className="terminal-output">
        {output.map((line, index) => {
          const isError = line.startsWith('Error:') || line.startsWith('IPC Error:') || line.startsWith('Speech recognition error:');
          return (
            <div key={index} className={isError ? 'error-line' : ''} ref={isError ? errorRef : null}>
              {line}
            </div>
          );
        })}
      </div>
      <div className="terminal-input">
        <span>{'>'}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Enter command..."
        />
      </div>
    </div>
  );
};

export default Terminal;