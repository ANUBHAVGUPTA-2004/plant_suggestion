import React, { useState, useCallback, useRef } from 'react';
import { getPlantDetails, FloraDetail } from '../services/geminiService';
import { editImageWithPrompt } from '../services/geminiService';
import { fileToDataUrl, dataUrlToBlobInfo } from '../utils/fileUtils';
import { UploadIcon, ImageIcon, XCircleIcon, SparklesIcon, ZoomInIcon, XIcon, ArrowDownIcon } from './icons';
import Loader from './Loader';

const ImageProcessor: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<{ url: string; file: File } | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [floraDetails, setFloraDetails] = useState<FloraDetail[] | null>(null);
  const [highlightedPlant, setHighlightedPlant] = useState<FloraDetail | null>(null);
  const [zoomedPlant, setZoomedPlant] = useState<FloraDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Generating image...');
  const [error, setError] = useState<string | null>(null);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  
  const generatedImageContainerRef = useRef<HTMLDivElement>(null);
  
  const processImage = useCallback(async (image: { url: string; file: File }) => {
    setIsLoading(true);
    setError(null);
    setGeneratedImageUrl(null);
    setFloraDetails(null);

    const permanentPrompt = "Analyze the context of this image (e.g., indoor room, outdoor garden, balcony). Based on the context and available empty space, add photorealistic, high-detail plants. If the space is large enough and the context is appropriate (like outdoors), you can also add suitable small trees. The result must be a sharp, high-resolution, high-quality photograph, with clear details suitable for zooming in.";

    try {
      // Step 1: Generate the image
      setLoadingMessage('Analyzing scene & adding flora...');
      const originalImageInfo = await dataUrlToBlobInfo(image.url);
      const newImageBase64 = await editImageWithPrompt(originalImageInfo.base64Data, originalImageInfo.mimeType, permanentPrompt);
      const newImageUrl = `data:image/png;base64,${newImageBase64}`;
      setGeneratedImageUrl(newImageUrl);

      // Step 2: Get details about the added plants
      setLoadingMessage('Identifying new plants & trees...');
      const newImageInfo = { base64Data: newImageBase64, mimeType: 'image/png' };
      const details = await getPlantDetails(originalImageInfo, newImageInfo);
      setFloraDetails(details);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(`Generation failed: ${errorMessage}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const url = await fileToDataUrl(file);
        const newImage = { url, file };
        setOriginalImage(newImage);
        setGeneratedImageUrl(null);
        setFloraDetails(null);
        setError(null);
        // Automatically start processing
        processImage(newImage);
      } catch (err) {
        setError('Failed to read file.');
        console.error(err);
      }
    }
  };

  const resetState = () => {
    setOriginalImage(null);
    setGeneratedImageUrl(null);
    setFloraDetails(null);
    setError(null);
    setIsLoading(false);
    setHighlightedPlant(null);
    setZoomedPlant(null);
    setIsZoomed(false);
  };

  const handlePlantClick = (plant: FloraDetail) => {
    setZoomedPlant(plant);
    setIsZoomed(true);
    generatedImageContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const getZoomedImageStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
        imageRendering: 'crisp-edges', // Prevents blurring on zoom
    };

    if (!zoomedPlant) {
      return baseStyle;
    }

    const { x, y, width, height } = zoomedPlant.boundingBox;
    const zoomLevel = 3; // 3x zoom

    // Center of the bounding box (in percentage)
    const centerX = (x + width / 2) * 100;
    const centerY = (y + height / 2) * 100;

    return {
      ...baseStyle,
      transformOrigin: `${centerX}% ${centerY}%`,
      transform: `scale(${zoomLevel})`,
    };
  };

  if (!originalImage) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-green-300 rounded-lg bg-white/50 hover:border-green-500 transition-colors">
        <UploadIcon className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2 text-green-900">Upload an Image</h2>
        <p className="text-gray-600 mb-4">The AI will automatically add suitable plants or trees.</p>
        <input
          type="file"
          accept="image/png, image/jpeg, image/webp"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
          aria-label="Upload image"
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer bg-green-600 text-white px-6 py-2 rounded-md font-semibold hover:bg-green-500 transition-colors"
        >
          Choose File
        </label>
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-end">
         <button
            onClick={resetState}
            className="w-full sm:w-auto px-6 py-3 border border-green-300 text-base font-medium rounded-md text-green-700 hover:bg-green-100 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-green-50 transition-colors"
        >
            Upload New Image
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Original Image */}
        <div className="flex flex-col">
          <h3 className="text-lg font-semibold text-center mb-4 text-gray-700">Original Image</h3>
          <div className="aspect-square w-full bg-white rounded-lg overflow-hidden ring-1 ring-green-200">
            <img src={originalImage.url} alt="Original upload" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Generated Image */}
        <div className="flex flex-col" ref={generatedImageContainerRef}>
          <h3 className="text-lg font-semibold text-center mb-4 text-gray-700">Edited Image</h3>
          <div className="aspect-square w-full bg-white rounded-lg flex items-center justify-center ring-1 ring-green-200 relative overflow-hidden">
            {isLoading && <Loader message={loadingMessage} />}
            {!isLoading && generatedImageUrl && (
                <div className="relative w-full h-full group">
                    <img src={generatedImageUrl} alt="Generated by AI" className="w-full h-full object-contain" />
                    <div
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                      onClick={() => { setZoomedPlant(null); setIsZoomed(true); }}
                      aria-label="Zoom in on image"
                    >
                      <ZoomInIcon className="w-16 h-16 text-white" />
                    </div>
                    {highlightedPlant && !isZoomed && (
                        <div
                            className="absolute border-4 border-green-500 bg-green-500/20 rounded-md transition-all duration-200 pointer-events-none"
                            style={{
                                top: `${highlightedPlant.boundingBox.y * 100}%`,
                                left: `${highlightedPlant.boundingBox.x * 100}%`,
                                width: `${highlightedPlant.boundingBox.width * 100}%`,
                                height: `${highlightedPlant.boundingBox.height * 100}%`,
                            }}
                        >
                          <span className="absolute -top-7 left-0 bg-green-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">{highlightedPlant.name}</span>
                        </div>
                    )}
                </div>
            )}
             {!isLoading && !generatedImageUrl && !error && (
              <div className="text-center text-gray-500 p-4">
                <ImageIcon className="w-16 h-16 mx-auto mb-4" />
                <p>Your edited image will appear here.</p>
              </div>
            )}
            {!isLoading && error && (
               <div className="text-center text-red-500 p-4">
                <XCircleIcon className="w-16 h-16 mx-auto mb-4" />
                <p className="font-semibold">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Plant Details */}
      {!isLoading && floraDetails && floraDetails.length > 0 && (
        <div className="bg-white/50 p-4 rounded-lg border border-green-200">
            <h3 className="text-xl font-semibold mb-4 text-green-900">Added Flora Details</h3>
            <div className="space-y-4">
                {floraDetails.map((plant, index) => (
                    <div 
                        key={index} 
                        className="bg-white/50 p-4 rounded-md border border-green-200 transition-all duration-200 hover:border-green-500 hover:bg-green-50/70 cursor-pointer"
                        onMouseEnter={() => setHighlightedPlant(plant)}
                        onMouseLeave={() => setHighlightedPlant(null)}
                        onClick={() => handlePlantClick(plant)}
                    >
                        <h4 className="text-lg font-bold text-green-600">{plant.name}</h4>
                        <p className="text-gray-700 mt-1">{plant.description}</p>
                        <p className="text-sm text-gray-500 mt-2"><strong className="text-gray-700">Care Tips:</strong> {plant.care_tips}</p>
                    </div>
                ))}
            </div>
        </div>
      )}
       {!isLoading && floraDetails && floraDetails.length === 0 && generatedImageUrl && (
         <div className="bg-white/50 p-4 rounded-lg border border-green-200 text-center">
            <p className="text-gray-500">AI added plants, but could not identify them with confidence.</p>
        </div>
      )}

      {/* Zoom Modal */}
      {isZoomed && generatedImageUrl && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 animate-fade-in"
          onClick={() => { setIsZoomed(false); setZoomedPlant(null); }}
        >
          <button
            onClick={() => { setIsZoomed(false); setZoomedPlant(null); }}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-50"
            aria-label="Close zoomed view"
          >
            <XIcon className="w-10 h-10" />
          </button>
          <div
            className="relative max-w-[90vw] max-h-[90vh] rounded-md overflow-hidden flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={generatedImageUrl}
              alt="Generated by AI - Zoomed"
              className="transition-transform duration-300 ease-in-out"
              style={getZoomedImageStyle()}
            />
            {zoomedPlant && (
              <div
                className="absolute flex flex-col items-center pointer-events-none drop-shadow-lg"
                 style={{
                    top: `calc(${zoomedPlant.boundingBox.y * 100}% - 8px)`, // Position arrow tip just above the box
                    left: `${(zoomedPlant.boundingBox.x + zoomedPlant.boundingBox.width / 2) * 100}%`,
                    transform: 'translate(-50%, -100%)',
                }}
              >
                  <span className="bg-green-600 text-white text-base font-semibold px-4 py-1.5 rounded-full whitespace-nowrap shadow-xl">
                      {zoomedPlant.name}
                  </span>
                  <ArrowDownIcon className="w-10 h-10 text-green-600" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageProcessor;