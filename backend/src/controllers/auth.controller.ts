
import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

import {
  hashPassword,
  comparePassword,
  validatePassword,
} from "@/utils/password";

import { generateToken } from "@/utils/jwt";

/**
 * Register User
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, Email and Password are required.",
      });
    }

    // Check for an existing email
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email already exists. Please sign in instead.",
      });
    }

    // Check for an existing phone number when supplied
    if (phone) {
      const existingPhone = await prisma.user.findUnique({
        where: { phone },
      });

      if (existingPhone) {
        return res.status(409).json({
          success: false,
          message:
            "This phone number is already registered. Please sign in or use another number.",
        });
      }
    }

    // Validate password
    const passwordValidation = validatePassword(password);

    if (!passwordValidation.valid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
      },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    // Handle unique constraint conflicts, including concurrent requests
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = error.meta?.target;
      const fields = Array.isArray(target)
        ? target.map(String)
        : [String(target ?? "")];

      if (fields.includes("phone")) {
        return res.status(409).json({
          success: false,
          message:
            "This phone number is already registered. Please sign in or use another number.",
        });
      }

      if (fields.includes("email")) {
        return res.status(409).json({
          success: false,
          message: "Email already exists. Please sign in instead.",
        });
      }

      return res.status(409).json({
        success: false,
        message: "An account with these details already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/**
 * Login User
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials.",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
        loginCount: {
          increment: 1,
        },
      },
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

/**
 * Get Logged-in User
 */
export const getProfile = async (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "Profile API working.",
  });
};

/**
 * Logout
 */
export const logout = async (_req: Request, res: Response) => {
  return res.status(200).json({
    success: true,
    message: "Logout successful.",
  });
};
