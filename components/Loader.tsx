import React from 'react';

interface LoaderProps {
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message = 'AI is thinking...' }) => {
  return (
    <div className="absolute inset-0 bg-white bg-opacity-75 flex flex-col items-center justify-center z-10">
      <div className="w-12 h-12 border-4 border-t-transparent border-green-500 rounded-full animate-spin"></div>
      <p className="mt-4 text-gray-700">{message}</p>
    </div>
  );
};

export default Loader;