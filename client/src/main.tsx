import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './app/index.css';
import { installStaleChunkReload } from '@/shared/lib/stale-chunk-reload';

import App from './app/App.tsx';

installStaleChunkReload();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
