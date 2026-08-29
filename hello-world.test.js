const test = require('node:test');
const assert = require('node:assert');

const http = require('node:http');

const HOST = '127.0.0.1';
const PORT = 3001;

/*
 * Import the real application.
 *
 * hello-world.js should export the HTTP server.
 */
const app = require('./hello-world');

test('Docker Node.js application HTTP test', async () => {

    const originalPort = process.env.PORT;

    process.env.PORT = String(PORT);

    await new Promise((resolve, reject) => {

        app.listen(PORT, HOST, () => {
            resolve();
        });

        app.on('error', reject);

    });

    try {

        const response = await fetch(
            `http://${HOST}:${PORT}`
        );

        assert.strictEqual(
            response.status,
            200
        );

        const body = await response.text();

        assert.ok(
            body.includes('Hello from Docker!'),
            'Response should contain Docker greeting'
        );

        assert.ok(
            body.includes('Node.js application'),
            'Response should contain Node.js application text'
        );

        assert.ok(
            body.includes('APPLICATION RUNNING'),
            'Response should contain application status'
        );

    } finally {

        await new Promise((resolve) => {
            app.close(() => {
                resolve();
            });
        });

        if (originalPort === undefined) {
            delete process.env.PORT;
        } else {
            process.env.PORT = originalPort;
        }

    }

});
