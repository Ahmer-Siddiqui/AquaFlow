import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import {
  IStorageProvider,
  StorageFile,
  UploadOptions,
  UploadResult,
} from "../interfaces/IStorageProvider.js";

export interface LocalStorageConfig {
  /**
   * Root directory where uploaded files are stored locally.
   * Default: <projectRoot>/uploads
   */
  uploadDir?: string;
  /**
   * Base URL for serving uploaded static files.
   * Default: http://localhost:5000/uploads
   */
  baseUrl?: string;
}

export class LocalStorageToolkit implements IStorageProvider {
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(config: LocalStorageConfig = {}) {
    this.uploadDir = config.uploadDir || path.resolve(process.cwd(), "uploads");
    const port = process.env.PORT || "5000";
    this.baseUrl = config.baseUrl || process.env.APP_URL || `http://localhost:${port}/uploads`;
  }

  /**
   * Saves a file buffer to the local disk.
   */
  async upload(file: StorageFile, options: UploadOptions = {}): Promise<UploadResult> {
    try {
      const folder = options.folder ? options.folder.replace(/^[\\/]+|[\\/]+$/g, "") : "general";
      const targetDir = path.join(this.uploadDir, folder);

      // Ensure directory exists
      await fs.mkdir(targetDir, { recursive: true });

      // Generate a clean, collisions-proof filename
      const ext = path.extname(file.originalname) || this.getExtensionFromMime(file.mimetype);
      const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
      const safeBasename = options.customName
        ? options.customName.replace(/[^a-zA-Z0-9_-]/g, "_")
        : path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");

      const finalFilename = `${safeBasename}-${uniqueSuffix}${ext}`;
      const destinationPath = path.join(targetDir, finalFilename);

      // Write file buffer to disk
      await fs.writeFile(destinationPath, file.buffer);

      const fileKey = `${folder}/${finalFilename}`.replace(/\\/g, "/");
      const url = `${this.baseUrl.replace(/\/+$/, "")}/${fileKey}`;

      return {
        url,
        fileKey,
        size: file.size,
        mimetype: file.mimetype,
        originalname: file.originalname,
      };
    } catch (error: any) {
      console.error("[LocalStorageToolkit Error]: Failed to upload file", error);
      throw new Error(`Local file upload failed: ${error?.message || "Unknown error"}`);
    }
  }

  /**
   * Deletes a file from the local disk by its fileKey.
   */
  async delete(fileKey: string): Promise<boolean> {
    try {
      const normalizedKey = fileKey.replace(/^[\\/]+/, "");
      const fullPath = path.join(this.uploadDir, normalizedKey);

      // Prevent directory traversal attacks
      if (!fullPath.startsWith(this.uploadDir)) {
        throw new Error("Invalid file path: Directory traversal detected.");
      }

      await fs.unlink(fullPath);
      return true;
    } catch (error: any) {
      if (error?.code === "ENOENT") {
        // File already doesn't exist
        return true;
      }
      console.error(`[LocalStorageToolkit Error]: Failed to delete file ${fileKey}`, error);
      return false;
    }
  }

  /**
   * Returns the public URL for a given fileKey.
   */
  getUrl(fileKey: string): string {
    const normalizedKey = fileKey.replace(/^[\\/]+/, "");
    return `${this.baseUrl.replace(/\/+$/, "")}/${normalizedKey}`;
  }

  private getExtensionFromMime(mimetype: string): string {
    const mimeMap: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "application/pdf": ".pdf",
    };
    return mimeMap[mimetype] || "";
  }
}

