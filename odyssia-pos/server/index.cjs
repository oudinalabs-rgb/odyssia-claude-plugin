#!/usr/bin/env node
// Odyssia POS for Claude Desktop: a tiny stdio bridge to the connector that runs inside the Odyssia app on this same computer.
// Claude Desktop starts this file and talks MCP to it over stdin/stdout (one JSON message per line); every message is forwarded to
// http://127.0.0.1:<port>/mcp with the access token, and the answer is handed back. Nothing leaves this computer from here, the
// connector only listens on the loopback address, and no dependency is needed (plain Node 18+).
'use strict';

const http = require('node:http');
const readline = require('node:readline');

const PORT = Number(process.env.ODYSSIA_PORT);
const TOKEN = String(process.env.ODYSSIA_TOKEN || '').trim();

function reply(message) {
  process.stdout.write(JSON.stringify(message) + '\n');
}

function failure(id, text) {
  if (id === undefined || id === null) return; // a notification has no answer, not even an error
  reply({ jsonrpc: '2.0', id, error: { code: -32000, message: text } });
}

if (!Number.isInteger(PORT) || PORT < 1024 || PORT > 65535 || TOKEN.length < 16) {
  process.stderr.write('Odyssia: set the port and the access token in the extension settings (Odyssia > Settings > AI assistants).\n');
}

function forward(message) {
  const body = JSON.stringify(message);
  const req = http.request(
    { host: '127.0.0.1', port: PORT, path: '/mcp', method: 'POST', timeout: 90_000, headers: { 'Content-Type': 'application/json', Accept: 'application/json', Authorization: `Bearer ${TOKEN}`, 'Content-Length': Buffer.byteLength(body) } },
    (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8').trim();
        if (res.statusCode === 401 || res.statusCode === 403) return failure(message.id, 'Odyssia refused the access token: copy it again from Odyssia > Settings > AI assistants.');
        if (res.statusCode === 202 || text === '') return; // a notification: nothing to say back
        try {
          reply(JSON.parse(text));
        } catch {
          failure(message.id, `Odyssia answered something unreadable (HTTP ${res.statusCode}).`);
        }
      });
    },
  );
  req.on('timeout', () => req.destroy(new Error('timeout')));
  req.on('error', (e) =>
    failure(message.id, e && e.code === 'ECONNREFUSED' ? 'Odyssia is not running, or the AI connector is switched off (Odyssia > Settings > AI assistants), or the port is different.' : `Could not reach Odyssia: ${e && e.message ? e.message : e}`),
  );
  req.end(body);
}

const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
lines.on('line', (line) => {
  const text = line.trim();
  if (!text) return;
  let message;
  try {
    message = JSON.parse(text);
  } catch {
    return reply({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
  }
  if (Array.isArray(message)) return message.forEach(forward);
  forward(message);
});
lines.on('close', () => process.exit(0));
