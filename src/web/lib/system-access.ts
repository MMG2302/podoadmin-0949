import type { User } from "../contexts/auth-context";

/** Rutas clínicas que requieren pago acreditado o habilitación super_admin. */
export const CLINICAL_APP_PATHS = [
  "/",
  "/patients",
  "/sessions",
  "/calendar",
  "/clinic",
  "/whatsapp-messages",
  "/whatsapp-campaigns",
  "/clinical-tools",
] as const;

/** Rutas permitidas sin acceso de pago (facturación, ajustes, soporte). */
export const ACCESS_WITHOUT_PAYMENT_PATHS = [
  "/billing",
  "/settings",
  "/support",
  "/change-password",
  "/notifications",
] as const;

export function hasActiveSystemAccess(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "super_admin") return true;
  return user.systemAccess === true;
}

export function isClinicalAppPath(path: string): boolean {
  return CLINICAL_APP_PATHS.some((p) => (p === "/" ? path === "/" : path === p || path.startsWith(`${p}/`)));
}

export function isAllowedWithoutSystemAccess(path: string): boolean {
  return ACCESS_WITHOUT_PAYMENT_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

export function getPostLoginPath(user: User): string {
  if (user.mustChangePassword) return "/change-password";
  if (!hasActiveSystemAccess(user)) {
    if (user.role === "clinic_admin" || (user.role === "podiatrist" && !user.clinicId)) {
      return "/billing";
    }
    return "/support";
  }
  return "/";
}

export function normalizeUserSystemAccess(user: User): User {
  return {
    ...user,
    mustChangePassword: user.mustChangePassword ?? false,
    systemAccess: user.role === "super_admin" ? true : user.systemAccess === true,
  };
}

/** Sidebar: ocultar ítem si requiere acceso clínico de pago. */
export function isNavPathAllowedWithoutPayment(path: string): boolean {
  if (path === "/billing" || path === "/settings" || path === "/support") return true;
  if (path === "/users" || path === "/messages" || path === "/audit-log" || path === "/system") return true;
  return false;
}
