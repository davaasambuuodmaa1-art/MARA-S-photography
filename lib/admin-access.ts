export const OWNER_ADMIN = {
  email: "marlaa9939@yahoo.com",
  name: "MARA DAVAASAMBUU",
} as const;

export const SECOND_ADMIN = {
  email: "starmaa0307@gmail.com",
  name: "Studio administrator",
} as const;

export const ADMIN_SETUP_COMPLETE_KEY = "admin_setup_complete_v1";

const ADMIN_EMAILS: readonly string[] = [OWNER_ADMIN.email, SECOND_ADMIN.email];

export function isAllowedAdminEmail(email: string) {
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
