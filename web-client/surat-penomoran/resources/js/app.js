import './bootstrap';

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').catch((error) => {
            console.error('Surat Penomoran service worker gagal didaftarkan:', error);
        });
    });
}

import Alpine from 'alpinejs';

window.Alpine = Alpine;

Alpine.start();
