import { Response } from "express";
import { prisma } from "@/lib/db";
import { AuthRequest } from "@/middleware/auth.middleware";

// =========================================================
// GET ALL EMERGENCY CONTACTS
// =========================================================

export const getEmergencyContacts = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;

    const contacts =
      await prisma.emergencyContact.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    return res.status(200).json({
      success: true,
      contacts,
    });
  } catch (error) {
    console.error(
      "Get emergency contacts error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch emergency contacts.",
    });
  }
};

// =========================================================
// ADD EMERGENCY CONTACT
// =========================================================

export const createEmergencyContact = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;

    const {
      name,
      phone,
      relation,
    } = req.body;

    if (
      !name?.trim() ||
      !phone?.trim() ||
      !relation?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, phone and relationship are required.",
      });
    }

    const contact =
      await prisma.emergencyContact.create({
        data: {
          userId,
          name: name.trim(),
          phone: phone.trim(),
          relation: relation.trim(),
        },
      });

    return res.status(201).json({
      success: true,
      message:
        "Emergency contact added successfully.",
      contact,
    });
  } catch (error) {
    console.error(
      "Create emergency contact error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to create emergency contact.",
    });
  }
};

// =========================================================
// DELETE EMERGENCY CONTACT
// =========================================================

export const deleteEmergencyContact = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user!.id;
    const id = req.params.id as string;

    const contact =
      await prisma.emergencyContact.findFirst({
        where: {
          id,
          userId,
        },
      });

    if (!contact) {
      return res.status(404).json({
        success: false,
        message:
          "Emergency contact not found.",
      });
    }

    await prisma.emergencyContact.delete({
      where: {
        id: contact.id,
      },
    });

    return res.status(200).json({
      success: true,
      message:
        "Emergency contact deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete emergency contact error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete emergency contact.",
    });
  }
};