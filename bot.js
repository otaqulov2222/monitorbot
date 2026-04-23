const { TelegramClient, Api } = require("telegram");
const { StringSession } = require("telegram/sessions");
const { NewMessage } = require("telegram/events");
const { initDB, saveLead } = require('./db');
const logger = require('./logger');
const https = require('https');
require('dotenv').config();

// Configuration from .env
const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;
const stringSession = new StringSession(process.env.STRING_SESSION || "");
const adminId = process.env.ADMIN_ID;
const botToken = process.env.BOT_TOKEN;

// Filter keywords and stop words
const keywords = process.env.KEYWORDS.split(',').map(k => k.trim().toLowerCase());
const stopWords = process.env.STOP_WORDS.split(',').map(s => s.trim().toLowerCase());
const targetChatIds = process.env.TARGET_CHAT_IDS.split(',').map(id => id.trim());

const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 10,
  floodSleepThreshold: 60, // Auto wait for FloodWait up to 60s
});

/**
 * Main function to start the bot
 */
async function startBot() {
  try {
    logger.info("Initializing database...");
    await initDB();

    logger.info("Connecting to Telegram...");
    await client.connect();
    
    if (!(await client.checkAuthorization())) {
      logger.error("Session is invalid or expired! Run 'npm run session' to generate a new one.");
      process.exit(1);
    }
    
    logger.info("✅ Bot is online and monitoring...");

    // Event listener for new messages
    client.addEventHandler(async (event) => {
      const message = event.message;
      if (!message || !message.message) return;

      const chatId = message.peerId.userId || message.peerId.chatId || message.peerId.channelId;
      const text = message.message.toLowerCase();

      // Get Chat Info to check if it's in target_chat_ids
      let chatEntity;
      try {
        chatEntity = await client.getEntity(message.peerId);
      } catch (e) {
        logger.error(`Could not get entity for chat ${chatId}: ${e.message}`);
        return;
      }

      // Check if chat is in target list (check ID and Username)
      const isTarget = targetChatIds.some(target => {
        if (target.startsWith('@')) {
          return chatEntity.username === target.substring(1);
        }
        return chatEntity.id.toString() === target || `-100${chatEntity.id}` === target;
      });

      if (!isTarget && targetChatIds.length > 0) return;

      // Logic: Contains any keyword AND does NOT contain any stop word
      const hasKeyword = keywords.some(k => text.includes(k));
      const hasStopWord = stopWords.some(s => text.includes(s));

      if (hasKeyword && !hasStopWord) {
        logger.info(`🎯 Potential lead found in chat: ${chatEntity.title || chatEntity.username}`);
        handleLead(message, chatEntity);
      }
    }, new NewMessage({}));

  } catch (err) {
    logger.error("Fatal error during bot startup:", err);
    // Exponential backoff or restart logic could be added here
    setTimeout(startBot, 5000);
  }
}

/**
 * Processes a found lead
 */
async function handleLead(message, chatEntity) {
  try {
    const sender = await message.getSender();
    const username = sender?.username ? `@${sender.username}` : "Yashirin profil";
    const senderId = sender?.id;
    const chatTitle = chatEntity.title || chatEntity.username || "Unknown Chat";
    const messageText = message.message;
    
    // Construct message link (MTProto links are specific)
    let link = `https://t.me/c/${chatEntity.id}/${message.id}`;
    if (chatEntity.username) {
      link = `https://t.me/${chatEntity.username}/${message.id}`;
    }

    const leadData = {
      senderId: senderId?.toString(),
      username,
      text: messageText,
      chatTitle,
      link
    };

    // 1. Save to Database
    await saveLead(leadData);
    logger.info(`✅ Lead saved to DB from ${username}`);

    // 2. Notify Admin via BOT API
    const notificationText = `🎯 <b>Yangi mijoz topildi!</b>\n\n` +
      `📝 <b>Xabar:</b> ${messageText.substring(0, 500)}${messageText.length > 500 ? '...' : ''}\n\n` +
      `👤 <b>Kimdan:</b> ${username} (ID: ${senderId})\n` +
      `📍 <b>Guruh:</b> ${chatTitle}\n` +
      `🔗 <a href="${link}">Xabarga o'tish</a>`;

    const data = JSON.stringify({
      chat_id: adminId,
      text: notificationText,
      parse_mode: 'HTML',
      disable_web_page_preview: false
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${botToken}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        logger.error(`Bot API error: ${res.statusCode}`);
      }
    });

    req.on('error', (error) => {
      logger.error('Error sending message via Bot API:', error);
    });

    req.write(data);
    req.end();

  } catch (err) {
    logger.error("Error handling lead:", err);
  }
}

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startBot();
