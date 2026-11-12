import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import multer from "multer";
import { AppError } from "../utils/AppError.js";
import { env } from "../config/env.js";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // 1. Handled Operational Application Errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.errorCode,
        message: err.message,
        details: err.details || [],
      },
    });
    return;
  }

  // 2. Zod Validation Errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join("."),
      issue: e.message,
    }));

    res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid input payload",
        details,
      },
    });
    return;
  }

  // 3. Multer Upload Errors
  if (err instanceof multer.MulterError) {
    let message = err.message;
    let code = "FILE_UPLOAD_ERROR";

    if (err.code === "LIMIT_FILE_SIZE") {
      message = "Uploaded file exceeds maximum allowed size limit";
      code = "FILE_TOO_LARGE";
    } else if (err.code === "LIMIT_FILE_COUNT") {
      message = "Too many files uploaded";
      code = "TOO_MANY_FILES";
    }

    res.status(400).json({
      success: false,
      error: {
        code,
        message,
        details: [{ field: err.field, issue: message }],
      },
    });
    return;
  }

  // 4. PostgreSQL / TypeORM Driver Errors
  if (err.code === "23505") {
    // Unique violation
    res.status(409).json({
      success: false,
      error: {
        code: "DUPLICATE_RESOURCE",
        message: "A record with this unique identifier already exists.",
        details: err.detail ? [{ issue: err.detail }] : [],
      },
    });
    return;
  }

  if (err.code === "23503") {
    // Foreign key violation
    res.status(400).json({
      success: false,
      error: {
        code: "FOREIGN_KEY_VIOLATION",
        message: "Referenced related entity does not exist.",
        details: err.detail ? [{ issue: err.detail }] : [],
      },
    });
    return;
  }

  // 5. Unhandled Internal Server Errors
  console.error("💥 [Unhandled Server Error]:", err);

  const isProduction = env.NODE_ENV === "production";
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: isProduction ? "An unexpected internal server error occurred." : err?.message || "Unknown error",
      details: isProduction ? [] : [{ issue: err?.stack || "" }],
    },
  });
};

