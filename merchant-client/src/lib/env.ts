import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_API_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_API_URL is required")
    .default("http://localhost:3001/api/v1"),
  NEXT_PUBLIC_WS_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_WS_URL is required")
    .default("http://localhost:3001"),
  NEXT_PUBLIC_CONSUMER_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_CONSUMER_URL is required")
    .default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_URL is required"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
});

function getEnv() {
  const result = envSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_CONSUMER_URL: process.env.NEXT_PUBLIC_CONSUMER_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  if (!result.success) {
    console.error(
      "❌ Invalid merchant-client environment variables:",
      result.error.flatten().fieldErrors,
    );
    throw new Error(
      "Missing or invalid environment variables. Check .env.local",
    );
  }

  return result.data;
}

export const env = getEnv();
