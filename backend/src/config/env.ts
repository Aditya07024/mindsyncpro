import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  PORT: z.string().default("8080"),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  MONGODB_URI: z.string(),
  CLERK_SECRET_KEY: z.string(),
  CLERK_PUBLISHABLE_KEY: z.string().optional(),
  CLIENT_ORIGIN: z.string().default("http://localhost:3000"),
  JWT_SECRET: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  HF_TOKEN: z.string().optional(),
  HF_MODEL: z.string().default("meta-llama/Llama-3.3-70B-Instruct"),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_PLAN_MANN_SHANTI: z.string().optional(),
  RAZORPAY_PLAN_APNA_THERAPIST: z.string().optional(),
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_TEMPLATE_ID: z.string().optional(),
  LIVEKIT_API_KEY: z.string().optional(),
  LIVEKIT_API_SECRET: z.string().optional(),
  LIVEKIT_URL: z.string().optional(),
});

export const env = envSchema.parse(process.env);
