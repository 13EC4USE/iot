import { redirect } from "next/navigation"

export default function DeviceConfigRedirect() {
  redirect("/admin/settings")
}
