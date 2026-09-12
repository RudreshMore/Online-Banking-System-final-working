import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config/env.js";
import { router } from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";

// Enable BigInt serialization to JSON
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

export const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // max requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Root Routes
app.use("/api", router);

// Centralized Error Handling
app.use(errorHandler);
