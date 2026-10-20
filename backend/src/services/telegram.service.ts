
const TELEGRAM_API = "https://api.telegram.org";

type TelegramResponse = {
  ok: boolean;
  description?: string;
};

async function telegramRequest(
  method: string,
  body: Record<string, string | number>
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is missing.");
  }

  const response = await fetch(
    `${TELEGRAM_API}/bot${token}/${method}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = (await response.json()) as TelegramResponse;

  if (!response.ok || !data.ok) {
    throw new Error(
      `${method} failed: ${data.description || `HTTP ${response.status}`}`
    );
  }

  return data;
}

export async function sendTelegramSOS(
  latitude: number,
  longitude: number,
  userName: string
) {
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!chatId) {
    throw new Error("TELEGRAM_CHAT_ID is missing.");
  }

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error("Invalid GPS coordinates.");
  }

  const mapsUrl =
    `https://www.google.com/maps?q=${latitude},${longitude}`;

  // Send the text alert first.
  await telegramRequest("sendMessage", {
    chat_id: chatId,
    text:
      `🚨 SAFEOPS SOS ALERT\n\n` +
      `${userName} may need emergency assistance.\n` +
      `Location: ${mapsUrl}\n\n` +
      `Please contact them and check their safety.`,
  });

  // Send the actual Telegram location pin.
  await telegramRequest("sendLocation", {
    chat_id: chatId,
    latitude,
    longitude,
  });

  return { success: true };
}
