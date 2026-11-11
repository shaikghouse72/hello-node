const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const app = require('./hello-world');

test('Docker Studio application HTTP tests', async (t) => {
    const server = http.createServer(app.listeners('request')[0]);

    await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(0, '127.0.0.1', resolve);
    });

    t.after(async () => {
        await new Promise((resolve, reject) => {
            server.close((err) => err ? reject(err) : resolve());
        });
    });

    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;

    await t.test('Dashboard returns HTTP 200', async () => {
        const response = await fetch(`${baseUrl}/`);
        assert.equal(response.status, 200);
        assert.match(
            response.headers.get('content-type'),
            /text\/html/
        );

        const body = await response.text();

        assert.ok(
            body.includes('<title>Docker Studio | Live Dashboard</title>'),
            'Dashboard title should be present'
        );
    });

    await t.test('Health endpoint returns healthy', async () => {
        const response = await fetch(`${baseUrl}/health`);

        assert.equal(response.status, 200);

        const body = await response.json();
        assert.equal(body.status, 'healthy');
    });

    await t.test('Status API returns JSON', async () => {
        const response = await fetch(`${baseUrl}/api/status`);

        assert.equal(response.status, 200);
        assert.match(
            response.headers.get('content-type'),
            /application\/json/
        );

        const body = await response.json();
        assert.equal(typeof body, 'object');
        assert.ok(body !== null);
    });

    await t.test('Invalid route returns HTTP 404', async () => {
        const response = await fetch(`${baseUrl}/invalid-route`);

        assert.equal(response.status, 404);
    });

    await t.test('Unsupported method returns HTTP 405', async () => {
        const response = await fetch(`${baseUrl}/`, {
            method: 'POST'
        });

        assert.equal(response.status, 405);
        assert.equal(response.headers.get('allow'), 'GET, HEAD');
    });

    await t.test('HEAD request returns no body', async () => {
        const response = await fetch(`${baseUrl}/`, {
            method: 'HEAD'
        });

        assert.equal(response.status, 200);
        assert.equal(await response.text(), '');
    });
});
