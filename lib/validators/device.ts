import { z } from "zod"

export const deviceSchema = z.object({
  name: z.string().min(1, "ชื่ออุปกรณ์ต้องระบุ"),
  type: z.string().min(1, "ประเภทอุปกรณ์ต้องระบุ"),
  location: z.string().optional(),
  mac_address: z.string().optional(),
  mqtt_topic: z.string().optional(),
})

export type DeviceInput = z.infer<typeof deviceSchema>

export const sensorDataSchema = z.object({
  value: z.number(),
  unit: z.string().optional(),
  temperature: z.number().optional(),
  humidity: z.number().optional(),
})

export type SensorDataInput = z.infer<typeof sensorDataSchema>
