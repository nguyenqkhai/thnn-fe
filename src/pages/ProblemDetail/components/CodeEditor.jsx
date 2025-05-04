import React from 'react';
import Editor from '@monaco-editor/react'; // Cần cài đặt package này

const CodeEditor = ({ code, onChange, language }) => {
  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      <Editor
        height="400px"
        language={language}
        theme="vs-light"
        value={code}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  );
};

export default CodeEditor;