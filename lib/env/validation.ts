import { z } from "zod"

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Missing Supabase anon key"),
  NEXT_PUBLIC_MQTT_BROKER: z.string().min(1, "Missing MQTT broker URL"),
  NEXT_PUBLIC_MQTT_USERNAME: z.string().optional(),
  NEXT_PUBLIC_MQTT_PASSWORD: z.string().optional(),
  // Service role key is server-only; make optional here to avoid client-side build failures
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
})

export function validateEnv() {
  try {
    const env = envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_MQTT_BROKER: process.env.NEXT_PUBLIC_MQTT_BROKER,
      NEXT_PUBLIC_MQTT_USERNAME: process.env.NEXT_PUBLIC_MQTT_USERNAME,
      NEXT_PUBLIC_MQTT_PASSWORD: process.env.NEXT_PUBLIC_MQTT_PASSWORD,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    })
    console.log("[v0] Environment validation passed")
    return env
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => e.path.join(".")).join(", ")
      throw new Error(`Missing or invalid environment variables: ${missingVars}`)
    }
    throw error
  }
}
