export interface StorageFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

export interface UploadOptions {
  /**
   * Destination folder / path prefix (e.g. 'deliveries', 'receipts', 'products', 'avatars')
   */
  folder?: string;
  /**
   * Optional custom filename (without extension). If omitted, a unique UUID will be generated.
   */
  customName?: string;
  /**
   * Whether the file should be publicly accessible. Default: true.
   */
  isPublic?: boolean;
}

export interface UploadResult {
  /**
   * Fully qualified accessible URL of the file (e.g., https://... or /uploads/...)
   */
  url: string;
  /**
   * Unique storage identifier / path used to reference and delete the file
   */
  fileKey: string;
  size: number;
  mimetype: string;
  originalname: string;
}

export interface IStorageProvider {
  /**
   * Upload a file buffer to storage
   */
  upload(file: StorageFile, options?: UploadOptions): Promise<UploadResult>;

  /**
   * Delete a file from storage by its unique fileKey
   */
  delete(fileKey: string): Promise<boolean>;

  /**
   * Retrieve the accessible public URL for a fileKey
   */
  getUrl(fileKey: string): string;
}

