import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Register PWA Service Worker with auto-update
registerSW({
  immediate: true,
  onOfflineReady() {
    // App cached and ready offline
  },
});

// Immediately preload and decode both Safar brand logos in memory for 0ms flicker-free rendering
const BRAND_LOGOS = [
  '/assets/aistudio/6f7fdfc9-b075-47cb-82d6-43431092bd3b_c44308e1.png',
  '/assets/aistudio/imgupscaler-enhanced__1_-Photoroom_04a70808.png',
];

for (const src of BRAND_LOGOS) {
  const img = new Image();
  img.src = src;
  if ('decode' in img) {
    img.decode().catch(() => {});
  }
}

createRoot(document.getElementById('root')!).render(<App />);
