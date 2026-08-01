const http = require('http');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'browser-errors.log');

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/log') {
    const error = url.searchParams.get('error');
    const stack = url.searchParams.get('stack');
    const logMsg = `[BROWSER ERROR] ${new Date().toISOString()}\nError: ${error}\nStack: ${stack}\n\n`;
    
    console.log(logMsg);
    fs.appendFileSync(logFile, logMsg);
    
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Logged');
    return;
  }

  res.writeHead(404);
  res.end();
});

server.listen(9999, '127.0.0.1', () => {
  console.log('Logging server listening on http://127.0.0.1:9999');
});
