import type { Express } from "express";
import { createServer, type Server } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";

export async function registerRoutes(app: Express): Promise<Server> {
  // Proxy all /api requests to Python backend running on port 8000
  app.use('/api', createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true,
    pathRewrite: {
      '^/api': '', // Remove /api prefix when forwarding to Python backend
    },
  }));

  const httpServer = createServer(app);

  return httpServer;
}
