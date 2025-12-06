# Device Customization Feature 🎨

## Overview

The Device Customization Modal provides a **No-Code, highly intuitive interface** for users to customize how their IoT devices appear on the dashboard. Users can choose widget types, icons, colors, and configurations without writing any code.

---

## Features

### 1. **Visual Widget Type Selector**
Choose from 4 pre-designed widget types:

- **Switch**: Toggle on/off control for binary devices (lights, fans, etc.)
- **Gauge**: Visual meter display for sensors (temperature, humidity, pressure)
- **Slider**: Adjustable value control for dimmers, volume, speed control
- **Stat Card**: Large number display for simple value monitoring

Each widget type is represented by a **clickable card** with an icon and description.

---

### 2. **Dynamic Configuration Form**

#### Icon Picker
- Choose from **14 common IoT icons** (Zap, Thermometer, Droplets, Fan, Lightbulb, etc.)
- Visual button grid for easy selection
- Icons from `lucide-react` library

#### Color Picker
- **8 color themes**: Blue, Green, Purple, Orange, Red, Yellow, Pink, Cyan
- Visual color circles for instant preview
- Color affects icon background, text, and widget accents

#### Range Settings (for Gauge/Slider/Stat)
- **Min Value**: Minimum measurement range
- **Max Value**: Maximum measurement range
- **Unit**: Display unit (°C, %, kW, etc.)

---

### 3. **Live Preview**
- Real-time preview updates as you change settings
- See exactly how the widget will look before saving
- Prevents surprises and improves user confidence

---

### 4. **Data Persistence**
- Saves configuration to `devices.ui_config` JSONB column in Supabase
- Automatically refreshes dashboard after saving
- Persists across sessions

---

## Usage

### For End Users

1. **Open Dashboard** (`/admin/dashboard`)
2. **Hover over any device card** - Settings icon (⚙️) appears in top-right corner
3. **Click Settings icon** - Opens Customization Modal
4. **Choose Widget Type** - Click one of the 4 widget type cards
5. **Select Icon** - Pick an icon from the grid
6. **Choose Color** - Click a color circle
7. **Configure Range** (if applicable) - Set min/max/unit values
8. **Preview** - Check the live preview at the bottom
9. **Save** - Click "Save Customization" button
10. **Done!** - Dashboard refreshes with your new widget design

---

## For Developers

### Installation

1. **Run Database Migration**
```bash
# Execute the SQL migration to add ui_config column
psql -d your_database -f scripts/007_add_ui_config_to_devices.sql
```

2. **Required Dependencies**
```bash
npm install react-hook-form @hookform/resolvers zod --legacy-peer-deps
```

3. **Import Components**
```tsx
import { DeviceCustomizationDialog } from "@/components/admin/dialogs/device-customization-dialog"
import { CustomDeviceWidget } from "@/components/admin/widgets/custom-device-widget"
```

---

### API Endpoint

**POST** `/api/devices/[id]/customize`

**Request Body:**
```json
{
  "ui_config": {
    "widgetType": "gauge",
    "icon": "thermometer",
    "color": "blue",
    "min": 0,
    "max": 50,
    "unit": "°C"
  }
}
```

**Response:**
```json
{
  "success": true,
  "device": { /* updated device object */ }
}
```

**Error Codes:**
- `401`: Unauthorized (not logged in)
- `403`: Forbidden (device doesn't belong to user)
- `404`: Device not found
- `400`: Invalid widget type or missing ui_config
- `500`: Server error

---

### Database Schema

**devices table - ui_config column:**
```sql
ui_config JSONB DEFAULT NULL

-- Example value:
{
  "widgetType": "gauge",    -- "switch" | "gauge" | "slider" | "stat"
  "icon": "thermometer",    -- lucide-react icon name
  "color": "blue",          -- "blue" | "green" | "purple" | "orange" | "red" | "yellow" | "pink" | "cyan"
  "min": 0,                 -- number (optional, for gauge/slider/stat)
  "max": 100,               -- number (optional, for gauge/slider/stat)
  "unit": "°C"              -- string (optional, for gauge/slider/stat)
}
```

---

### Component Usage

#### 1. Customization Dialog

```tsx
import { DeviceCustomizationDialog } from "@/components/admin/dialogs/device-customization-dialog"

function MyComponent() {
  const [customizingDevice, setCustomizingDevice] = useState(null)

  return (
    <>
      <Button onClick={() => setCustomizingDevice(device)}>
        Customize
      </Button>

      {customizingDevice && (
        <DeviceCustomizationDialog
          open={!!customizingDevice}
          onOpenChange={(open) => !open && setCustomizingDevice(null)}
          device={customizingDevice}
          onSave={() => {
            // Refresh data
            fetchDevices()
          }}
        />
      )}
    </>
  )
}
```

#### 2. Custom Widget Renderer

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
          onControl={(action) => handleDeviceControl(device.id, action)}
        />
      ))}
    </div>
  )
}
```

---

### Widget Types Details

#### Switch Widget
- **Use Case**: Binary on/off devices
- **UI**: Icon + Device Name + Toggle Button
- **Action**: Triggers `onControl("on")` or `onControl("off")`

#### Gauge Widget
- **Use Case**: Sensor readings with range
- **UI**: Icon + Device Name + Large Value + Progress Bar
- **Displays**: Real-time sensor value within min-max range
- **Progress Bar**: Visual indicator of value position

#### Slider Widget
- **Use Case**: Adjustable controls (dimmer, volume, speed)
- **UI**: Icon + Device Name + Slider + Current Value
- **Action**: Triggers `onControl("set_${value}")` on change
- **Interactive**: User can drag slider

#### Stat Card Widget
- **Use Case**: Simple large number display
- **UI**: Icon + Device Name + Huge Number + Unit + Badge
- **Best For**: Key metrics, KPIs, status displays

---

## Extending the System

### Adding New Icons

1. Import icon from `lucide-react`
2. Add to `iconOptions` array in `device-customization-dialog.tsx`:
```tsx
{ id: "newicon", name: "New Icon", icon: NewIcon }
```
3. Add to `iconMap` in `custom-device-widget.tsx`:
```tsx
const iconMap = {
  // ... existing
  newicon: NewIcon,
}
```

### Adding New Colors

1. Add to `colorOptions` array:
```tsx
{ 
  id: "lime", 
  name: "Lime", 
  value: "rgb(132, 204, 22)", 
  bg: "bg-lime-500" 
}
```
2. Add to `colorMap` in widget:
```tsx
lime: { 
  bg: "bg-lime-500/20", 
  text: "text-lime-500", 
  border: "border-lime-500/50" 
}
```

### Adding New Widget Types

1. Add to `widgetTypes` array in dialog
2. Add rendering logic in `CustomDeviceWidget`
3. Update form schema validation
4. Add to API endpoint validation

---

## Best Practices

### For Users
- **Choose appropriate widget types**: Use Switch for binary, Gauge for sensors, Slider for adjustable values
- **Set realistic min/max ranges**: Matches actual device capabilities
- **Use descriptive units**: Makes values clear at a glance
- **Pick contrasting colors**: Ensures visibility in both light/dark modes

### For Developers
- **Always validate ui_config**: Check structure before rendering
- **Provide fallbacks**: Default to switch widget if config is invalid
- **Test with real data**: Ensure sensors update widgets correctly
- **Optimize re-renders**: Use React.memo for widget components
- **Handle edge cases**: Missing data, null values, invalid ranges

---

## Troubleshooting

### Widget not updating after customization
- Check if `onSave` callback is fetching fresh data
- Verify API response includes updated `ui_config`
- Check browser console for errors

### Settings icon not appearing
- Ensure `onCustomize` prop is passed to widget
- Check hover state CSS (group/group-hover classes)
- Verify device object has `id` property

### Invalid widget rendering
- Check `ui_config` structure in database
- Validate `widgetType` is one of: switch, gauge, slider, stat
- Ensure icon/color values match predefined options

### Permission errors (403)
- Verify user is logged in
- Check device belongs to current user
- For super admin: ensure `isSuperAdmin()` check allows editing all devices

---

## Future Enhancements

- [ ] Custom widget templates
- [ ] Widget size options (1x1, 2x1, 2x2)
- [ ] Drag-and-drop dashboard layout
- [ ] Advanced gauge types (radial, arc)
- [ ] Chart widgets (line, bar)
- [ ] Custom color picker (hex input)
- [ ] Widget grouping/folders
- [ ] Export/import widget configurations
- [ ] Widget marketplace (share designs)

---

## Screenshots

*(Add screenshots here of the customization modal and example widgets)*

---

## Support

For issues or questions:
- Check this documentation first
- Review example usage in `app/admin/dashboard/page.tsx`
- Check API endpoint in `app/api/devices/[id]/customize/route.ts`
- Inspect component code in `components/admin/dialogs/device-customization-dialog.tsx`

---

**Created**: December 6, 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready
