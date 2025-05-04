import React from 'react';

const ErrorMessage = ({ error }) => {
  return (
    <div className="flex justify-center items-center min-h-[200px]">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Lỗi!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    </div>
  );
};

export default ErrorMessage;