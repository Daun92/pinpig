import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';
import { initializeDatabase } from '@/services/database';

// Request persistent storage (prevents iOS Safari from deleting IndexedDB)
async function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persisted();
    if (!isPersisted) {
      const granted = await navigator.storage.persist();
      console.log(`Storage persistence: ${granted ? 'granted' : 'denied'}`);
    } else {
      console.log('Storage persistence: already granted');
    }
  }
}

// Initialize database and request persistent storage
async function initializeApp() {
  await initializeDatabase();
  await requestPersistentStorage();
}

initializeApp().catch(console.error);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
