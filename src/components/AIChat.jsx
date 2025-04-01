import React, { useState, useRef, useEffect } from 'react';
import './AIChat.css'; // Create this CSS file

const AIChat = ({ apiKey, onApiKeyChange, chatMessages, onSendMessage, isLoading, selectedModel, onModelChange, modelList }) => {
    const [userMessage, setUserMessage] = useState('');
    const chatBodyRef = useRef(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (chatBodyRef.current) {
            chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const handleSend = () => {
        if (userMessage.trim() && !isLoading) {
            onSendMessage(userMessage.trim());
            setUserMessage('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent newline
            handleSend();
        }
    };

    return (
        <div className="ai-chat-container">
            <h3>
                AI Assistant
                <img
                    className={`gemini-logo ${isLoading ? 'rotating' : ''}`}
                    // className={`gemini-logo ${true ? 'rotating' : ''}`} For testing animation
                    src="./google-gemini-icon.svg"
                    alt="Gemini Logo"
                />
            </h3>

            <div className="api-key-section">
                <input
                    type="password"
                    id="apiKey"
                    value={apiKey}
                    onChange={onApiKeyChange}
                    placeholder="Enter Gemini API Key"
                    aria-label="Gemini API Key"
                />
                <select
                    id="model-select"
                    value={selectedModel}
                    onChange={(e) => onModelChange(e.target.value)}
                >
                    {modelList.map((model) => (
                        <option key={model.value} value={model.value}>
                            {model.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="chat-body" ref={chatBodyRef}>
                {chatMessages.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.role}`}>
                        <span className="message-role">{msg.role === 'user' ? 'You' : 'Assistant'}:</span>
                        <div className="message-content">
                            {msg.content.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="chat-message assistant loading">
                         <span className="message-role">Assistant</span>
                         <div className="message-content"><i>Thinking...</i></div>
                    </div>
                )}
            </div>

            <div className="chat-input-area">
                <textarea
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask the assistant..."
                    rows="2"
                    disabled={isLoading || !apiKey}
                    aria-label="Chat input"
                />
                <button onClick={handleSend} disabled={isLoading || !apiKey || !userMessage.trim()}>
                    Send
                </button>
            </div>
        </div>
    );
};

export default AIChat;