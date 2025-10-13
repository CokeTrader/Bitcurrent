/**
 * WebSocket server for real-time price updates
 * Broadcasts crypto prices to all connected clients
 */

const WebSocket = require('ws');
const logger = require('../utils/logger');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server, path: '/ws' });
    this.clients = new Set();
    this.priceCache = new Map();
    
    this.wss.on('connection', this.handleConnection.bind(this));
    this.startPriceBroadcast();
    
    logger.info('WebSocket server initialized');
  }

  handleConnection(ws, req) {
    logger.info('New WebSocket connection', { ip: req.socket.remoteAddress });
    
    this.clients.add(ws);

    // Send current prices immediately
    this.sendPrices(ws);

    // Handle messages from client
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        this.handleMessage(ws, data);
      } catch (error) {
        logger.error('WebSocket message parse error:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      this.clients.delete(ws);
      logger.info('WebSocket disconnected', { 
        remainingClients: this.clients.size 
      });
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error('WebSocket error:', error);
      this.clients.delete(ws);
    });
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case 'subscribe':
        // Subscribe to specific symbols
        ws.subscribedSymbols = data.symbols || [];
        logger.info('Client subscribed', { symbols: ws.subscribedSymbols });
        break;
        
      case 'unsubscribe':
        // Unsubscribe from symbols
        ws.subscribedSymbols = [];
        break;
        
      case 'ping':
        // Respond to ping
        ws.send(JSON.stringify({ type: 'pong' }));
        break;
        
      default:
        logger.warn('Unknown message type', { type: data.type });
    }
  }

  async sendPrices(ws = null) {
    try {
      // Mock price data (replace with real Alpaca API)
      const prices = {
        'BTC-GBP': {
          price: 60000 + Math.random() * 100 - 50,
          change24h: 3.82,
          volume24h: 1234567,
          timestamp: Date.now()
        },
        'ETH-GBP': {
          price: 3200 + Math.random() * 10 - 5,
          change24h: 10.47,
          volume24h: 987654,
          timestamp: Date.now()
        },
        'SOL-GBP': {
          price: 150 + Math.random() * 5 - 2.5,
          change24h: 8.91,
          volume24h: 456789,
          timestamp: Date.now()
        },
        'XRP-GBP': {
          price: 2 + Math.random() * 0.1 - 0.05,
          change24h: 5.83,
          volume24h: 234567,
          timestamp: Date.now()
        }
      };

      // Cache prices
      this.priceCache = new Map(Object.entries(prices));

      const message = JSON.stringify({
        type: 'prices',
        data: prices,
        timestamp: Date.now()
      });

      if (ws) {
        // Send to specific client
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      } else {
        // Broadcast to all clients
        this.broadcast(message);
      }
    } catch (error) {
      logger.error('Send prices error:', error);
    }
  }

  broadcast(message) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  broadcastTrade(trade) {
    const message = JSON.stringify({
      type: 'trade',
      data: trade,
      timestamp: Date.now()
    });
    
    this.broadcast(message);
    logger.info('Trade broadcast', { symbol: trade.symbol });
  }

  broadcastOrderBook(symbol, orderBook) {
    const message = JSON.stringify({
      type: 'orderbook',
      symbol,
      data: orderBook,
      timestamp: Date.now()
    });
    
    this.broadcast(message);
  }

  startPriceBroadcast() {
    // Broadcast prices every 3 seconds
    setInterval(() => {
      this.sendPrices();
    }, 3000);
    
    logger.info('Price broadcast started (3s interval)');
  }

  getStats() {
    return {
      connectedClients: this.clients.size,
      cachedSymbols: this.priceCache.size
    };
  }
}

module.exports = WebSocketServer;


