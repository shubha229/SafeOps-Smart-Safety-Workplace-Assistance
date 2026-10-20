
import { Router } from "express";
import { authenticate, AuthRequest } from "@/middleware/auth.middleware";
import { sendTelegramSOS } from "@/services/telegram.service";

const router = Router();

router.post(
  "/sos-location",
  authenticate,
  async (req: AuthRequest, res) => {
    try {
      const { latitude, longitude } = req.body;

      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number" ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        latitude < -90 ||
        latitude > 90 ||
        longitude < -180 ||
        longitude > 180
      ) {
        return res.status(400).json({
          success: false,
          message: "Valid GPS coordinates are required.",
        });
      }

      const userName = req.user?.name || "A SafeOps user";

      await sendTelegramSOS(
        latitude,
        longitude,
        userName
      );

      return res.status(200).json({
        success: true,
        message: "Telegram SOS location sent.",
      });
    } catch (error: any) {
      console.error("Telegram SOS error:", error.message);

      return res.status(502).json({
        success: false,
        message: "Unable to send Telegram SOS alert.",
      });
    }
  }
);

export default router;
