import React from 'react';
import { Terminal as TerminalIcon, MessageSquare } from 'lucide-react'; 
import './StatusBar.css'; 

const StatusBar = ({ isTerminalVisible, onToggleTerminal, aiStatus }) => {
  return (
    <div className="status-bar">
      <div className="status-bar-left">
        {/* Placeholder for other status items if needed */}
        <span className={`ai-status ${aiStatus === 'loading' ? 'loading' : ''}`}>
            <MessageSquare size={14} style={{ marginRight: '4px' }}/>
            AI: {aiStatus === 'loading' ? 'Thinking...' : 'Ready'}
        </span>
        <span style={{marginLeft: '30px'}}>
            by Nirmiti Nitin Rane
        </span>
      </div>
      <div className="status-bar-right">
        <button
          className={`status-bar-button ${isTerminalVisible ? 'active' : ''}`}
          onClick={onToggleTerminal}
          title={isTerminalVisible ? 'Hide Terminal' : 'Show Terminal'}
          aria-label="Toggle Terminal"
        >
          <TerminalIcon size={14} />
          <span style={{marginLeft: '5px'}}>Terminal</span>
        </button>
      </div>
    </div>
  );
};

export default StatusBar;