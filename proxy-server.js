const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 8082; // Separate port for proxy

// Enable CORS for development
app.use(cors({
  origin: ['http://localhost:8081', 'http://127.0.0.1:8081', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Test-User', 'Origin', 'X-Requested-With', 'Accept']
}));

// Handle preflight requests
app.options('*', cors());

// Proxy middleware configuration for local development
const proxyOptions = {
  target: 'http://localhost:3000',
  changeOrigin: true,
  secure: false,
  logLevel: 'debug',
  pathRewrite: {
    '^/api': '' // Remove /api prefix when forwarding to backend
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('🔗 Proxying request:', req.method, req.url, '→', proxyOptions.target);
    
    // Forward custom headers
    if (req.headers.authorization) {
      proxyReq.setHeader('Authorization', req.headers.authorization);
    }
    if (req.headers['x-test-user']) {
      proxyReq.setHeader('X-Test-User', req.headers['x-test-user']);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('✅ Proxy response:', proxyRes.statusCode, req.url);
    
    // Add CORS headers to response
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Test-User, Origin, X-Requested-With, Accept');
  },
  onError: (err, req, res) => {
    console.error('❌ Proxy error:', err.message);
    res.status(500).json({ 
      error: 'Backend connection failed', 
      message: 'Please ensure backend is running on localhost:3000' 
    });
  }
};

// Create proxy middleware
const apiProxy = createProxyMiddleware(proxyOptions);

// Route all API requests through proxy
app.use('/api', apiProxy);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Development Proxy server running', 
    port: PORT, 
    target: 'http://localhost:3000',
    frontend: 'http://localhost:8081'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Development CORS Proxy server running on http://localhost:${PORT}`);
  console.log(`📡 Proxying requests to: http://localhost:3000`);
  console.log(`🌐 Allowing origins: http://localhost:8081, http://127.0.0.1:8081`);
  console.log(`✅ Update your config.ts to use: http://localhost:${PORT}/api`);
});
