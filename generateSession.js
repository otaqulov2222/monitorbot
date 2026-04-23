const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const input = require("input");
require('dotenv').config();

const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;
const stringSession = new StringSession(""); // Empty for new session

(async () => {
  console.log("Starting session generation...");
  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });
  
  await client.start({
    phoneNumber: async () => await input.text("Please enter your number: "),
    password: async () => await input.text("Please enter your password: "),
    phoneCode: async () => await input.text("Please enter the code you received: "),
    onError: (err) => console.log(err),
  });

  console.log("\n✅ You are now logged in.");
  console.log("👇 Copy this STRING_SESSION and paste it into your .env file:");
  console.log("\n" + client.session.save() + "\n");
  
  await client.disconnect();
  process.exit(0);
})();
