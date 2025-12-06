import { z } from "zod"

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
})

export const signUpSchema = z
  .object({
    email: z.string().email("อีเมลไม่ถูกต้อง"),
    password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
    confirmPassword: z.string(),
    fullName: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["confirmPassword"],
  })

export const passwordResetSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
})

// Device schemas
export const deviceSchema = z.object({
  name: z.string().min(1, "ชื่ออุปกรณ์จำเป็น").max(100, "ชื่ออุปกรณ์ต้องไม่เกิน 100 ตัวอักษร"),
  type: z.enum(["temperature", "humidity", "motion", "light", "switch", "other"]),
  location: z.string().max(100, "สถานที่ต้องไม่เกิน 100 ตัวอักษร").optional(),
  mac_address: z
    .string()
    .regex(/^([0-9A-Fa-f]{2}:){5}([0-9A-Fa-f]{2})$/, "รูปแบบ MAC Address ไม่ถูกต้อง")
    .optional(),
  mqtt_topic: z.string().optional(),
  is_active: z.boolean().default(true),
})

export const deviceSettingsSchema = z.object({
  min_threshold: z.number().optional(),
  max_threshold: z.number().optional(),
  alert_enabled: z.boolean().default(true),
  update_interval: z.number().min(10, "Interval ต้องมากกว่า 10 วินาที").max(3600, "Interval ต้องไม่เกิน 1 ชั่วโมง"),
})

export const deviceControlSchema = z.object({
  action: z.enum(["power_on", "power_off", "restart", "update_settings"]),
  device_id: z.string().uuid("Device ID ไม่ถูกต้อง"),
  settings: deviceSettingsSchema.optional(),
})

// User schemas
export const userUpdateSchema = z.object({
  full_name: z.string().min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร").optional(),
  role: z.enum(["admin", "user"]).optional(),
})

// Alert schemas
export const alertSchema = z.object({
  device_id: z.string().uuid("Device ID ไม่ถูกต้อง"),
  type: z.enum(["threshold_exceeded", "device_offline", "battery_low", "error"]),
  severity: z.enum(["info", "warning", "critical"]),
  message: z.string().min(1, "ข้อความแจ้งเตือนจำเป็น").max(500),
})

// Type exports
export type LoginInput = z.infer<typeof loginSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type PasswordResetInput = z.infer<typeof passwordResetSchema>
export type DeviceInput = z.infer<typeof deviceSchema>
export type DeviceSettingsInput = z.infer<typeof deviceSettingsSchema>
export type DeviceControlInput = z.infer<typeof deviceControlSchema>
export type UserUpdateInput = z.infer<typeof userUpdateSchema>
export type AlertInput = z.infer<typeof alertSchema>
