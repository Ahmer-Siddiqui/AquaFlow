import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import path from "path";
import { env } from "./config/env.js";
import { AppError } from "./utils/AppError.js";
import { ApiResponse } from "./utils/ApiResponse.js";
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// 1. Security HTTP Headers
app.use(helmet());

// 2. CORS Allowed Origins
const allowedOrigins = env.CORS_ORIGIN.split(",").map((origin) => origin.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Postman)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        callback(new AppError(`Origin ${origin} not allowed by CORS policy`, 403, "CORS_ERROR"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-Tenant-Id"],
  })
);

// 3. Request Logging in Development
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// 4. Body & Cookie Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// 5. Static Files Hosting (Local uploads)
const uploadsPath = path.resolve(process.cwd(), "uploads");
app.use("/uploads", express.static(uploadsPath));

// 6. Base Health Check Route
app.get("/api/v1/health", (_req: Request, res: Response) => {
  ApiResponse.send(res, "AquaFlow SaaS API is healthy and operational", {
    status: "healthy",
    version: "1.0.0",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
});

// 7. Unhandled Routes 404 Handler
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404, "ROUTE_NOT_FOUND"));
});

// 8. Central Global Error Handling Middleware
app.use(errorHandler);

export default app;

