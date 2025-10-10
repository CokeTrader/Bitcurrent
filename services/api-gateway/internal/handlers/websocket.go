// BitCurrent Exchange - WebSocket Handler
package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// TODO: Implement proper origin checking in production
		return true
	},
}

type WSMessage struct {
	Type     string   `json:"type"`
	Channels []string `json:"channels,omitempty"`
	Symbols  []string `json:"symbols,omitempty"`
	Data     interface{} `json:"data,omitempty"`
}

type WSClient struct {
	conn        *websocket.Conn
	send        chan []byte
	logger      *zap.Logger
	subscriptions map[string]bool
	mu          sync.RWMutex
}

func NewWSClient(conn *websocket.Conn, logger *zap.Logger) *WSClient {
	return &WSClient{
		conn:          conn,
		send:          make(chan []byte, 256),
		logger:        logger,
		subscriptions: make(map[string]bool),
	}
}

func (c *WSClient) readPump() {
	defer func() {
		c.conn.Close()
	}()

	c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				c.logger.Error("WebSocket read error", zap.Error(err))
			}
			break
		}

		var msg WSMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			c.logger.Warn("Invalid WebSocket message", zap.Error(err))
			continue
		}

		c.handleMessage(&msg)
	}
}

func (c *WSClient) writePump() {
	ticker := time.NewTicker(54 * time.Second)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *WSClient) handleMessage(msg *WSMessage) {
	switch msg.Type {
	case "subscribe":
		c.handleSubscribe(msg)
	case "unsubscribe":
		c.handleUnsubscribe(msg)
	case "ping":
		c.sendMessage(WSMessage{Type: "pong"})
	default:
		c.logger.Warn("Unknown message type", zap.String("type", msg.Type))
	}
}

func (c *WSClient) handleSubscribe(msg *WSMessage) {
	c.mu.Lock()
	defer c.mu.Unlock()

	for _, channel := range msg.Channels {
		for _, symbol := range msg.Symbols {
			key := fmt.Sprintf("%s:%s", channel, symbol)
			c.subscriptions[key] = true
			c.logger.Debug("Client subscribed",
				zap.String("channel", channel),
				zap.String("symbol", symbol),
			)
		}
	}

	c.sendMessage(WSMessage{
		Type: "subscribed",
		Data: map[string]interface{}{
			"channels": msg.Channels,
			"symbols":  msg.Symbols,
		},
	})
}

func (c *WSClient) handleUnsubscribe(msg *WSMessage) {
	c.mu.Lock()
	defer c.mu.Unlock()

	for _, channel := range msg.Channels {
		for _, symbol := range msg.Symbols {
			key := fmt.Sprintf("%s:%s", channel, symbol)
			delete(c.subscriptions, key)
			c.logger.Debug("Client unsubscribed",
				zap.String("channel", channel),
				zap.String("symbol", symbol),
			)
		}
	}

	c.sendMessage(WSMessage{
		Type: "unsubscribed",
		Data: map[string]interface{}{
			"channels": msg.Channels,
			"symbols":  msg.Symbols,
		},
	})
}

func (c *WSClient) sendMessage(msg WSMessage) {
	data, err := json.Marshal(msg)
	if err != nil {
		c.logger.Error("Failed to marshal message", zap.Error(err))
		return
	}

	select {
	case c.send <- data:
	default:
		c.logger.Warn("Send buffer full, dropping message")
	}
}

func (c *WSClient) isSubscribed(channel, symbol string) bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	key := fmt.Sprintf("%s:%s", channel, symbol)
	return c.subscriptions[key]
}

// WebSocketHandler handles WebSocket connections
func WebSocketHandler(logger *zap.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			logger.Error("Failed to upgrade WebSocket", zap.Error(err))
			return
		}

		client := NewWSClient(conn, logger)
		logger.Info("WebSocket client connected",
			zap.String("remote_addr", r.RemoteAddr),
		)

		// Start goroutines for reading and writing
		go client.writePump()
		go client.readPump()

		// TODO: Subscribe to Kafka topics based on client subscriptions
		// TODO: Broadcast market data updates to subscribed clients
	}
}

