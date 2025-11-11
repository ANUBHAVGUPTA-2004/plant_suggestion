
import React from 'react';
import ImageProcessor from './components/ImageProcessor';

const App: React.FC = () => {
  return (
    <div className="bg-green-50 text-gray-800 font-sans">
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold tracking-tight text-green-900 sm:text-4xl text-center mb-8">
          AI Plant Suggestion Tool
        </h2>
        <p className="text-center text-gray-600 mb-8 max-w-2xl mx-auto">
          Upload a photo of any space, and our AI will automatically suggest and place suitable plants and trees to beautify it. See a preview of your enhanced space in seconds!
        </p>
        <ImageProcessor />
      </div>
    </div>
  );
};

export default App;
