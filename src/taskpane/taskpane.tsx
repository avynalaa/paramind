import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './components/App';

declare global {
  interface Window {
    Office: any;
  }
}

/* global Office */

Office.onReady((info) => {
  if (info.host === Office.HostType.Word) {
    const container = document.getElementById('app');
    if (container) {
      const root = createRoot(container);
      root.render(<App />);
    }
  }
}); 