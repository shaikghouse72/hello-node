const test = require('node:test');
const assert = require('node:assert');

test('Hello World HTTP server test', async () => {
  const response = await fetch('http://localhost:3000');

  assert.strictEqual(response.status, 200);

  const body = await response.text();

  assert.strictEqual(body, 'Hello World from VM 69!\n');
});
