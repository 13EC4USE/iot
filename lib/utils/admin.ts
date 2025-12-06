/**
 * Super Admin Utility
 * Centralized admin check for the application
 */

const SUPER_ADMIN_EMAIL = "foolkzaza@gmail.com"

/**
 * Check if user is a super admin
 */
export function isSuperAdmin(email: string | undefined | null): boolean {
  return email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
}

/**
 * Get the super admin email
 */
export function getSuperAdminEmail(): string {
  return SUPER_ADMIN_EMAIL
}
