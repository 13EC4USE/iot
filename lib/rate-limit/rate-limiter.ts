import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Only enable rate limiting in production
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

export const ratelimit = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"), // 10 requests per minute
      analytics: true,
      prefix: "iot-api",
    })
  : null

export async function checkRateLimit(identifier: string): Promise<boolean> {
  if (!ratelimit) return true

  try {
    const { success } = await ratelimit.limit(identifier)
    return success
  } catch (error) {
    console.error("[v0] Rate limit check error:", error)
    return true // Allow on error
  }
}
