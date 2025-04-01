// --- Default Code (keep as is) ---
const defaultCode = `import React, { useState } from 'react';
import './styles.css';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="container">
      <div className="card">
        <h1>Live React Editor</h1>
        <p>A simple and interactive React code editor.</p>
        <h2>You clicked {count} times!</h2>
        <button onClick={() => setCount(count + 1)}>Click me</button>
        <p className="powered-by">Powered by Gemini AI Coding Editor</p>
      </div>
    </div>
  );
}`;

const defaultIndexCode = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>
      React App
    </title>
  </head>
  <body>
    <div id="root">
    </div>
  </body>
</html>`;

const defaultStyles = `/* styles.css */
body {
  margin: 0;
  padding: 0;
  font-family: "Fira Code", "Consolas", "Courier New", monospace;
  background: rgb(60, 60, 60);
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  color: white;
}

.container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
  text-align: center;
  max-width: 400px;
  width: 100%;
  transition: transform 0.2s ease-in-out;
}

h1 {
  font-size: 24px;
  margin-bottom: 10px;
}

p {
  font-size: 14px;
  opacity: 0.8;
}

h2 {
  font-size: 20px;
  margin: 10px 0;
}

button {
  background: #ff7b00;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.3s ease-in-out, transform 0.2s ease-in-out;
}

button:hover {
  background: #ff5900;
  transform: scale(1.01);
}

.powered-by {
  margin-top: 15px;
  font-size: 12px;
  opacity: 0.7;
}
`;

const defaultIndexJs = `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const root = createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;


export { defaultCode, defaultIndexCode, defaultStyles, defaultIndexJs };