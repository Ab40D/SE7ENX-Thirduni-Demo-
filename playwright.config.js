import { defineConfig, devices } from '@playwright/test';
const PORT = Number(process.env.PORT ?? 5173);
const baseURL = `http://localhost:${PORT}`;
export default defineConfig({
    testDir: './tests/e2e',
    timeout: 60_000,
    expect: { timeout: 10_000 },
    fullyParallel: false,
    workers: 1,
    reporter: [['list']],
    use: {
        baseURL,
        trace: 'retain-on-failure',
        launchOptions: {
            args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
        },
    },
    projects: [
        {
            name: 'desktop',
            use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 960 } },
            testIgnore: /gesture\.spec\.ts/,
        },
        {
            name: 'mobile',
            use: { ...devices['Pixel 5'] },
            testMatch: /responsive\.spec\.ts/,
        },
        {
            // Synthetic camera so the real hand-tracking pipeline can be exercised.
            name: 'gesture',
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1280, height: 900 },
                permissions: ['camera'],
                launchOptions: {
                    args: [
                        '--use-gl=angle',
                        '--use-angle=swiftshader',
                        '--enable-unsafe-swiftshader',
                        '--use-fake-device-for-media-stream',
                        '--use-fake-ui-for-media-stream',
                    ],
                },
            },
            testMatch: /gesture\.spec\.ts/,
        },
    ],
    webServer: {
        command: `npm run dev -- --port ${PORT}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 120_000,
    },
});
