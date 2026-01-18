import React from 'react';

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
        {output.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
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