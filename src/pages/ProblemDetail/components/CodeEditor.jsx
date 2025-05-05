import React from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ code, onChange, language }) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-300 rounded-xl shadow-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-blue-700">Trình soạn thảo mã nguồn</span>
        {/* Có thể thêm nút copy hoặc các tiện ích khác ở đây */}
      </div>
      <Editor
        height="400px"
        language={language}
        theme="vs-dark"
        value={code}
        onChange={onChange}
        options={{
          minimap: { enabled: false },
          fontSize: 16,
          scrollBeyondLastLine: false,
          automaticLayout: true,
          roundedSelection: true,
          cursorSmoothCaretAnimation: true,
        }}
      />
    </div>
  );
};

export default CodeEditor;