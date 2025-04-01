import React, { useEffect, useRef } from 'react';
import { useSandpack } from '@codesandbox/sandpack-react';

// Debounce delay in milliseconds
const AUTOSAVE_DELAY = 1500; // 1.5 seconds

const SandpackChangeListener = ({ activeFile, onCodeUpdate, filesFromProps }) => {
    const { sandpack } = useSandpack();
    const debounceTimeoutRef = useRef(null);

    // Get the current code directly from Sandpack's internal state
    const internalCode = sandpack.files[activeFile]?.code;
    // Get the code for the active file as passed down via props (the "saved" version)
    const propCode = filesFromProps[activeFile]?.code;

    useEffect(() => {
        // Clear any existing timeout whenever the internal code or active file changes
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        // Check if:
        // 1. There is an active file.
        // 2. The internal code exists.
        // 3. The internal code is DIFFERENT from the code passed via props.
        //    This prevents saving immediately after an external load (like Gemini)
        //    or if the internal state somehow matches the prop state already.
        if (activeFile && typeof internalCode === 'string' && internalCode !== propCode) {
            // console.log(`[ChangeListener] Change detected in ${activeFile}. Setting timeout.`);

            debounceTimeoutRef.current = setTimeout(() => {
                console.log(`[ChangeListener] Debounced save triggered for ${activeFile}.`);
                onCodeUpdate(activeFile, internalCode); // Call the update function passed from App
            }, AUTOSAVE_DELAY);
        } else {
             // console.log(`[ChangeListener] No change detected or code matches props for ${activeFile}.`);
        }

        // Cleanup function to clear timeout if the component unmounts
        // or if the effect re-runs before the timeout finishes.
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
        // Dependencies:
        // - internalCode: Rerun when the code in the editor changes.
        // - activeFile: Rerun when the selected file changes.
        // - onCodeUpdate: Callback from App (should be stable via useCallback).
        // - propCode: Rerun if the "saved" code from App changes (important for comparison).
    }, [internalCode, activeFile, onCodeUpdate, propCode]); // Added propCode

    // This component doesn't render anything itself
    return null;
};

export default SandpackChangeListener;