import React, { useEffect, useRef, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { useTheme } from '../contexts/ThemeContext'; // Import useTheme
import 'xterm/css/xterm.css';

// Define basic themes for XTerm
const xtermLightTheme = {
    background: '#f4f4f4',
    foreground: '#333333',
    cursor: '#333333',
    selectionBackground: '#cce5ff', // Use a light blue for selection
    black: '#000000',
    red: '#c91b00',
    green: '#00c200',
    yellow: '#c7c400',
    blue: '#0037da',
    magenta: '#c930c7',
    cyan: '#00c5c7',
    white: '#c7c7c7',
    brightBlack: '#676767',
    brightRed: '#ff6d67',
    brightGreen: '#5ff967',
    brightYellow: '#fefb67',
    brightBlue: '#6871ff',
    brightMagenta: '#ff76ff',
    brightCyan: '#5ffdff',
    brightWhite: '#ffffff'
};

const xtermDarkTheme = {
    background: '#2a2a2a', // Match sidebar dark background
    foreground: '#e0e0e0',
    cursor: '#e0e0e0',
    selectionBackground: '#4a4a4a', // Darker selection
    black: '#000000',
    red: '#cd3131',
    green: '#0dbc79',
    yellow: '#e5e510',
    blue: '#2472c8',
    magenta: '#bc3fbc',
    cyan: '#11a8cd',
    white: '#e5e5e5',
    brightBlack: '#666666',
    brightRed: '#f14c4c',
    brightGreen: '#23d18b',
    brightYellow: '#f5f543',
    brightBlue: '#3b8eea',
    brightMagenta: '#d670d6',
    brightCyan: '#29b8db',
    brightWhite: '#e5e5e5'
};


const TerminalComponent = ({ onInstallPackage }) => {
  const terminalRef = useRef(null);
  const termInstance = useRef(null);
  const fitAddon = useRef(null);
  const currentLine = useRef('');
  const { themeMode } = useTheme(); // Get theme mode

  const prompt = useCallback(() => {
    currentLine.current = '';
    termInstance.current?.write('\r\n$ ');
  }, []); // No dependency needed here

  const handleCommand = useCallback(/* ... same as before ... */ (command) => {
    const trimmedCommand = command.trim();
    if (!trimmedCommand) {
      prompt();
      return;
    }
    termInstance.current?.writeln('');
    const installMatch = trimmedCommand.match(/^(npm install|npm i|yarn add)\s+([\w@.-/]+)$/);
    if (installMatch) {
      const packageName = installMatch[2];
      termInstance.current?.writeln(`Attempting to install ${packageName}...`);
      onInstallPackage(packageName)
        .then(() => {
          termInstance.current?.writeln(`"${packageName}" added to dependencies. Refreshing sandbox...`);
          prompt();
        })
        .catch((error) => {
          termInstance.current?.writeln(`Error: ${error.message || 'Failed to add dependency.'}`);
          prompt();
        });
    } else if (trimmedCommand === 'clear') {
        termInstance.current?.clear();
        prompt();
    } else if (trimmedCommand === 'help') {
        termInstance.current?.writeln('Available commands:');
        termInstance.current?.writeln('  npm install <package_name>');
        termInstance.current?.writeln('  yarn add <package_name>');
        termInstance.current?.writeln('  clear');
        termInstance.current?.writeln('  help');
        prompt();
    }
    else {
      termInstance.current?.writeln(`Command not recognized: ${trimmedCommand}`);
      prompt();
    }
  }, [onInstallPackage, prompt]); // Added prompt dependency

  // Effect for initializing and cleaning up terminal
  useEffect(() => {
    let term;
    if (terminalRef.current && !termInstance.current) {
      const currentTheme = themeMode === 'dark' ? xtermDarkTheme : xtermLightTheme;
      term = new Terminal({
        cursorBlink: true,
        rows: 10,
        theme: currentTheme, // Set initial theme
        convertEol: true // Ensure proper line endings
      });
      fitAddon.current = new FitAddon();
      term.loadAddon(fitAddon.current);

      termInstance.current = term;
      term.open(terminalRef.current);

      try { fitAddon.current.fit(); } catch (e) { console.warn("FitAddon initial fit failed:", e); }

      term.writeln('Welcome to the Live Editor Terminal!');
      term.writeln('Use "npm install <pkg>" or "yarn add <pkg>"');
      prompt(); // Use the useCallback version

      term.onKey(({ key, domEvent }) => {
        const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;
        if (domEvent.keyCode === 13) { handleCommand(currentLine.current); }
        else if (domEvent.keyCode === 8) {
          if (currentLine.current.length > 0) { term.write('\b \b'); currentLine.current = currentLine.current.slice(0, -1); }
        }
        else if (printable) { currentLine.current += key; term.write(key); }
      });

      const resizeObserver = new ResizeObserver(() => {
        try { fitAddon.current?.fit(); } catch (e) { /* Ignore frequent errors */ }
      });
      if (terminalRef.current) { resizeObserver.observe(terminalRef.current); }

      // Cleanup
      return () => {
        resizeObserver.disconnect();
        termInstance.current?.dispose();
        termInstance.current = null;
        fitAddon.current = null;
      };
    }
  }, [handleCommand, prompt, themeMode]); // Add themeMode to dependencies to re-init on theme change *if needed*

  // Effect for updating theme *without* full re-initialization
   useEffect(() => {
        if (termInstance.current) {
            console.log("Applying XTerm theme:", themeMode);
            termInstance.current.options.theme = themeMode === 'dark' ? xtermDarkTheme : xtermLightTheme;
            // Optional: Force redraw if needed, though usually options update is enough
            // termInstance.current.refresh(0, termInstance.current.rows - 1);
        }
   }, [themeMode]);


  return (
    <div className="terminal-container">
        <h3>Terminal</h3>
        {/* Set background color on wrapper to ensure theme applies */}
        <div
            ref={terminalRef}
            className="terminal-wrapper"
            style={{ height: '100%', width: '100%', backgroundColor: themeMode === 'dark' ? xtermDarkTheme.background : xtermLightTheme.background }}
        ></div>
    </div>
  );
};

export default TerminalComponent;