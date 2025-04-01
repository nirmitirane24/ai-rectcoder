// --- START OF FILE App.jsx ---
import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import CodeEditor from "./components/CodeEditor";
import TerminalComponent from "./components/Terminal";
import AIChat from "./components/AIChat";
import FileExplorer from "./components/FileExplorer";
import Dialog from "./components/Dialog";
import StatusBar from "./components/StatusBar";
import { interactWithGemini } from "./utils/gemini";
import { useTheme } from "./contexts/ThemeContext";
import { defaultCode, defaultIndexCode, defaultStyles, defaultIndexJs } from "./contexts/default_code";
import { MODEL_LIST } from "./contexts/model_list";
import "./index.css";


const defaultFiles = {
  "/App.js": { code: defaultCode },
  "/styles.css": { code: defaultStyles },
  "/public/index.html": { code: defaultIndexCode },
  "/index.js": { code: defaultIndexJs },
};
// --- End Default Code ---

function App() {
  const { themeMode, toggleTheme } = useTheme();
  const [files, setFiles] = useState(defaultFiles);
  const [activeFile, setActiveFile] = useState("/App.js");
  const [dependencies, setDependencies] = useState({
    react: "latest",
    "react-dom": "latest",
  });
  const [viewMode, setViewMode] = useState("editor");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I am your React AI assistant. I can help chat, add, edit, or delete files. How can I assist?",
    },
  ]);
  const [isLoadingGemini, setIsLoadingGemini] = useState(false);
  const [isTerminalVisible, setIsTerminalVisible] = useState(false);
  const [selectedModel, setSelectedModel] = useState(MODEL_LIST[0].value); // Default model

  // --- Dialog State ---
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    onCancel: null,
    confirmText: "OK",
    cancelText: "Cancel",
    type: "alert",
  });

  const providerKey = useMemo(
    () => JSON.stringify(dependencies),
    [dependencies]
  );

  // --- Dialog Helpers ---
  const showDialog = useCallback((config) => {
    setDialogState({
      isOpen: true,
      title: config.title || "",
      message: config.message || "",
      onConfirm: config.onConfirm || (() => closeDialog()),
      onCancel:
        config.type === "confirm"
          ? config.onCancel || (() => closeDialog())
          : null,
      confirmText: config.confirmText || "OK",
      cancelText: config.cancelText || "Cancel",
      type: config.type || "alert",
    });
  }, []); // Assuming closeDialog is stable, which it will be if defined below without unstable dependencies

  const closeDialog = useCallback(() => {
    setDialogState({
      isOpen: false, title: "", message: "", onConfirm: null, onCancel: null,
      confirmText: "OK", cancelText: "Cancel", type: "alert",
    });
  }, []);

  // --- Auto-Save Handler ---
  const handleCodeUpdate = useCallback((filePath, newCode) => {
    setFiles((prevFiles) => {
      if (!prevFiles[filePath] || prevFiles[filePath].code === newCode) {
        return prevFiles;
      }
      return {
        ...prevFiles,
        [filePath]: { ...prevFiles[filePath], code: newCode },
      };
    });
  }, []); // setFiles is stable

  // --- File/Folder Handlers ---
  const handleFileSelect = useCallback((filePath) => {
    setActiveFile(filePath);
    setViewMode("editor");
  }, []); // setActiveFile, setViewMode are stable

  // handleDelete needs to be defined before processGeminiResponse if processGeminiResponse depends on it
  const handleDelete = useCallback((path, skipConfirmation = false) => {
    const currentFilePaths = Object.keys(files);
    const isFolder = currentFilePaths.some(p => p.startsWith(path + '/') && p !== path);
    const isFile = !!files[path];

    if (!isFile && !isFolder) {
        showDialog({ title: "Delete Error", message: `Item "${path}" not found.`, type: "alert" });
        return Promise.reject(new Error(`Item "${path}" not found.`));
    }

    const essentialPaths = ["/App.js", "/index.js", "/styles.css", "/public/index.html", "/public"];
    const isEssential = essentialPaths.includes(path) || path === "/" || (isFolder && essentialPaths.some(ep => ep.startsWith(path + "/")));

    if (isEssential) {
        showDialog({ title: "Delete Error", message: `Cannot delete essential item or root: ${path}`, type: "alert"});
        return Promise.reject(new Error(`Cannot delete essential item: ${path}`));
    }

    const performDelete = () => {
        return new Promise((resolve) => {
            setFiles((prevFiles) => {
                const newFiles = { ...prevFiles };
                if (newFiles[path]) { delete newFiles[path]; }
                Object.keys(newFiles).forEach((p) => {
                    if (p.startsWith(path + "/")) { delete newFiles[p]; }
                });
                return newFiles;
            });

            // Update active file if necessary
            if (activeFile === path || (isFolder && activeFile?.startsWith(path + "/"))) {
                // Need to re-read files state *after* update, using functional update isn't direct here
                // A simple approach: just pick a default file if available
                setActiveFile(prevActive => {
                    const stillExists = files[prevActive];
                    const isInDeletedFolder = isFolder && prevActive?.startsWith(path + "/");
                    if (!stillExists || isInDeletedFolder) {
                         return defaultFiles["/App.js"] ? "/App.js" : (Object.keys(files)[0] || null);
                    }
                    return prevActive; // Keep if it wasn't deleted
                });
                 setViewMode("editor"); // Reset view just in case
            }
            closeDialog();
            resolve();
        });
    };

    if (skipConfirmation) {
        return performDelete();
    } else {
        const title = isFolder ? "Confirm Folder Deletion" : "Confirm File Deletion";
        const message = isFolder ? `Are you sure you want to delete the folder "${path}" and ALL its contents?` : `Are you sure you want to delete the file "${path}"?`;
        return new Promise((resolve, reject) => {
            showDialog({
                title: title, message: message, type: "confirm", confirmText: "Delete", cancelText: "Cancel",
                onConfirm: () => performDelete().then(resolve),
                onCancel: () => { closeDialog(); reject(new Error("User cancelled deletion.")); },
            });
        });
    }
  }, [files, activeFile, showDialog, closeDialog, setActiveFile, setViewMode]); // Added setViewMode dependency

  const handleAddFileOrFolder = useCallback((path) => {
      const trimmedPath = path.trim();
      if (!trimmedPath || !trimmedPath.startsWith("/")) {
          showDialog({ title: "Invalid Path", message: "Path must start with /", type: "alert" }); return;
      }
      const isFolder = trimmedPath.endsWith("/");
      let finalPath = trimmedPath;

      if (isFolder) {
          console.log("Folder path requested:", finalPath);
          showDialog({ title: "Folder Path Ready", message: `You can now add files inside "${finalPath}".`, type: "alert"});
          return;
      }

      if (files[finalPath]) {
          showDialog({ title: "File Exists", message: `File "${finalPath}" already exists.`, type: "alert" }); return;
      }
      const parentIsFile = Object.keys(files).some(existingPath =>
           finalPath.startsWith(existingPath + '/') && files[existingPath] && !existingPath.endsWith('/')
      );
      if (parentIsFile) {
           showDialog({ title: "Invalid Path", message: `Cannot create file inside an existing file's path.`, type: "alert" }); return;
      }
      if (!/\.(js|jsx|ts|tsx|css|json|html|md)$/i.test(finalPath)) {
          showDialog({ title: "Invalid Extension", message: "Requires valid extension (js, jsx, css, json, html, md).", type: "alert"}); return;
      }

      setFiles(prevFiles => ({ ...prevFiles, [finalPath]: { code: `// New file: ${finalPath}\n` } }));
      setActiveFile(finalPath);
      setViewMode("editor");
  }, [files, showDialog]); // Removed setActiveFile, setViewMode (stable), Added files

  // --- Package Install Handler ---
  const handleInstallPackage = useCallback((packageName) => {
      return new Promise((resolve, reject) => {
        if (!packageName || typeof packageName !== 'string' || !/^(@[\w.-]+\/)?[\w.-]+(@[\w.-]+)?$/.test(packageName)) {
          const errMsg = `Invalid package name: ${packageName}`;
          showDialog({ title: "Install Error", message: errMsg, type: "alert" });
          return reject(new Error(errMsg));
        }
        let depName = packageName;
        let depVersion = "latest";
        const versionSeparatorIndex = packageName.lastIndexOf("@");
        if (packageName.startsWith("@") && versionSeparatorIndex > 1) {
          depName = packageName.substring(0, versionSeparatorIndex);
          depVersion = packageName.substring(versionSeparatorIndex + 1);
        } else if (!packageName.startsWith("@") && versionSeparatorIndex > 0) {
          depName = packageName.substring(0, versionSeparatorIndex);
          depVersion = packageName.substring(versionSeparatorIndex + 1);
        }
        console.log(`Adding dependency: ${depName}@${depVersion}`);
        setDependencies((prevDeps) => ({ ...prevDeps, [depName]: depVersion }));
        resolve();
      });
    }, [showDialog]); // setDependencies is stable

  // --- Terminal Toggle Handler ---
  const handleToggleTerminal = useCallback(() => setIsTerminalVisible((prev) => !prev), []); // setIsTerminalVisible is stable

  // --- Gemini Interaction ---
  const activeGeminiInteraction = useRef(null);

  // Define callGeminiAPI FIRST
  const callGeminiAPI = useCallback(async (messageContentForContext = null) => {
      if (!geminiApiKey) {
          showDialog({ title: "API Key Missing", message: "Please enter your Gemini API key.", type: "alert" });
          setIsLoadingGemini(false); activeGeminiInteraction.current = null; return;
      }
      setIsLoadingGemini(true);

      setChatMessages(currentMessages => {
          const historyForAPI = [...currentMessages];
          activeGeminiInteraction.current = interactWithGemini(
              geminiApiKey, Object.keys(files), historyForAPI, messageContentForContext, selectedModel
          ).then(response => {
              // Call processGeminiResponse, which MUST be defined below this block
              processGeminiResponse(response, historyForAPI);
          }).catch(error => {
              console.error("Error during AI interaction API call:", error);
              setChatMessages(prev => [...prev, { role: "assistant", content: `System Error during API call: ${error.message}` }]);
              setIsLoadingGemini(false); activeGeminiInteraction.current = null;
          });
          return currentMessages;
      });
  // processGeminiResponse is NOT needed in deps here because it's called async in .then()
  }, [geminiApiKey, files, showDialog, setChatMessages, setIsLoadingGemini, selectedModel]);

  // Define processGeminiResponse SECOND
  const processGeminiResponse = useCallback(async (response, currentHistory) => {
      let assistantMessage = { role: "assistant", content: "" };
      let errorOccurred = false; let errorMessage = "";
      let shouldRePrompt = false; let rePromptInstruction = null;
      let autoContinue = false;

      try {
          if (!response || !response.action || !response.payload) {
              throw new Error("Received invalid response structure from AI.");
          }

          switch (response.action) {
              case "chat":
                  assistantMessage.content = response.payload.message;
                  break;
              case "request_files":
                  assistantMessage.content = response.payload.message || "Okay, fetching the file list...";
                  const fileList = Object.keys(files).sort().join('\n');
                  rePromptInstruction = { role: "system", content: `Current file list:\n${fileList || '(No files)'}` };
                  shouldRePrompt = true;
                  break;
              case "add_file":
                  const { filePath: addFilePath, code: addCode, message: addMsg } = response.payload;
                  if (!addFilePath || !addFilePath.startsWith("/")) { throw new Error(`Invalid file path for add_file: "${addFilePath}".`); }
                  if (files[addFilePath]) { throw new Error(`File already exists: "${addFilePath}".`); }
                  const addParentIsFile = Object.keys(files).some(p => addFilePath.startsWith(p + '/') && files[p] && !p.endsWith('/'));
                  if (addParentIsFile) { throw new Error(`Cannot create file "${addFilePath}" inside an existing file's path.`); }
                  setFiles(prev => ({ ...prev, [addFilePath]: { code: addCode } }));
                  setActiveFile(addFilePath); setViewMode("editor");
                  assistantMessage.content = addMsg || `Added file: ${addFilePath}`;
                  autoContinue = response.payload.hasNextStep === true;
                  break;
              case "edit_file":
                  const { filePath: editFilePath, code: editCode, message: editMsg } = response.payload;
                  if (!editFilePath || !files[editFilePath]) { throw new Error(`File not found for edit_file: "${editFilePath}".`); }
                  setFiles(prev => ({ ...prev, [editFilePath]: { ...prev[editFilePath], code: editCode } }));
                  assistantMessage.content = editMsg || `Updated file: ${editFilePath}`;
                  autoContinue = response.payload.hasNextStep === true;
                  break;
              case "delete_file":
                  const { filePath: deleteFilePath, message: deleteMsg } = response.payload;
                  if (!deleteFilePath) { throw new Error(`Missing file path for delete_file.`); }
                  try {
                      await handleDelete(deleteFilePath, true);
                      assistantMessage.content = deleteMsg || `Deleted: ${deleteFilePath}`;
                      autoContinue = response.payload.hasNextStep === true;
                  } catch (deleteError) {
                      throw new Error(`Failed to delete "${deleteFilePath}": ${deleteError.message}`);
                  }
                  break;
              case "error":
                  if (response.payload.isParseError) {
                      assistantMessage.content = `System: Error parsing your last response. Please ensure it's valid JSON.\nRaw response:\n\`\`\`\n${response.payload.rawText || '(empty)'}\n\`\`\``;
                      shouldRePrompt = true; rePromptInstruction = null;
                  } else {
                      assistantMessage.content = `Assistant Error: ${response.payload.message || "An unspecified error occurred."}`;
                  }
                  break;
              default:
                  throw new Error(`Received unknown action from AI: ${response.action}`);
          }

          if (autoContinue && !errorOccurred) {
              shouldRePrompt = true;
              rePromptInstruction = { role: 'system', content: 'Action successful. Proceeding to next planned step.' };
              console.log("[App] Action successful, hasNextStep=true. Triggering automatic continuation.");
          }
      } catch (executionError) {
          console.error("Error executing AI action:", executionError);
          errorOccurred = true; errorMessage = `System Error processing action "${response?.action || 'unknown'}": ${executionError.message}`;
          assistantMessage.content = errorMessage;
          shouldRePrompt = false; autoContinue = false;
      }

      setChatMessages(prev => [...prev, assistantMessage]);

      if (shouldRePrompt) {
          Promise.resolve().then(() => {
              if (rePromptInstruction) {
                   setChatMessages(prev => [...prev, rePromptInstruction]);
                   Promise.resolve().then(() => callGeminiAPI(rePromptInstruction.content));
              } else {
                   callGeminiAPI(); 
              }
          });
      } else {
           setIsLoadingGemini(false); activeGeminiInteraction.current = null;
      }
  }, [ files, handleDelete, setChatMessages, setActiveFile, setViewMode, setFiles, setIsLoadingGemini, callGeminiAPI ]); 

  // Handler for user sending message
  const handleSendMessageToAI = useCallback((userMessage) => {
      if (isLoadingGemini || activeGeminiInteraction.current) {
          console.warn("AI interaction already in progress. Please wait."); return;
      }
      const newUserMessage = { role: "user", content: userMessage };
      setChatMessages(prev => [...prev, newUserMessage]);
      Promise.resolve().then(() => {
          callGeminiAPI(newUserMessage.content);
      });
  }, [isLoadingGemini, callGeminiAPI, setChatMessages]); 

  // --- Render ---
  return (
    <div className="app-container">
      <div className="app-header">
        <h1>AI React Coder</h1>
        <button onClick={toggleTheme} className="theme-toggle-button">
          Switch to {themeMode === "light" ? "Dark" : "Light"} Mode
        </button>
      </div>
      <div className="main-layout">
        <div className="editor-section">
          <FileExplorer
            files={files}
            activeFile={activeFile}
            onSelectFile={handleFileSelect}
            onAdd={handleAddFileOrFolder}
            onDelete={(path) => handleDelete(path, false)} 
          />
          <div className="editor-view-container">
            <div className="view-toggle-buttons">
              <button
                className={`view-toggle-button ${viewMode === "editor" ? "active" : ""}`}
                onClick={() => setViewMode("editor")}
              >
                Editor
              </button>
              <button
                className={`view-toggle-button ${viewMode === "preview" ? "active" : ""}`}
                onClick={() => setViewMode("preview")}
              >
                Preview
              </button>
            </div>
            <CodeEditor
              // Key only needs to change when dependencies change for full Sandpack remount
              key={`sandpack-${providerKey}`}
              files={files}
              dependencies={dependencies}
              activeFile={activeFile}
              viewMode={viewMode}
              onCodeUpdate={handleCodeUpdate}
            />
          </div>
        </div>
        <div className="sidebar">
          <AIChat
            apiKey={geminiApiKey}
            onApiKeyChange={(e) => setGeminiApiKey(e.target.value)}
            chatMessages={chatMessages}
            onSendMessage={handleSendMessageToAI} // Pass the memoized handler
            isLoading={isLoadingGemini}
            selectedModel={selectedModel} // Pass the selected model
            onModelChange={setSelectedModel}
            modelList={MODEL_LIST}
          />
          {isTerminalVisible && (
            <div className="terminal-wrapper-outer">
              <TerminalComponent onInstallPackage={handleInstallPackage} />
            </div>
          )}
        </div>
      </div>
      <StatusBar
        isTerminalVisible={isTerminalVisible}
        onToggleTerminal={handleToggleTerminal}
        aiStatus={isLoadingGemini ? "loading" : "ready"}
      />
      <Dialog
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        onConfirm={dialogState.onConfirm}
        onCancel={dialogState.onCancel}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        type={dialogState.type}
      />
    </div>
  );
}

export default App;
// --- END OF FILE App.jsx ---