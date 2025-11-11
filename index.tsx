
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

// Only mount the app if the 'root' element exists on the page.
// This prevents errors when the script is loaded on pages that don't host the app.
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.info('React root element not found. App will not be mounted on this page.');
}
