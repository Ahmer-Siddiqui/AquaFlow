import crypto from "crypto";
import {
  IStorageProvider,
  StorageFile,
  UploadOptions,
  UploadResult,
} from "../interfaces/IStorageProvider.js";

export interface CloudinaryConfig {
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
}

export class CloudinaryStorageToolkit implements IStorageProvider {
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(config: CloudinaryConfig = {}) {
    this.cloudName = config.cloudName || process.env.CLOUDINARY_CLOUD_NAME || "";
    this.apiKey = config.apiKey || process.env.CLOUDINARY_API_KEY || "";
    this.apiSecret = config.apiSecret || process.env.CLOUDINARY_API_SECRET || "";
  }

  /**
   * Uploads an image or file buffer to Cloudinary using direct signed REST upload.
   */
  async upload(file: StorageFile, options: UploadOptions = {}): Promise<UploadResult> {
    const folder = options.folder || "aquaflow";
    const timestamp = Math.round(new Date().getTime() / 1000);
    const publicId = `${folder}/${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

    // If Cloudinary API credentials exist, perform real cloud upload
    if (this.cloudName && this.apiKey && this.apiSecret) {
      try {
        const signatureString = `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${this.apiSecret}`;
        const signature = crypto.createHash("sha1").update(signatureString).digest("hex");

        const formData = new FormData();
        formData.append("file", new Blob([file.buffer], { type: file.mimetype }), file.originalname);
        formData.append("api_key", this.apiKey);
        formData.append("timestamp", timestamp.toString());
        formData.append("folder", folder);
        formData.append("public_id", publicId);
        formData.append("signature", signature);

        const uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`;
        const res = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Cloudinary upload failed (${res.status}): ${errText}`);
        }

        const data = (await res.json()) as any;
        return {
          url: data.secure_url || data.url,
          fileKey: data.public_id,
          size: file.size,
          mimetype: file.mimetype,
          originalname: file.originalname,
        };
      } catch (err: any) {
        console.error("[CloudinaryStorageToolkit Error]:", err);
        throw err;
      }
    } else {
      console.log(`\x1b[33m[CloudinaryStorageToolkit]\x1b[0m ☁️ Sandbox Upload: ${publicId} (${file.size} bytes)`);
    }

    const fallbackUrl = this.getUrl(publicId);

    return {
      url: fallbackUrl,
      fileKey: publicId,
      size: file.size,
      mimetype: file.mimetype,
      originalname: file.originalname,
    };
  }

  /**
   * Deletes a resource from Cloudinary by its publicId.
   */
  async delete(fileKey: string): Promise<boolean> {
    if (!this.cloudName || !this.apiKey || !this.apiSecret) {
      console.log(`\x1b[33m[CloudinaryStorageToolkit]\x1b[0m 🗑️ Sandbox Delete: ${fileKey}`);
      return true;
    }

    try {
      const timestamp = Math.round(new Date().getTime() / 1000);
      const signatureString = `public_id=${fileKey}&timestamp=${timestamp}${this.apiSecret}`;
      const signature = crypto.createHash("sha1").update(signatureString).digest("hex");

      const formData = new FormData();
      formData.append("public_id", fileKey);
      formData.append("api_key", this.apiKey);
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);

      const deleteUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`;
      const res = await fetch(deleteUrl, { method: "POST", body: formData });
      return res.ok;
    } catch (err) {
      console.error(`[CloudinaryStorageToolkit Error]: Failed to delete ${fileKey}`, err);
      return false;
    }
  }

  /**
   * Constructs the public Cloudinary delivery URL for a given public_id.
   */
  getUrl(fileKey: string): string {
    const cloud = this.cloudName || "demo";
    return `https://res.cloudinary.com/${cloud}/image/upload/${fileKey}`;
  }
}
