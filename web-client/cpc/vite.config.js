import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { bunny } from 'laravel-vite-plugin/fonts';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.jsx',
            ],
            refresh: true,
        }),
        react(),
        tailwindcss(),
        visualizer({ open: true, filename: 'stats.html' }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(process.cwd(), 'resources/js'),
        },
        extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
    },
    // --- Tambahkan blok server ini agar Docker HMR berjalan lancar ---
    server: {
        host: '0.0.0.0',
        port: 5173,
        hmr: {
            host: 'localhost',
        },
        watch: {
            usePolling: true, // Diperlukan agar Vite mendeteksi perubahans file dari host OS ke container
        },
    },
});