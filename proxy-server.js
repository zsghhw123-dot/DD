const http = require('http');
const https = require('https');
const url = require('url');

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Only handle POST requests to /api/feishu-token
  if (req.method === 'POST' && req.url === '/api/feishu-token') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const requestData = JSON.parse(body);
        
        // Prepare the request to Feishu API
        const postData = JSON.stringify({
          app_id: requestData.app_id,
          app_secret: requestData.app_secret
        });

        const options = {
          hostname: 'open.feishu.cn',
          port: 443,
          path: '/open-apis/auth/v3/tenant_access_token/internal',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(postData)
          }
        };

        const proxyReq = https.request(options, (proxyRes) => {
          let responseData = '';

          proxyRes.on('data', (chunk) => {
            responseData += chunk;
          });

          proxyRes.on('end', () => {
            res.writeHead(proxyRes.statusCode, {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            });
            res.end(responseData);
          });
        });

        proxyReq.on('error', (error) => {
          console.error('Proxy request error:', error);
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Proxy request failed' }));
        });

        proxyReq.write(postData);
        proxyReq.end();

      } catch (error) {
        console.error('JSON parse error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
  console.log('Use POST /api/feishu-token to proxy Feishu API requests');
});