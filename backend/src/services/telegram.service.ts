const TELEGRAM_API = "https://api.telegram.org";

type TelegramResponse = {
  ok: boolean;
  description?: string;
};

async function telegramRequest(
  method: string,
  body: Record<string, string | number>
): Promise<TelegramResponse> {
  const token = process.env.TELEGRAM_BOT_TOKEN;

  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is missing.");
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 15000);

  try {
    console.log(`Sending Telegram request: ${method}`);

    let response: Response;

    try {
      response = await fetch(
        `${TELEGRAM_API}/bot${token}/${method}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        }
      );
    } catch (error) {
      console.error("Telegram network connection failed:", error);

      if (error instanceof Error) {
        console.error("Network error name:", error.name);
        console.error("Network error message:", error.message);
        console.error("Network error cause:", error.cause);

        const cause = error.cause;

        if (cause instanceof AggregateError) {
          console.error(
            "Individual network errors:",
            cause.errors
          );
        }
      }

      throw error;
    }

    const responseText = await response.text();

    let data: TelegramResponse;

    try {
      data = JSON.parse(responseText) as TelegramResponse;
    } catch {
      throw new Error(
        `Telegram ${method} returned an invalid response (HTTP ${response.status}).`
      );
    }

    if (!response.ok || !data.ok) {
      throw new Error(
        `Telegram ${method} failed: ${
          data.description || `HTTP ${response.status}`
        }`
      );
    }

    console.log(`Telegram ${method} succeeded.`);

    return data;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(
        `Telegram ${method} timed out after 15 seconds.`
      );
    }

    console.error(`Telegram ${method} request failed:`, {
      message: error instanceof Error ? error.message : String(error),
      cause:
        error instanceof Error && error.cause
          ? String(error.cause)
          : "No underlying cause provided",
    });

    throw error;
  } finally {
    clearTimeout(timeout);
  }
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

  // Send the SOS text alert.
  await telegramRequest("sendMessage", {
    chat_id: chatId,
    text:
      `🚨 SAFEOPS SOS ALERT\n\n` +
      `${userName} may need emergency assistance.\n` +
      `Location: ${mapsUrl}\n\n` +
      `Please contact them and check their safety.`,
  });

  console.log("Telegram SOS text alert delivered.");

  // Send the actual Telegram location pin.
  await telegramRequest("sendLocation", {
    chat_id: chatId,
    latitude,
    longitude,
  });

  console.log("Telegram SOS location pin delivered.");

  return {
    success: true,
    message: "SOS alert and location pin sent successfully.",
  };
}