/**
 * Email service using Resend API
 * Professional transactional emails
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Email templates directory
const TEMPLATES_DIR = path.join(__dirname, '../templates/emails');

/**
 * Load and process email template
 */
function loadTemplate(templateName, variables = {}) {
  try {
    const templatePath = path.join(TEMPLATES_DIR, `${templateName}.html`);
    let html = fs.readFileSync(templatePath, 'utf8');
    
    // Replace variables
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, variables[key] || '');
    });
    
    return html;
  } catch (error) {
    logger.error('Failed to load email template', { templateName, error: error.message });
    throw error;
  }
}

/**
 * Send email (currently simulated, needs Resend API key)
 */
async function sendEmail({ to, subject, html }) {
  try {
    // TODO: Integrate with Resend API
    // const resend = new Resend(process.env.RESEND_API_KEY);
    // await resend.emails.send({
    //   from: 'BitCurrent <noreply@bitcurrent.co.uk>',
    //   to,
    //   subject,
    //   html
    // });
    
    logger.info('Email sent', { to, subject });
    
    // For now, log the email (dev mode)
    if (process.env.NODE_ENV === 'development') {
      console.log('=== EMAIL ===');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('=============');
    }
    
    return { success: true };
  } catch (error) {
    logger.error('Failed to send email', { to, subject, error: error.message });
    throw error;
  }
}

/**
 * Send welcome email to new user
 */
async function sendWelcomeEmail(user) {
  const html = loadTemplate('welcome', {
    name: user.name || user.email.split('@')[0],
  });
  
  return sendEmail({
    to: user.email,
    subject: 'Welcome to BitCurrent - Claim Your £10 Bonus! 🎉',
    html
  });
}

/**
 * Send deposit confirmation email
 */
async function sendDepositConfirmation(user, deposit) {
  const html = loadTemplate('deposit-confirmed', {
    name: user.name || user.email.split('@')[0],
    amount: deposit.amount.toFixed(2),
    transactionId: deposit.id,
    timestamp: new Date(deposit.createdAt).toLocaleString('en-GB'),
    btcPrice: '60,000', // TODO: Get real prices
    ethPrice: '3,500',
    solPrice: '150'
  });
  
  return sendEmail({
    to: user.email,
    subject: `✅ Deposit Confirmed - £${deposit.amount} Ready to Trade`,
    html
  });
}

/**
 * Send price alert notification
 */
async function sendPriceAlert(user, alert) {
  const html = `
    <h2>Price Alert Triggered! 🔔</h2>
    <p>Hi ${user.name || 'there'},</p>
    <p><strong>${alert.symbol}</strong> has reached your target price:</p>
    <p style="font-size: 24px; font-weight: bold;">£${alert.targetPrice.toLocaleString()}</p>
    <p>Direction: ${alert.direction === 'above' ? '⬆️ Above' : '⬇️ Below'}</p>
    <a href="https://bitcurrent.vercel.app/trade/${alert.symbol}-GBP" 
       style="display: inline-block; background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
      Trade ${alert.symbol} Now →
    </a>
  `;
  
  return sendEmail({
    to: user.email,
    subject: `🔔 Price Alert: ${alert.symbol} reached £${alert.targetPrice.toLocaleString()}`,
    html
  });
}

/**
 * Send trade confirmation email
 */
async function sendTradeConfirmation(user, trade) {
  const html = `
    <h2>Trade Executed ✅</h2>
    <p>Hi ${user.name || 'there'},</p>
    <p>Your trade has been successfully executed:</p>
    <ul>
      <li><strong>Type:</strong> ${trade.side.toUpperCase()}</li>
      <li><strong>Symbol:</strong> ${trade.symbol}</li>
      <li><strong>Quantity:</strong> ${trade.quantity}</li>
      <li><strong>Price:</strong> £${trade.price.toLocaleString()}</li>
      <li><strong>Total:</strong> £${trade.total.toLocaleString()}</li>
      <li><strong>Fee:</strong> £${trade.fee.toFixed(2)}</li>
    </ul>
    <a href="https://bitcurrent.vercel.app/dashboard" 
       style="display: inline-block; background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
      View Portfolio →
    </a>
  `;
  
  return sendEmail({
    to: user.email,
    subject: `Trade Confirmed: ${trade.side.toUpperCase()} ${trade.symbol}`,
    html
  });
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendDepositConfirmation,
  sendPriceAlert,
  sendTradeConfirmation,
  loadTemplate
};


