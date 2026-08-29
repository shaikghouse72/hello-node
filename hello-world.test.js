const test = require('node:test');
const assert = require('node:assert');

const http = require('node:http');
const os = require('node:os');

const hostname = '127.0.0.1';
const port = 3001;

test('Hello World HTTP server test', async () => {

  const server = http.createServer((req, res) => {

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    res.end(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Kubernetes Node.js Dashboard</title>
</head>
<body>

<h1>Hello from Kubernetes! 🚀</h1>

<p>Your Node.js application is running inside a Kubernetes Pod.</p>

<p>Application: Node.js</p>

<p>Container Port: 3000</p>

<p>Platform: ${os.platform()}</p>

<p>Architecture: ${os.arch()}</p>

</body>
</html>
    `);
  });

  await new Promise((resolve) => {
    server.listen(port, hostname, resolve);
  });

  try {

    const response = await fetch(`http://${hostname}:${port}`);

    assert.strictEqual(response.status, 200);

    const body = await response.text();

    assert.ok(
      body.includes('Hello from Kubernetes!'),
      'Response should contain Kubernetes greeting'
    );

    assert.ok(
      body.includes('Node.js'),
      'Response should contain Node.js'
    );

    assert.ok(
      body.includes('Container Port: 3000'),
      'Response should contain container port'
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
