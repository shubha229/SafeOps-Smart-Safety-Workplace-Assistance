import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { prisma } from "@/lib/db";
import { env } from "@/config/env";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

interface JwtPayload {
  id: string;
  email: string;
  role: string;
}

// =========================================================
// AUTHENTICATION
// =========================================================

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader =
      req.headers.authorization;

    // Check Authorization header
    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Access token is required.",
      });
    }

    // Extract token
    const token =
      authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access token is required.",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(
      token,
      env.JWT_SECRET
    ) as JwtPayload;

    // Find user
    const user =
      await prisma.user.findUnique({
        where: {
          id: decoded.id,
        },
      });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }

    // Attach authenticated user
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    };

    next();
  } catch (error) {
    console.error(
      "Authentication error:",
      error
    );

    return res.status(401).json({
      success: false,
      message:
        "Invalid or expired token.",
    });
  }
};

// =========================================================
// ADMIN AUTHORIZATION
// =========================================================

export const authorizeAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized.",
    });
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Admin only.",
    });
  }

  next();
};