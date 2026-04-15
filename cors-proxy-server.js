const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://www.googletagmanager.com", "https://www.google-analytics.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "https://portal.gogrowsmart.com"],
      connectSrc: ["'self'", "https://api.gogrowsmart.com", "https://growsmartserver.gogrowsmart.com", "https://portal.gogrowsmart.com"],
      frameAncestors: ["'none'"],
    },
  },
}));

// Enhanced CORS configuration
const corsOptions = {
  origin: [
    'https://gogrowsmart.com',
    'https://portal.gogrowsmart.com',
    'https://growsmartserver.gogrowsmart.com',
    'http://localhost:8081',
    'http://localhost:8082',
    'https://localhost:8081',
    'https://localhost:8082'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// Proxy configuration
const proxyMiddleware = createProxyMiddleware({
  target: 'https://growsmartserver.gogrowsmart.com',
  changeOrigin: true,
  secure: true,
  timeout: 30000,
  onError: (err, req, res) => {
    console.error('Proxy Error:', err);
    res.status(500).json({
      error: 'Proxy server error',
      message: err.message
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('🔄 Proxying request:', req.method, req.url);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('✅ Proxy response:', proxyRes.statusCode, req.url);
  }
});

app.use('/api', proxyMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Enhanced CORS Proxy Server is running',
    target: 'https://growsmartserver.gogrowsmart.com',
    corsOrigins: corsOptions.origin,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Enhanced CORS Proxy Server running on port', PORT);
  console.log('📡 Proxying requests to: https://growsmartserver.gogrowsmart.com');
  console.log('🌐 CORS enabled for: gogrowsmart.com, portal.gogrowsmart.com');
  console.log('🔗 Test health: http://localhost:' + PORT + '/health');
  console.log('📊 All requests to /api/* will be proxied');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});
