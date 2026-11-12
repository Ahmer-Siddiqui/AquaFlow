import multer, { FileFilterCallback } from "multer";
import { Request } from "express";
import { AppError } from "../utils/AppError.js";

// Keep files in RAM as Buffers for direct passing to StorageToolkits
const storage = multer.memoryStorage();

// Allowed MIME types whitelist
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_DOCUMENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

/**
 * Filter for image-only uploads (Avatars, Product Images, Logos, Delivery Proofs)
 */
const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid file type '${file.mimetype}'. Only JPEG, PNG, and WEBP images are allowed.`,
        400,
        "INVALID_FILE_TYPE"
      )
    );
  }
};

/**
 * Filter for general document uploads (Receipts, Expense Slips, PDF Invoices)
 */
const documentFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (ALLOWED_DOCUMENT_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new AppError(
        `Invalid file type '${file.mimetype}'. Only PDF and image files (JPEG, PNG, WEBP) are allowed.`,
        400,
        "INVALID_FILE_TYPE"
      )
    );
  }
};

/**
 * Upload single image (Max 5MB)
 * Usage: router.post("/avatar", uploadSingleImage("avatar"), controller.updateAvatar);
 */
export const uploadSingleImage = (fieldName: string = "image") => {
  return multer({
    storage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB limit
      files: 1,
    },
    fileFilter: imageFileFilter,
  }).single(fieldName);
};

/**
 * Upload multiple images (e.g., up to 5 delivery proof photos)
 * Usage: router.post("/proof", uploadMultipleImages("photos", 5), controller.uploadDeliveryProof);
 */
export const uploadMultipleImages = (fieldName: string = "photos", maxCount: number = 5) => {
  return multer({
    storage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB per file
      files: maxCount,
    },
    fileFilter: imageFileFilter,
  }).array(fieldName, maxCount);
};

/**
 * Upload document/receipt (Max 10MB, supports PDF & Images)
 * Usage: router.post("/expenses", uploadDocument("receipt"), controller.recordExpense);
 */
export const uploadDocument = (fieldName: string = "document") => {
  return multer({
    storage,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10 MB limit
      files: 1,
    },
    fileFilter: documentFileFilter,
  }).single(fieldName);
};

