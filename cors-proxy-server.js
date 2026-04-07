const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for the frontend
app.use(cors({
  origin: ['http://localhost:65477', 'http://127.0.0.1:65477'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Test-User', 'Origin', 'X-Requested-With', 'Accept']
}));

// Proxy middleware to bypass CORS issues
const proxy = createProxyMiddleware({
  target: 'https://growsmartserver.gogrowsmart.com',
  changeOrigin: true,
  secure: true,
  logLevel: 'debug',
  onProxyReq: (proxyReq, req, res) => {
    console.log('🔗 Proxying:', req.method, req.url, '→ Production Backend');
    // Add test user headers if present
    if (req.headers['x-test-user']) {
      proxyReq.setHeader('X-Test-User', req.headers['x-test-user']);
    }
    if (req.headers['authorization']) {
      proxyReq.setHeader('Authorization', req.headers['authorization']);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('✅ Proxy response:', proxyRes.statusCode, req.url);
    // Add CORS headers to response
    proxyRes.headers['Access-Control-Allow-Origin'] = 'http://localhost:65477';
    proxyRes.headers['Access-Control-Allow-Credentials'] = 'true';
  },
  onError: (err, req, res) => {
    console.error('❌ Proxy error:', err.message);
    res.status(500).json({ 
      error: 'Proxy error', 
      message: 'Failed to connect to production backend',
      details: err.message 
    });
  }
});

// Route all API requests through proxy
app.use('/api', proxy);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'CORS Proxy Running', 
    port: PORT,
    target: 'https://growsmartserver.gogrowsmart.com',
    frontend: 'http://localhost:65477'
  });
});

app.listen(PORT, () => {
  console.log('🚀 CORS Proxy Server Started!');
  console.log(`📡 Local Proxy: http://localhost:${PORT}`);
  console.log(`🎯 Frontend: http://localhost:65477`);
  console.log(`🌐 Target: https://growsmartserver.gogrowsmart.com`);
  console.log('');
  console.log('📋 Instructions:');
  console.log('1. Keep this proxy server running');
  console.log('2. Update frontend config to use http://localhost:3001');
  console.log('3. Test with student1@example.com');
});
