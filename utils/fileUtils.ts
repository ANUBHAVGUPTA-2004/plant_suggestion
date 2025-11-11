export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function dataUrlToBlobInfo(dataUrl: string): { base64Data: string; mimeType: string } {
  const parts = dataUrl.split(',');
  if (parts.length !== 2) {
    throw new Error('Invalid data URL format');
  }
  
  const mimeTypeMatch = parts[0].match(/:(.*?);/);
  if (!mimeTypeMatch || mimeTypeMatch.length < 2) {
    throw new Error('Could not determine MIME type from data URL');
  }
  
  const mimeType = mimeTypeMatch[1];
  const base64Data = parts[1];

  return { base64Data, mimeType };
}
