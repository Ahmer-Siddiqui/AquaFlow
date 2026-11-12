import { Response } from "express";

export interface PaginationMeta {
  page?: number;
  limit?: number;
  totalItems?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export class ApiResponse<T = unknown> {
  public readonly success: boolean = true;
  public readonly message: string;
  public readonly data?: T;
  public readonly meta?: PaginationMeta;

  constructor(message: string, data?: T, meta?: PaginationMeta) {
    this.message = message;
    this.data = data;
    this.meta = meta;
  }

  /**
   * Helper to send standard 200/201 response directly
   */
  static send<T>(
    res: Response,
    message: string,
    data?: T,
    statusCode: number = 200,
    meta?: PaginationMeta
  ): Response {
    return res.status(statusCode).json(new ApiResponse(message, data, meta));
  }

  /**
   * Shortcut for 201 Created
   */
  static created<T>(res: Response, message: string, data?: T): Response {
    return this.send(res, message, data, 201);
  }
}

