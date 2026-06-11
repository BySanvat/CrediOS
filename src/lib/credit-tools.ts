export const CREDIT_TOOLS_COOKIE = "credios_credit_tools_enabled";

export function parseCreditToolsEnabled(value: string | null | undefined): boolean | null {
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

export function shouldShowCreditTools(usageMode: "personal" | "portfolio" | null, enabled: boolean | null) {
  if (enabled !== null) return enabled;
  return usageMode !== "personal";
}
