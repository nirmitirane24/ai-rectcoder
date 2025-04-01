import React, { useState, useMemo } from 'react';
import { Folder, FolderOpen, FileText, Trash2, PlusSquare } from 'lucide-react'; // Using lucide-react for icons

// Install lucide-react: npm install lucide-react

// --- Helper to build tree ---
const buildFileTree = (filePaths) => {
    const tree = {};

    // Sort paths to ensure parent folders are processed first (though the logic handles out-of-order)
    const sortedPaths = [...filePaths].sort();

    sortedPaths.forEach(path => {
        const parts = path.substring(1).split('/'); // Remove leading '/' and split
        let currentLevel = tree;

        parts.forEach((part, index) => {
            const isLastPart = index === parts.length - 1;
            const currentPath = '/' + parts.slice(0, index + 1).join('/');

            if (!currentLevel[part]) {
                currentLevel[part] = {
                    name: part,
                    path: currentPath,
                    type: isLastPart ? 'file' : 'folder', // Assume folder unless it's the last part
                    children: isLastPart ? undefined : {}, // Folders have children object
                };
            } else {
                 // If a folder placeholder existed but this path confirms it's a file
                 if (currentLevel[part].type === 'folder' && isLastPart) {
                    currentLevel[part].type = 'file';
                    currentLevel[part].children = undefined; // Files don't have children
                 }
                 // Ensure it's marked as folder if it has children parts later
                 if (!isLastPart) {
                    currentLevel[part].type = 'folder';
                    if (!currentLevel[part].children) {
                       currentLevel[part].children = {};
                    }
                 }
            }

            if (!isLastPart) {
                currentLevel = currentLevel[part].children;
            }
        });
    });

    // Convert children objects to sorted arrays for rendering
    const convertChildrenToArray = (node) => {
        if (node.children) {
            node.children = Object.values(node.children)
                .sort((a, b) => {
                    // Folders first, then files, then alphabetically
                    if (a.type !== b.type) {
                        return a.type === 'folder' ? -1 : 1;
                    }
                    return a.name.localeCompare(b.name);
                })
                .map(convertChildrenToArray); // Recurse
        }
        return node;
    };

    return Object.values(tree)
        .sort((a, b) => {
            if (a.type !== b.type) { return a.type === 'folder' ? -1 : 1; }
            return a.name.localeCompare(b.name);
        })
        .map(convertChildrenToArray);
};


// --- Recursive TreeNode Component ---
const FileTreeNode = ({ node, activeFile, onSelectFile, onDelete, level = 0, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen || level === 0); // Keep root level open

    const isFolder = node.type === 'folder';
    const isActive = !isFolder && node.path === activeFile;

    const handleToggle = () => {
        if (isFolder) {
            setIsOpen(!isOpen);
        }
    };

    const handleSelect = (e) => {
         // Allow selecting folders too if needed, but primary action is toggle/select file
        if (!isFolder) {
            onSelectFile(node.path);
        } else {
             handleToggle(); // Toggle folder on name click
        }
    };

     const handleDeleteClick = (e) => {
        e.stopPropagation(); // Prevent node selection/toggle
        onDelete(node.path); // Pass the path (folder or file) to the delete handler
    };

     // Prevent deleting essential root items (redundant check, but good for UI)
    const canDelete = !['/App.js', '/index.js', '/styles.css', '/public'].includes(node.path) &&
                      !node.path.startsWith('/public/');


    return (
        <div>
            <li
                className={`file-tree-node ${isActive ? 'active' : ''} ${isFolder ? 'folder' : 'file'}`}
                style={{ paddingLeft: `${10 + level * 15}px` }} // Indentation
                onClick={handleSelect}
                title={node.path}
            >
                <span className="node-icon" onClick={isFolder ? handleToggle : undefined}>
                    {isFolder ? (
                        isOpen ? <FolderOpen size={16} /> : <Folder size={16} />
                    ) : (
                        <FileText size={16} />
                    )}
                </span>
                <span className="node-name">{node.name}</span>
                {canDelete && (
                     <span className="file-actions">
                        <button onClick={handleDeleteClick} title={`Delete ${node.path}`}>
                            <Trash2 size={14} />
                        </button>
                     </span>
                 )}

            </li>
            {isFolder && isOpen && node.children && (
                <ul className="file-tree-subtree">
                    {node.children.map(child => (
                        <FileTreeNode
                            key={child.path}
                            node={child}
                            activeFile={activeFile}
                            onSelectFile={onSelectFile}
                            onDelete={onDelete}
                            level={level + 1}
                        />
                    ))}
                </ul>
            )}
        </div>
    );
};


// --- Main FileExplorer Component ---
const FileExplorer = ({ files, activeFile, onSelectFile, onAdd, onDelete }) => {
  const [newItemPath, setNewItemPath] = useState('');

  const fileTree = useMemo(() => buildFileTree(Object.keys(files)), [files]);

  const handleAddClick = () => {
    // Basic validation for starting slash is handled in App.jsx's handler
    const path = newItemPath.trim();
    if (path) {
        onAdd(path.startsWith('/') ? path : '/' + path); // Ensure leading slash
        setNewItemPath(''); // Clear input
    }
  };

  const handleInputChange = (e) => {
    // Allow slashes, trim whitespace
    setNewItemPath(e.target.value); //.replace(/\s/g, ''); // Allow spaces in names? Maybe not.
  };

   const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') {
        handleAddClick();
    }
  }

  return (
    <div className="file-explorer">
        <h4>Files</h4>
      <ul className="file-tree-root">
        {fileTree.map(node => (
             <FileTreeNode
                key={node.path}
                node={node}
                activeFile={activeFile}
                onSelectFile={onSelectFile}
                onDelete={onDelete} // Pass onDelete down
             />
        ))}
      </ul>
      <div className="add-file-section">
        <input
          type="text"
          value={newItemPath}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder="/folder/file.js or /folder/"
          title="Enter path, end with / for folder"
        />
        <button onClick={handleAddClick} disabled={!newItemPath.trim()} title="Add File or Folder Path">
             <PlusSquare size={16}/> {/* Icon button */}
        </button>
      </div>
    </div>
  );
};

export default FileExplorer;