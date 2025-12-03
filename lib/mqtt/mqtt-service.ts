import { publishMessage, subscribeTopic } from "./client"

export class MqttService {
  static subscribeToDevice(deviceId: string, callback: (data: any) => void) {
    const topic = `devices/${deviceId}/data`
    subscribeTopic(topic, (message) => {
      try {
        const data = JSON.parse(message)
        callback(data)
      } catch (error) {
        console.error("Failed to parse MQTT message:", error)
      }
    })
  }

  static sendDeviceCommand(deviceId: string, action: string, payload: any) {
    const topic = `devices/${deviceId}/control/${action}`
    publishMessage(topic, JSON.stringify(payload))
  }

  static sendPowerCommand(deviceId: string, power: boolean) {
    this.sendDeviceCommand(deviceId, "power", { power })
  }

  static sendThresholdCommand(deviceId: string, min: number, max: number) {
    this.sendDeviceCommand(deviceId, "threshold", { min, max })
  }

  static subscribeToAlerts(deviceId: string, callback: (alert: any) => void) {
    const topic = `devices/${deviceId}/alerts`
    subscribeTopic(topic, (message) => {
      try {
        const alert = JSON.parse(message)
        callback(alert)
      } catch (error) {
        console.error("Failed to parse alert:", error)
      }
    })
  }
}
