/**
 * Hook to check if IoT service is active
 * Used globally to enable/disable all API requests
 */

export function useServiceStatus() {
  const isActive = typeof window !== "undefined" 
    ? JSON.parse(localStorage.getItem("iot_service_active") ?? "true")
    : true

  return {
    isServiceActive: isActive,
    canMakeRequests: isActive,
  }
}

/**
 * Utility to conditionally make requests based on service status
 */
export function shouldMakeRequest(): boolean {
  if (typeof window === "undefined") return true
  return JSON.parse(localStorage.getItem("iot_service_active") ?? "true")
}
