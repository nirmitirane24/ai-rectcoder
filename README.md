# Live React Code Editor with AI Agent

A web-based live code editor built with React, allowing users to write, edit, and preview React code in real-time. It features an integrated terminal for installing NPM packages, a file explorer with folder support, theme switching, and an **autonomous AI assistant** powered by Google Gemini capable of multi-step actions for code generation, file manipulation, and chat.

Hosted Link : https://ai-reactcoder.vercel.app/

![Live React Editor Screenshot](./RepoAssets/screenshot.png)
**Made Tic-Tac-Toe using AI Coder**


## Features

*   **Live React Editing:** Uses CodeSandbox's Sandpack for a fast, interactive React coding experience.
*   **Real-time Preview:** See code changes reflected instantly in the preview pane.
*   **Console Output:** View `console.log` output and runtime errors from the previewed code directly within the editor layout.
*   **Integrated Terminal:** Uses Xterm.js to provide a terminal for installing external NPM packages (`npm install` or `yarn add`).
*   **AI Assistant (Agentic Gemini):**
    *   Acts as an **autonomous agent**, planning and executing tasks sequentially.
    *   **Multi-Step Task Execution:** Can perform sequences of actions (e.g., add a file, then edit another to import it) **automatically** upon success, without requiring explicit user prompts between each step, using a `hasNextStep` signal.
    *   **Chat:** Converse with the AI assistant to ask questions or discuss code.
    *   **Code Generation:** Ask the AI to generate or refactor code for specific files.
    *   **File Manipulation:** Instruct the AI to add, edit, or delete files and folders.
    *   **Context-Aware:** Considers the current file structure, chat history, and system feedback (like errors) to inform its actions.
    *   **Error Correction:** Attempts to correct itself if its previous action resulted in a parsing or execution error reported by the system.
*   **File Explorer:** Browse, select, add (files/folders), and delete files within the Sandpack environment.
*   **Theme Switching:** Toggle between light and dark modes for the editor, terminal, and UI elements.
*   **Debounced Auto-save:** Changes made in the editor are automatically saved back to the application state after a short delay.
*   **Collapsible Terminal:** Show or hide the terminal panel using a status bar button.
*   **Status Bar:** Displays AI status (Ready/Thinking) and provides controls like toggling the terminal.
*   **Custom Dialogs:** Uses custom modal dialogs for user feedback and confirmations.

## Tech Stack

*   **Frontend:** React (using Vite for setup)
*   **Live Editing/Sandbox:** `@codesandbox/sandpack-react`, `@codesandbox/sandpack-themes`
*   **Terminal:** `xterm`, `xterm-addon-fit`
*   **AI:** `@google/generative-ai` (Google Gemini API - currently using `gemini-2.0-flash`)
*   **Icons:** `lucide-react`
*   **Styling:** `CSS`

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <repo_link>
    # Or your specific Gitlab URL if preferred
    # git clone <repo_link>
    ```

2.  **Navigate to the directory:**
    ```bash
    cd ai-react-coder
    ```

3.  **Install dependencies:**
    Make sure you have Node.js and npm (or yarn) installed.
    ```bash
    npm install
    # or
    # yarn install
    ```

## Running the Application

1.  **Start the development server:**
    ```bash
    npm run dev
    # or
    # yarn dev
    ```
2.  Open your browser and navigate to the URL provided (usually `http://localhost:5173` or similar).

## How to Use

1.  **Editing Code:**
    *   Select a file from the **File Explorer**.
    *   Edit code in the **Editor** pane.
    *   Observe changes in the **Preview** pane.
    *   Changes auto-save after a short delay.
    *   Use the **Editor/Preview** toggle buttons.

2.  **File Management:**
    *   Click file names to open.
    *   Use the input at the bottom of the explorer to add files (e.g., `/components/Button.jsx`) or folders (e.g., `/utils/`). End path with `/` for folders.
    *   Hover over items to reveal the delete icon. Confirmation is required for user deletions. Essential files are protected.

3.  **Using the Terminal:**
    *   Toggle visibility via the **Status Bar**.
    *   Install packages: `npm install <package-name>` or `yarn add <package-name>`.
    *   The sandbox refreshes automatically.
    *   Use `clear` or `help`.

4.  **Interacting with the AI Assistant (Agent):**
    *   Enter your **Google Gemini API Key** in the AI Chat panel's input field. The chat is disabled without a valid key.
    *   Type your request in the text area and click **Send** (or press Enter).
    *   **Agentic Workflow:**
        *   Give high-level instructions (e.g., "Create a counter component and use it in App.js").
        *   The AI will plan the steps. It might respond with its plan in the chat.
        *   It will execute the *first* step (e.g., `add_file` for the component).
        *   **If the action is successful and the AI planned an immediate next step (and included `hasNextStep: true` in its response), the system will automatically prompt the AI again.** You will see a "System: Action successful. Proceeding..." message.
        *   The AI will then execute its *next* planned step (e.g., `edit_file` to import the component) **without you needing to type anything further.**
        *   This continues until the AI completes its planned sequence or requires user input/clarification.
    *   **Examples:**
        *   `"What is React context?"` (Chat)
        *   `"Refactor the button in App.js into its own component file at /components/ClickButton.jsx and update App.js to use it."` (Multi-step: add file -> edit file - likely automatic)
        *   `"Add a new file /config.js exporting a default theme object with primary and secondary colors."` (Single step: add file)
        *   If the AI makes a mistake (e.g., tries to edit a non-existent file), a "System Error" message will appear. You can then provide clarification or a corrected instruction.

5.  **Switching Themes:**
    *   Click the **"Switch to Dark/Light Mode"** button in the header.

## Important Notes

*   **API Key Security:** **CRITICAL!** Entering the Gemini API Key directly in the browser is **INSECURE** and **NOT FOR PRODUCTION**. Implement a backend proxy server for secure API key handling in any real deployment.
*   **Gemini Model:** Currently uses `gemini-2.0-flash` (configurable in `src/utils/gemini.js`). API key must have access. Model behavior, adherence to JSON format, and planning capabilities may vary. `other gemini models` might offer more robust planning for complex tasks.
*   **Sandpack Limitations:** Sandpack runs in the browser, limiting access compared to a local Node.js environment.
*   **Error Handling:** The system provides feedback to the AI on errors. Monitor the chat and browser console for issues. Complex failures might require user intervention.

## Potential Future Enhancements

*   **Backend Proxy:** Essential for secure API key management.
*   User authentication & project saving/loading.
*   Persistence for files/dependencies (e.g., Local Storage, backend DB).
*   More robust file operations (rename, move).
*   Enhanced terminal capabilities (more commands, better state).
*   Deployment strategy for backend + frontend.
*   Markdown rendering for AI chat responses.
*   More sophisticated AI planning and error recovery logic.
*   UI/UX improvements for file operations and AI interaction state.

## Acknowledgements

*   **Sandpack:** For the in-browser sandbox.
*   **Xterm.js:** For terminal emulation.
*   **Google Gemini:** For the AI agent capabilities.
*   **React & Vite:** For the core framework and tooling.
*   **Lucide Icons:** For UI icons.

---
*Made by Nirmiti Rane*