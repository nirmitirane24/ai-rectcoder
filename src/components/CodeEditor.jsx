import React, { useMemo, useEffect, useRef } from 'react';
import {
    SandpackProvider,
    SandpackLayout,
    SandpackCodeEditor,
    SandpackPreview,
    SandpackConsole,
} from '@codesandbox/sandpack-react';
import { githubLight, sandpackDark } from '@codesandbox/sandpack-themes';
import { useTheme } from '../contexts/ThemeContext';
import SandpackChangeListener from './SandpackChangeListener'; 

const CodeEditor = ({
    files,
    dependencies,
    activeFile,
    viewMode,
    onCodeUpdate, 
}) => {
    const { themeMode } = useTheme();
    const sandpackTheme = themeMode === 'dark' ? sandpackDark : githubLight;
    const sandpackOptions = useMemo(() => ({ activeFile }), [activeFile]);

    const activeFileCode = files[activeFile]?.code;
    const editorResetKey = useRef(0);
    const previousCodeRef = useRef(activeFileCode);

    useEffect(() => {
        if (activeFile) {
            const currentCodeFromProp = files[activeFile]?.code;
            if (currentCodeFromProp !== previousCodeRef.current) {
                console.log(`[CodeEditor] External code change detected for ${activeFile}. Incrementing editor key.`);
                editorResetKey.current += 1;
                previousCodeRef.current = currentCodeFromProp;
            }
        }
    }, [activeFile, activeFileCode]);

    useEffect(() => {
        if (activeFile) {
             previousCodeRef.current = files[activeFile]?.code;
        }
    }, [activeFile, files]);


    return (
        <SandpackProvider
            template="react"
            files={files} 
            customSetup={{ dependencies }}
            theme={sandpackTheme}
            options={sandpackOptions}
        >
            <SandpackChangeListener
                activeFile={activeFile}
                onCodeUpdate={onCodeUpdate}
                filesFromProps={files} 
            />

            <SandpackLayout style={{ border: 'none', height: '100%', flexDirection: 'column' }}>
                <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
                    {viewMode === 'editor' && (
                        <SandpackCodeEditor
                            key={`editor-${activeFile}-${editorResetKey.current}`} 
                            showTabs
                            showLineNumbers
                            showInlineErrors
                            wrapContent
                            style={{ height: '100%' }}
                         />
                    )}
                    {viewMode === 'preview' && (
                        <SandpackPreview style={{ height: '100%' }} />
                    )}
                 </div>
                 <SandpackConsole
                     style={{
                        height: '150px',
                        maxHeight: '40%',
                        flexGrow: 0,
                        flexShrink: 0,
                        borderTop: `1px solid var(--border-color)`
                     }}
                 />
            </SandpackLayout>
        </SandpackProvider>
    );
};

export default CodeEditor;