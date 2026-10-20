
const TELEGRAM_API = "https://api.telegram.org";

export async function sendTelegramSOS(
  latitude: number,
  longitude: number,
  userName: string
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error(
      "Telegram bot token or chat ID is missing."
    );
  }

  const mapsUrl =
    `https://www.google.com/maps?q=${latitude},${longitude}`;

  const alertResponse = await fetch(
    `${TELEGRAM_API}/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text:
          `🚨 SAFEOPS SOS ALERT\n\n` +
          `${userName} may need emergency assistance.\n` +
          `Location: ${mapsUrl}\n\n` +
          `Please contact them and check their safety.`,
      }),
    }
  );

  const alertData = await alertResponse.json() as {
    ok: boolean;
    description?: string;
  };

  if (!alertResponse.ok || !alertData.ok) {
    throw new Error(
      alertData.description || "Telegram alert failed."
    );
  }

  const locationResponse = await fetch(
    `${TELEGRAM_API}/bot${token}/sendLocation`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        latitude,
        longitude,
      }),
    }
  );

  const locationData = await locationResponse.json() as {
    ok: boolean;
    description?: string;
  };

  if (!locationResponse.ok || !locationData.ok) {
    throw new Error(
      locationData.description || "Telegram location failed."
    );
  }

  return { success: true };
}
