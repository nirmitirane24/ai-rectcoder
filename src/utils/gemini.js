import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";


// Configure safety settings (adjust as needed)
const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];
/**
 * Interacts with the Gemini model as a coding assistant agent.
 * @param {string} apiKey - The Gemini API key.
 * @param {string[]} fileTreePaths - Array of file paths currently in the editor.
 * @param {Array<{role: 'user' | 'assistant' | 'system', content: string}>} chatHistory - Full chat history, including system messages.
 * @param {string} [latestMessageContent] - Optional: The content of the very last message in the history (used for context).
 * @param {string} [selectedModel] - The Gemini model to use (e.g., "gemini-pro", "gemini-1.5-pro").
 * @returns {Promise<object>} A promise resolving to the parsed action object from Gemini.
 */
export const interactWithGemini = async (apiKey, fileTreePaths, chatHistory, latestMessageContent, selectedModel = "gemini-2.0-flash") => {
    if (!apiKey) {
        return { action: 'error', payload: { message: "Gemini API Key is missing." } };
    }

    const fileContext = `Current Files:\n${fileTreePaths.join('\n')}\n`;
    const historyContext = chatHistory
        .map(msg => `${msg.role === 'user' ? 'user' : (msg.role === 'assistant' ? 'assistant' : 'system')}: ${msg.content}`)
        .join('\n');

    // --- Enhanced Prompt ---
    const fullPrompt = `
You are an expert React development assistant acting as an **autonomous agent** within a live code editor.
Your goal is to help the user by understanding requests, planning steps, and executing them sequentially.

**IMPORTANT: ALWAYS REMEMBER THE FILE SYSTEM. YOU HAVE THESE FILES IN THE SYSTEM**:
${fileContext}

**Editor Context:**
- Live React editor. Key files: /App.js, /index.js, /styles.css, /public/index.html.

**Agent Workflow & Thinking Process:**
1.  **Analyze Request & History:** Read the latest message and conversation history, including "System:" feedback.
2.  **Plan Steps:** Break down the request into logical steps.
3.  **Check Context:** Use 'request_files' if needed.
4.  **Identify NEXT Action:** Determine the *single* immediate action for this turn.
5.  **Formulate Response:**
    *   Prepare the JSON payload for the *current* action.
    *   **Signal Continuation:** If you have a definite, immediate next step planned *that doesn't require user input* and should run automatically *if this action succeeds*, add \`"hasNextStep": true\` to the payload. Only include this if you intend the system to immediately trigger your *next* planned action.
    *   Optionally, briefly mention your plan or next step in the 'message' payload (e.g., "Added component X. Next, I will import it.").
6.  **Output JSON:** Respond ONLY with the single JSON object for the *immediate next action*.
7.  **Await Feedback:** The system executes your action. Success or "System:" error messages appear in history.
8.  **Repeat:** If \`hasNextStep\` was true and the action succeeded, the system will automatically prompt you again with "System: Action successful. Proceeding...". Use this context (and updated history/files) to perform your *next* planned step. Otherwise, await user input.

**Example Multi-Step Task (Add Component & Use - Automated):**
*   **Turn 1 (AI):** Responds with \`{ "action": "add_file", "payload": { "filePath": "/components/MyButton.jsx", "code": "...", "message": "Created MyButton component. Next, I'll import it.", "hasNextStep": true } }\`.
*   **Turn 2 (System):** Executes add_file. Adds AI's message. Sees \`hasNextStep: true\`. Automatically re-prompts AI with "System: Action successful. Proceeding...".
*   **Turn 3 (AI):** Sees system message and updated file list. Responds with \`{ "action": "edit_file", "payload": { "filePath": "/App.js", "code": "...", "message": "Imported and used MyButton in App.js." } }\`. (No 'hasNextStep' needed if this is the final step).
*   **Turn 4 (System):** Executes edit_file. Adds AI's message. Task complete. Waits for user.

**Handling Errors:**
*   React to "System:" error messages by adjusting your plan or asking for clarification.

Conversation History (includes user, assistant, and system messages):
${historyContext}
${latestMessageContent ? `\nlatest_user_message: ${latestMessageContent}` : ''}

Instructions:
Respond ONLY with a single valid JSON object for the *immediate next step*. Include \`"hasNextStep": true\` in the payload *only* if you intend to automatically proceed to the next step upon success of *this* action.

1. Chat response:
{
  "action": "chat",
  "payload": { "message": "Your helpful response..." }
}

2. Request file list:
{
  "action": "request_files",
  "payload": { "message": "Optional message..." }
}

3. Add a new file:
{
  "action": "add_file",
  "payload": {
    "filePath": "/path/to/new/file.jsx",
    "code": "/* Full code content */",
    "message": "Optional confirmation...",
    "hasNextStep": true // OPTIONAL: Include if planning immediate next action
  }
}

4. Edit an existing file:
{
  "action": "edit_file",
  "payload": {
    "filePath": "/path/to/existing/file.js",
    "code": "/* Complete new code content */",
    "message": "Optional confirmation...",
    "hasNextStep": true // OPTIONAL: Include if planning immediate next action
  }
}

5. Delete a file or folder:
{
  "action": "delete_file",
  "payload": {
    "filePath": "/path/to/item/to/delete",
    "message": "Optional confirmation...",
    "hasNextStep": true // OPTIONAL: Include if planning immediate next action
  }
}

6. Error or clarification needed:
{
  "action": "error",
  "payload": { "message": "Explain the issue..." }
}

Rules:
- **ONLY output the JSON object.**
- 'filePath' must start with '/'. Use 'request_files' if unsure.
- Always provide relative paths with respect to the root of the project. ( Example if something needs to be added in "components/MyComponent.jsx" then the filePath should be "/components/MyComponent.jsx" and if that component needs some style file then the filePath should be "/components/MyComponent.css" )
- Provide complete, valid code.

assistant:
`; // End prompt

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: selectedModel,
            safetySettings: safetySettings,
        });

        console.log(`[Gemini] Sending Agentic Prompt with model: ${selectedModel}...`);
        console.log("Prompt:", fullPrompt); // DEBUG

        const result = await model.generateContent(fullPrompt);
        const response = result?.response;
        const feedback = response?.promptFeedback;

        // --- Safety/Response Check (Keep as is) ---
        if (feedback?.blockReason) {
            throw new Error(`Request blocked: ${feedback.blockReason}`);
        }
        if (!response) {
            throw new Error('No response received.');
        }

        const text = response.text();
        console.log("[Gemini] Raw Response Text:", text);

        // --- JSON Parsing and Validation (Keep as is) ---
        let parsedResponse;
        let jsonString = '';
        try {
            const startIndex = text.indexOf('{');
            const endIndex = text.lastIndexOf('}');
            if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
                if (!text.trim().startsWith('{') && text.trim().length > 0) {
                    console.warn("[Gemini] Response wasn't JSON, treating as chat.");
                    return { action: 'chat', payload: { message: text.trim() } };
                }
                throw new Error("Valid JSON object boundaries not found.");
            }
            jsonString = text.substring(startIndex, endIndex + 1);
            parsedResponse = JSON.parse(jsonString);

        } catch (parseError) {
            console.error("[Gemini] JSON Processing Error:", parseError);
            return { action: 'error', payload: { message: `Failed to parse AI response: ${parseError.message}`, isParseError: true, rawText: text } };
        }

        // --- Validate Parsed Structure (Keep as is, handles payload presence) ---
        if (!parsedResponse || typeof parsedResponse !== 'object' || !parsedResponse.action || !parsedResponse.payload) {
            throw new Error("Invalid JSON structure (missing action or payload).");
        }
        const { action, payload } = parsedResponse;
        switch (action) {
            case 'chat':
            case 'request_files':
            case 'error':
                if (typeof payload.message !== 'string') throw new Error(`Invalid payload for ${action}: 'message' must be a string.`);
                break;
            case 'add_file':
            case 'edit_file':
                if (typeof payload.filePath !== 'string' || !payload.filePath.startsWith('/')) throw new Error(`Invalid payload for ${action}: 'filePath' must be a string starting with '/'.`);
                if (typeof payload.code === 'undefined') throw new Error(`Invalid payload for ${action}: 'code' is missing.`);
                break;
            case 'delete_file':
                if (typeof payload.filePath !== 'string' || !payload.filePath.startsWith('/')) throw new Error(`Invalid payload for ${action}: 'filePath' must be a string starting with '/'.`);
                break;
            default:
                throw new Error(`Unknown action received: ${action}`);
        }

        console.log("[Gemini] Parsed Response:", parsedResponse);
        return parsedResponse; // Return the valid, parsed object

    } catch (error) {
        // --- API/General Error Handling (Keep as is) ---
        console.error("[Gemini] API Interaction Error:", error);
        let message = `Failed to get response from Gemini: ${error.message || 'Unknown error'}`;

        // --- Enhanced Quota/Rate Limit Error Handling ---
        if (error.message?.includes('quota') || error.message?.includes('rate limit') || error.message?.includes('429')) {
            message = "You have exceeded your current quota or rate limit with the Gemini API. Please check your plan and billing details, or try again later.  See https://ai.google.dev/gemini-api/docs/rate-limits for more information.";
        } else if (error.message?.includes('API key not valid')) {
            message = "Invalid or missing Gemini API Key.";
        } else if (error.message?.includes('Request blocked')) {
            message = `Content safety blocked request: ${error.message}`;
        }
        return {
            action: 'error',
            payload: { message: message }
        };
    }
};
