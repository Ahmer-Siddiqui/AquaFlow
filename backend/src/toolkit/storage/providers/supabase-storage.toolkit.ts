import crypto from "crypto";
import path from "path";
import {
  IStorageProvider,
  StorageFile,
  UploadOptions,
  UploadResult,
} from "../interfaces/IStorageProvider.js";

export interface SupabaseStorageConfig {
  projectUrl?: string;
  serviceRoleKey?: string;
  defaultBucket?: string;
}

export class SupabaseStorageToolkit implements IStorageProvider {
  private readonly projectUrl: string;
  private readonly apiKey: string;
  private readonly defaultBucket: string;

  constructor(config: SupabaseStorageConfig = {}) {
    this.projectUrl = config.projectUrl || process.env.SUPABASE_URL || "https://hsbdcjqauzmsftdcybxp.supabase.co";
    this.apiKey = config.serviceRoleKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "";
    this.defaultBucket = config.defaultBucket || process.env.SUPABASE_STORAGE_BUCKET || "aquaflow-assets";
  }

  /**
   * Uploads a file buffer directly to Supabase Storage via REST API.
   */
  async upload(file: StorageFile, options: UploadOptions = {}): Promise<UploadResult> {
    const folder = options.folder ? options.folder.replace(/^[\\/]+|[\\/]+$/g, "") : "general";
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;
    const safeBasename = options.customName
      ? options.customName.replace(/[^a-zA-Z0-9_-]/g, "_")
      : path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");

    const finalFilename = `${safeBasename}-${uniqueSuffix}${ext}`;
    const fileKey = `${folder}/${finalFilename}`;

    // If Supabase API key is configured, perform live upload
    if (this.apiKey) {
      try {
        const uploadUrl = `${this.projectUrl.replace(/\/+$/, "")}/storage/v1/object/${this.defaultBucket}/${fileKey}`;
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": file.mimetype,
            "x-upsert": "true",
          },
          body: file.buffer,
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Supabase Storage upload returned status ${response.status}: ${errText}`);
        }
      } catch (err: any) {
        console.error("[SupabaseStorageToolkit Error]:", err);
        throw err;
      }
    } else {
      console.log(`\x1b[34m[SupabaseStorageToolkit]\x1b[0m ☁️ Sandbox Upload: ${fileKey} (${file.size} bytes)`);
    }

    const publicUrl = this.getUrl(fileKey);

    return {
      url: publicUrl,
      fileKey,
      size: file.size,
      mimetype: file.mimetype,
      originalname: file.originalname,
    };
  }

  /**
   * Deletes a file from Supabase Storage by its fileKey.
   */
  async delete(fileKey: string): Promise<boolean> {
    if (!this.apiKey) {
      console.log(`\x1b[34m[SupabaseStorageToolkit]\x1b[0m 🗑️ Sandbox Delete: ${fileKey}`);
      return true;
    }

    try {
      const deleteUrl = `${this.projectUrl.replace(/\/+$/, "")}/storage/v1/object/${this.defaultBucket}/${fileKey}`;
      const response = await fetch(deleteUrl, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      return response.ok;
    } catch (err) {
      console.error(`[SupabaseStorageToolkit Error]: Failed to delete ${fileKey}`, err);
      return false;
    }
  }

  /**
   * Constructs the public accessible URL for a given fileKey in Supabase Storage.
   */
  getUrl(fileKey: string): string {
    const normalizedKey = fileKey.replace(/^[\\/]+/, "");
    return `${this.projectUrl.replace(/\/+$/, "")}/storage/v1/object/public/${this.defaultBucket}/${normalizedKey}`;
  }
}

