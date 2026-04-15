const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3001; // Different port to avoid conflicts

// Enable CORS for all routes
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:8082'],
  credentials: true
}));

// Proxy all API requests to the production server
app.use('/api', createProxyMiddleware({
  target: 'https://growsmartserver.gogrowsmart.com',
  changeOrigin: true,
  secure: true,
  headers: {
    'Origin': 'https://growsmartserver.gogrowsmart.com',
    'Referer': 'https://growsmartserver.gogrowsmart.com/'
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('🔄 Proxying request:', req.method, req.url, '→', proxyReq.protocol + '//' + proxyReq.host + proxyReq.path);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('✅ Proxy response:', proxyRes.statusCode, req.url);
  },
  onError: (err, req, res) => {
    console.error('❌ Proxy error:', err.message);
    res.status(500).json({ 
      error: 'Proxy error', 
      message: 'Failed to connect to backend server',
      details: err.message 
    });
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'CORS Proxy Server is running',
    target: 'https://growsmartserver.gogrowsmart.com'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 CORS Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Proxying requests to: https://growsmartserver.gogrowsmart.com`);
  console.log(`🌐 CORS enabled for: http://localhost:8081`);
  console.log(`🔗 Test health: http://localhost:${PORT}/health`);
});

module.exports = app;
