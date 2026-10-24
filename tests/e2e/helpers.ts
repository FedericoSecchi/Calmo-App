// Shared helpers for e2e tests. Everything is kept dependency-free so the
// test can run against production without any build-time glue.

const SUPABASE_URL = "https://wtquhlfodfqjcggaqxwk.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0cXVobGZvZGZxamNnZ2FxeHdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzMDMwODEsImV4cCI6MjA4MTg3OTA4MX0.JwgGiN2_02cBqFFTA2fF_yjKSiaDBBuzBOHxYuU7vZI";

export const STRONG_TEST_PASSWORD = "Testing-Password-123!";

export function e2eEmail(label = "account"): string {
  return `e2e+${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@calmo.fit`;
}

interface TokenResponse {
  access_token: string;
}

export async function deleteAccountByCredentials(email: string, password: string): Promise<void> {
  try {
    const tokenRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });
    if (!tokenRes.ok) return;
    const token = (await tokenRes.json()) as TokenResponse;
    if (!token?.access_token) return;

    await fetch(`${SUPABASE_URL}/rest/v1/rpc/delete_my_account`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        Authorization: `Bearer ${token.access_token}`,
      },
    });
  } catch {
    /* best-effort cleanup */
  }
}
