
require("dotenv").config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

async function sendTestMessage() {
  if (!token || !chatId) {
    throw new Error(
      "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing from .env"
    );
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text:
          "🚨 SafeOps Telegram Test\n\n" +
          "Your Telegram bot is connected successfully. " +
          "Emergency alerts can now be integrated with SafeOps."
      })
    }
  );

  const result = await response.json();

  if (!result.ok) {
    throw new Error(result.description || "Telegram message failed");
  }

  console.log("Test message sent successfully!");
}

sendTestMessage().catch((error) => {
  console.error("Telegram test failed:", error.message);
});
