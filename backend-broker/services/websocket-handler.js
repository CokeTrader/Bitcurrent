/**
 * Enhanced WebSocket Handler
 * Real-time price updates and order notifications
 */

const WebSocket = require('ws');
const logger = require('../utils/logger');

class WebSocketHandler {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map(); // userId -> Set of WebSocket connections
    this.subscriptions = new Map(); // WebSocket -> Set of subscribed pairs
    
    this.setupWebSocketServer();
    this.startPriceUpdateLoop();
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      logger.info('WebSocket client connected', { ip: req.socket.remoteAddress });

      ws.isAlive = true;
      ws.on('pong', () => { ws.isAlive = true; });

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          logger.error('Invalid WebSocket message', { error: error.message });
          ws.send(JSON.stringify({ error: 'Invalid message format' }));
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
        logger.info('WebSocket client disconnected');
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error', { error: error.message });
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to BitCurrent WebSocket',
        timestamp: Date.now()
      }));
    });

    // Heartbeat to detect broken connections
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (!ws.isAlive) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    logger.info('WebSocket server initialized');
  }

  handleMessage(ws, data) {
    const { action, ...params } = data;

    switch (action) {
      case 'subscribe':
        this.handleSubscribe(ws, params);
        break;
      
      case 'unsubscribe':
        this.handleUnsubscribe(ws, params);
        break;
      
      case 'authenticate':
        this.handleAuthenticate(ws, params);
        break;
      
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
      
      default:
        ws.send(JSON.stringify({ error: 'Unknown action' }));
    }
  }

  handleSubscribe(ws, { channel, pair }) {
    if (!this.subscriptions.has(ws)) {
      this.subscriptions.set(ws, new Set());
    }

    const subscription = `${channel}:${pair}`;
    this.subscriptions.get(ws).add(subscription);

    ws.send(JSON.stringify({
      type: 'subscribed',
      channel,
      pair,
      timestamp: Date.now()
    }));

    logger.info('Client subscribed', { channel, pair });
  }

  handleUnsubscribe(ws, { channel, pair }) {
    if (this.subscriptions.has(ws)) {
      const subscription = `${channel}:${pair}`;
      this.subscriptions.get(ws).delete(subscription);

      ws.send(JSON.stringify({
        type: 'unsubscribed',
        channel,
        pair,
        timestamp: Date.now()
      }));
    }
  }

  handleAuthenticate(ws, { token, userId }) {
    // Verify JWT token here
    ws.userId = userId;
    ws.authenticated = true;

    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId).add(ws);

    ws.send(JSON.stringify({
      type: 'authenticated',
      userId,
      timestamp: Date.now()
    }));

    logger.info('Client authenticated', { userId });
  }

  handleDisconnect(ws) {
    // Remove from subscriptions
    this.subscriptions.delete(ws);

    // Remove from authenticated clients
    if (ws.userId && this.clients.has(ws.userId)) {
      this.clients.get(ws.userId).delete(ws);
      if (this.clients.get(ws.userId).size === 0) {
        this.clients.delete(ws.userId);
      }
    }
  }

  /**
   * Broadcast price update to subscribed clients
   */
  broadcastPriceUpdate(pair, priceData) {
    const message = JSON.stringify({
      type: 'price',
      pair,
      data: priceData,
      timestamp: Date.now()
    });

    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        const subs = this.subscriptions.get(ws);
        if (subs && (subs.has(`ticker:${pair}`) || subs.has('ticker:all'))) {
          ws.send(message);
        }
      }
    });
  }

  /**
   * Send order update to specific user
   */
  sendOrderUpdate(userId, orderData) {
    const clients = this.clients.get(userId);
    if (!clients) return;

    const message = JSON.stringify({
      type: 'order',
      data: orderData,
      timestamp: Date.now()
    });

    clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });

    logger.info('Order update sent', { userId, orderId: orderData.id });
  }

  /**
   * Broadcast trade to all clients subscribed to pair
   */
  broadcastTrade(pair, tradeData) {
    const message = JSON.stringify({
      type: 'trade',
      pair,
      data: tradeData,
      timestamp: Date.now()
    });

    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        const subs = this.subscriptions.get(ws);
        if (subs && (subs.has(`trades:${pair}`) || subs.has('trades:all'))) {
          ws.send(message);
        }
      }
    });
  }

  /**
   * Simulate price updates (in production, connect to Alpaca WebSocket)
   */
  startPriceUpdateLoop() {
    const pairs = ['BTC/USD', 'ETH/USD', 'SOL/USD', 'ADA/USD', 'DOT/USD'];
    
    setInterval(() => {
      pairs.forEach((pair) => {
        // Simulate price movement
        const basePrice = pair === 'BTC/USD' ? 67000 : pair === 'ETH/USD' ? 3500 : 150;
        const change = (Math.random() - 0.5) * basePrice * 0.001; // 0.1% max change
        const price = basePrice + change;

        this.broadcastPriceUpdate(pair, {
          price: parseFloat(price.toFixed(2)),
          change24h: (Math.random() - 0.5) * 5,
          volume24h: Math.random() * 10000000
        });
      });
    }, 2000); // Update every 2 seconds
  }

  /**
   * Get connection stats
   */
  getStats() {
    return {
      totalConnections: this.wss.clients.size,
      authenticatedUsers: this.clients.size,
      totalSubscriptions: Array.from(this.subscriptions.values())
        .reduce((sum, subs) => sum + subs.size, 0)
    };
  }
}

module.exports = WebSocketHandler;

