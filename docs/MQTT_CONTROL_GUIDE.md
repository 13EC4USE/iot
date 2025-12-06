# MQTT Control Implementation Guide 🎮

## Overview

This implementation provides **interactive device control** via MQTT with optimistic UI updates, debouncing, and proper error handling.

---

## 🎯 Features Implemented

### 1. **Interactive Widget Controls**
- ✅ **Switch Widget**: Toggle on/off with optimistic update
- ✅ **Slider Widget**: Adjust values with debouncing (200ms)
- ✅ **Loading States**: Visual feedback during MQTT operations
- ✅ **Auto-sync**: Widget state syncs with device data updates

### 2. **MQTT Communication**
- ✅ **Client-side Connection**: WebSocket MQTT via `mqtt` library
- ✅ **Server-side Publishing**: API endpoint for secure message publishing
- ✅ **Connection Status**: Real-time monitoring with callbacks
- ✅ **Auto-reconnect**: Built-in reconnection logic

### 3. **UX Optimizations**
- ✅ **Optimistic Updates**: UI changes immediately on user action
- ✅ **Debouncing**: Slider sends message only after 200ms idle or on release
- ✅ **Error Handling**: Toast notifications for connection errors
- ✅ **Loading Indicators**: Spinner animation during operations

---

## 📁 Files Created/Modified

### New Files:
1. **`lib/hooks/useMqttControl.ts`** - MQTT control hook
2. **`app/api/mqtt/publish/route.ts`** - Secure MQTT publish API

### Modified Files:
1. **`components/admin/widgets/custom-device-widget.tsx`** - Interactive widgets
2. **`lib/mqtt/client.ts`** - Connection status tracking

---

## 🔌 MQTT Message Protocol

### Switch Control
```json
{
  "id": "device-uuid",
  "status": "on",  // or "off"
  "timestamp": "2025-12-07T10:30:00.000Z"
}
```

**Topic:** `iot/switch/test01` (from `device.mqtt_topic`)

### Slider/Dimmer Control
```json
{
  "id": "device-uuid",
  "value": 75,  // number between min-max
  "timestamp": "2025-12-07T10:30:00.000Z"
}
```

**Topic:** `iot/dimmer/test02` (from `device.mqtt_topic`)

### Custom Command
```json
{
  "id": "device-uuid",
  "command": "reset",
  "data": { ... },
  "timestamp": "2025-12-07T10:30:00.000Z"
}
```

**Topic:** `iot/device/test03/command`

---

## 🚀 Usage

### Basic Widget Control

```tsx
import { CustomDeviceWidget } from "@/components/admin/widgets/custom-device-widget"

function DeviceGrid({ devices }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {devices.map(device => (
        <CustomDeviceWidget
          key={device.id}
          device={device}
          onCustomize={() => openCustomizationDialog(device)}
          onControl={(action) => console.log("Device action:", action)}
        />
      ))}
    </div>
  )
}
```

### Using MQTT Control Hook Directly

```tsx
import { useMqttControl } from "@/lib/hooks/useMqttControl"

function MyComponent() {
  const { toggleSwitch, setSliderValue, mqttConnected } = useMqttControl()

  const handleToggle = async () => {
    const success = await toggleSwitch(device, "on")
    if (success) {
      console.log("Toggle successful")
    }
  }

  return (
    <div>
      {!mqttConnected && <p>MQTT Disconnected</p>}
      <button onClick={handleToggle}>Toggle Device</button>
    </div>
  )
}
```

---

## ⚙️ Configuration

### Environment Variables

```env
# MQTT Broker (WebSocket URL)
NEXT_PUBLIC_MQTT_BROKER=wss://broker.hivemq.com:8884/mqtt

# Client ID Prefix
NEXT_PUBLIC_MQTT_CLIENT_ID_PREFIX=iot-client-

# Optional: MQTT Credentials
NEXT_PUBLIC_MQTT_USERNAME=your-username
NEXT_PUBLIC_MQTT_PASSWORD=your-password
```

### Device MQTT Topic

In your database, each device should have an `mqtt_topic` field:

```sql
UPDATE devices 
SET mqtt_topic = 'iot/switch/bedroom-light'
WHERE id = 'device-uuid';
```

**Topic Format:** `iot/{device_type}/{device_name_or_id}`

---

## 🎨 Widget Behavior

### Switch Widget

**User Action:**
1. Click toggle button
2. UI updates immediately (optimistic)
3. Spinner shows during MQTT publish
4. Reverts if publish fails

**MQTT Message:**
```json
Topic: iot/switch/bedroom-light
Payload: {"id": "...", "status": "on", "timestamp": "..."}
```

### Slider Widget

**User Action:**
1. Drag slider → UI updates immediately
2. **While dragging:** Debounced publish (200ms delay)
3. **On mouse release:** Immediate publish
4. No revert on failure (for smooth UX)

**MQTT Message:**
```json
Topic: iot/dimmer/living-room
Payload: {"id": "...", "value": 75, "timestamp": "..."}
```

**Debounce Behavior:**
- Moving from 10 → 20 → 30 → 40 in 100ms → Sends only once after 200ms idle
- Releasing at 50 → Sends immediately

---

## 🔐 Security

### API Authorization

The `/api/mqtt/publish` endpoint:
1. ✅ Verifies user authentication
2. ✅ Validates device ownership
3. ✅ Checks topic format
4. ✅ Logs all control actions

**Unauthorized Access:**
```json
{
  "error": "Device not found or unauthorized",
  "status": 403
}
```

### MQTT Credentials

- Client-side: Uses public credentials (if any)
- Server-side: Can use separate credentials
- Recommendation: Use MQTT ACLs to restrict topics per device

---

## 🐛 Error Handling

### Connection Lost

**Scenario:** MQTT broker disconnects

**Behavior:**
1. `mqttConnected` state → `false`
2. Widget actions show toast: "Cannot send command: MQTT Disconnected"
3. Auto-reconnect attempts every 1 second
4. On reconnect: `mqttConnected` → `true`

**User sees:**
```
🔴 Cannot send command: MQTT Disconnected
```

### Publish Failure

**Scenario:** Message fails to publish

**Behavior:**
1. Toast error with details
2. Switch widget reverts to previous state
3. Slider keeps optimistic value (for UX)

**Console Log:**
```
[useMqttControl] Publish error: Failed to publish message
```

### API Errors

**Scenario:** Device not found, unauthorized, etc.

**Behavior:**
```javascript
{
  "error": "Device not found or unauthorized",
  "status": 403
}
```

**User sees:**
```
❌ Failed to send command: Device not found or unauthorized
```

---

## 📊 Monitoring

### Console Logs

**Connection:**
```
[MQTT] Connected to broker wss://broker.hivemq.com:8884/mqtt
[useMqttControl] MQTT connected
```

**Publishing:**
```
[useMqttControl] Publishing: {topic: "iot/switch/test", payload: {...}}
[MQTT] Published to iot/switch/test: {"id":"...","status":"on"}
[useMqttControl] Publish success: {success: true, ...}
```

**Errors:**
```
[useMqttControl] MQTT not connected
[useMqttControl] Publish error: Failed to publish message
```

### Browser Console

Open DevTools (F12) → Console tab to see all MQTT activity

---

## 🧪 Testing

### 1. Test Switch Widget

```bash
# 1. Open Widget View in browser
# 2. Open Console (F12)
# 3. Click switch toggle
# Expected logs:
[useMqttControl] Publishing: {topic: "iot/...", payload: {id: "...", status: "on"}}
[useMqttControl] Publish success: {...}
```

### 2. Test Slider Widget

```bash
# 1. Open Widget View
# 2. Drag slider slowly
# Expected: Multiple onChange events, single publish after 200ms
# 3. Release slider
# Expected: Immediate publish with final value
```

### 3. Test Connection Error

```bash
# 1. Disconnect from internet
# 2. Try to toggle switch
# Expected: Toast "Cannot send command: MQTT Disconnected"
# 3. Reconnect internet
# Expected: Auto-reconnect within 1 second
```

### 4. Test API Endpoint Directly

```bash
curl -X POST http://localhost:3000/api/mqtt/publish \
  -H "Content-Type: application/json" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -d '{
    "topic": "iot/test",
    "message": "{\"id\":\"test\",\"status\":\"on\"}"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "topic": "iot/test",
  "message": {"id":"test","status":"on"},
  "timestamp": "2025-12-07T..."
}
```

---

## 🔧 Troubleshooting

### Issue 1: "MQTT Disconnected" error

**Cause:** MQTT client not initialized or connection failed

**Solution:**
1. Check `NEXT_PUBLIC_MQTT_BROKER` in `.env.local`
2. Verify broker is accessible (try in MQTT.fx or MQTTX)
3. Check browser Console for connection errors
4. Try public broker: `wss://broker.hivemq.com:8884/mqtt`

### Issue 2: Widget doesn't respond

**Cause:** JavaScript error or MQTT hook not initialized

**Solution:**
1. Open Console (F12) → Look for errors
2. Verify `useMqttControl` hook is imported
3. Check `device.mqtt_topic` is set in database
4. Refresh page to reinitialize MQTT client

### Issue 3: Messages not received by device

**Cause:** Device not subscribed to topic

**Solution:**
1. Verify device subscribes to correct topic
2. Check topic format: `iot/{type}/{name}`
3. Use MQTT broker dashboard to monitor traffic
4. Test with MQTTX to confirm message delivery

### Issue 4: Slider spams messages

**Cause:** Debounce not working

**Solution:**
1. Check `handleSliderChange` uses `setSliderValue` (not direct publish)
2. Verify `onMouseUp`/`onTouchEnd` handlers are attached
3. Increase debounce delay in `useMqttControl.ts` (default 200ms)

---

## 📚 API Reference

### useMqttControl Hook

```typescript
const {
  toggleSwitch,      // (device, status) => Promise<boolean>
  setSliderValue,    // (device, value, options?) => void
  setMode,           // (device, mode) => Promise<boolean>
  sendCustomCommand, // (device, command, data?) => Promise<boolean>
  publishControl,    // (deviceId, topic, payload, options?) => Promise<boolean>
  mqttConnected,     // boolean
} = useMqttControl()
```

### CustomDeviceWidget Props

```typescript
interface CustomDeviceWidgetProps {
  device: any              // Device object with ui_config
  onCustomize?: () => void // Open customization dialog
  onControl?: (action: string) => void // Parent callback
}
```

---

## 🚀 Next Steps

1. **Deploy MQTT Broker:**
   - Set up HiveMQ Cloud or self-hosted Mosquitto
   - Configure TLS/SSL for security
   - Set up ACLs for topic access control

2. **Connect Real Devices:**
   - Flash ESP32 with MQTT client code
   - Subscribe to control topics
   - Implement command handlers

3. **Add More Widget Types:**
   - RGB Color Picker
   - Temperature Dial
   - Multi-button Panel
   - Chart with Controls

4. **Implement Feedback:**
   - Device publishes status after command
   - UI updates with real device state
   - Show "command sent" vs "command executed"

---

**Created:** December 7, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
