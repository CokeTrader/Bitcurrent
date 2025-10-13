/**
 * Event-Driven Architecture
 * 
 * Decouple components using events:
 * - Event emitters
 * - Event subscribers
 * - Async event handling
 * - Event logging
 * - Event replay
 */

const EventEmitter = require('events');

class DomainEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.eventLog = [];
    this.maxLogSize = 10000;
  }

  /**
   * Emit event with logging
   */
  emitEvent(eventName, data) {
    // Log event
    const event = {
      name: eventName,
      data,
      timestamp: new Date().toISOString(),
      id: Date.now() + Math.random()
    };

    this.eventLog.push(event);

    // Trim log if too large
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }

    // Emit event
    this.emit(eventName, data);

    console.log(`📢 Event: ${eventName}`, JSON.stringify(data).substring(0, 100));
  }

  /**
   * Get event log
   */
  getEventLog(filterByName = null, limit = 100) {
    let events = this.eventLog;

    if (filterByName) {
      events = events.filter(e => e.name === filterByName);
    }

    return events.slice(-limit);
  }
}

// Global event bus
const eventBus = new DomainEventEmitter();

// Define domain events
const Events = {
  // Trading events
  TRADE_EXECUTED: 'trade.executed',
  ORDER_CREATED: 'order.created',
  ORDER_CANCELLED: 'order.cancelled',
  
  // User events
  USER_REGISTERED: 'user.registered',
  USER_LOGGED_IN: 'user.logged_in',
  USER_LOGGED_OUT: 'user.logged_out',
  
  // Financial events
  DEPOSIT_COMPLETED: 'deposit.completed',
  WITHDRAWAL_INITIATED: 'withdrawal.initiated',
  WITHDRAWAL_COMPLETED: 'withdrawal.completed',
  
  // Bot events
  BOT_CREATED: 'bot.created',
  BOT_EXECUTED: 'bot.executed',
  BOT_STOPPED: 'bot.stopped',
  
  // Security events
  SUSPICIOUS_ACTIVITY: 'security.suspicious_activity',
  LOGIN_FAILED: 'security.login_failed',
  ACCOUNT_LOCKED: 'security.account_locked',
  
  // System events
  PERFORMANCE_DEGRADED: 'system.performance_degraded',
  ERROR_THRESHOLD_EXCEEDED: 'system.error_threshold_exceeded'
};

/**
 * Event handlers for automatic actions
 */
class EventHandlers {
  static setupHandlers() {
    // When trade executed, send notification
    eventBus.on(Events.TRADE_EXECUTED, async (data) => {
      try {
        const emailService = require('../services/email-notification-service');
        await emailService.sendTradeConfirmation(data.userId, data.trade);
      } catch (error) {
        console.error('Trade notification error:', error);
      }
    });

    // When deposit completed, credit balance
    eventBus.on(Events.DEPOSIT_COMPLETED, async (data) => {
      try {
        const emailService = require('../services/email-notification-service');
        await emailService.sendDepositConfirmation(data.userId, data.amount);
      } catch (error) {
        console.error('Deposit notification error:', error);
      }
    });

    // When suspicious activity detected, alert admin
    eventBus.on(Events.SUSPICIOUS_ACTIVITY, async (data) => {
      console.warn('⚠️  SUSPICIOUS ACTIVITY:', data);
      // Send to admin dashboard, alert via email, etc.
    });

    // When bot executed, check if notification needed
    eventBus.on(Events.BOT_EXECUTED, async (data) => {
      try {
        const emailService = require('../services/email-notification-service');
        await emailService.sendBotNotification(
          data.userId,
          data.botName,
          'executed trade',
          data.details
        );
      } catch (error) {
        console.error('Bot notification error:', error);
      }
    });

    console.log('✅ Event handlers configured');
  }
}

module.exports = {
  eventBus,
  Events,
  EventHandlers,
  DomainEventEmitter
};

