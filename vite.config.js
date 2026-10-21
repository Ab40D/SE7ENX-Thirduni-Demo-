/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 5173,
        // The sandbox preview uses a dynamic host name, so any host is accepted
        // for the local dev/preview server only.
        allowedHosts: true,
    },
    preview: {
        host: '0.0.0.0',
        port: 4173,
        // The sandbox preview uses a dynamic host name, so any host is accepted
        // for the local dev/preview server only.
        allowedHosts: true,
    },
    build: {
        target: 'es2020',
        chunkSizeWarningLimit: 1200,
        rollupOptions: {
            output: {
                manualChunks: {
                    three: ['three'],
                    r3f: ['@react-three/fiber', '@react-three/drei'],
                },
            },
        },
    },
    test: {
        environment: 'node',
        include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
        globals: true,
    },
});
