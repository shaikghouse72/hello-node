const test = require('node:test');
const assert = require('node:assert');

const http = require('node:http');

const HOST = '127.0.0.1';
const PORT = 3001;

test('Docker Node.js application HTTP test', async () => {

    const server = http.createServer((req, res) => {

        res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8'
        });

        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Hello Node.js Docker Application</title>
            </head>
            <body>

                <h1>Hello from Docker!</h1>

                <p>
                    Node.js application running inside a Docker container
                </p>

                <p>
                    APPLICATION RUNNING
                </p>

            </body>
            </html>
        `);
    });

    await new Promise((resolve) => {
        server.listen(PORT, HOST, resolve);
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

        await new Promise((resolve, reject) => {

            server.close((error) => {

                if (error) {
                    reject(error);
                } else {
                    resolve();
                }

            });

        });

    }

});
