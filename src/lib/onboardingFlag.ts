// Shared "has the user seen the intro" flag. The /onboarding wizard and the
// in-app welcome tour both read/write it so neither re-fires after the user
// has already been through either one.

export const ONBOARDING_DONE_KEY = "calmo_onboarding_complete";

export function readOnboardingDone(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ONBOARDING_DONE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markOnboardingDone(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ONBOARDING_DONE_KEY, "1");
  } catch {
    /* ignore */
  }
}
