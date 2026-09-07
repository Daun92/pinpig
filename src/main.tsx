import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/globals.css';
import { initializeDatabase } from '@/services/database';
import { installGlobalErrorHandlers, registerTelemetryProvider, consoleTelemetryProvider } from '@/services/telemetry';

// 전역 오류 훅 — 기기 내 최근 오류 목록에 남기고, 동의 시에만 외부 provider로 간다
installGlobalErrorHandlers();
if (import.meta.env.DEV) registerTelemetryProvider(consoleTelemetryProvider);

// Development: Expose seed functions to window for console access
if (import.meta.env.DEV) {
  import('@/services/seedDatabase').then(({ seedDatabase, seedEmptyDatabase, seedRecentTransactions }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    win.seedDatabase = seedDatabase;
    win.seedEmptyDatabase = seedEmptyDatabase;
    win.seedRecentTransactions = seedRecentTransactions;
    console.log(`
🌱 PinPig Dev Tools:
   seedDatabase()           - 6개월치 풀 테스트 데이터
   seedEmptyDatabase()      - 온보딩 테스트용 빈 DB
   seedRecentTransactions() - 최근 거래만 추가
    `);
  });
}

// Request persistent storage (prevents iOS Safari from deleting IndexedDB)
async function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persisted();
    if (!isPersisted) {
      const granted = await navigator.storage.persist();
      if (import.meta.env.DEV) console.log(`Storage persistence: ${granted ? 'granted' : 'denied'}`);
    } else if (import.meta.env.DEV) {
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
