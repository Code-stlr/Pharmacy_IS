import { createAuthClient } from "@neon/auth";
import { BetterAuthVanillaAdapter } from "@neon/auth/vanilla/adapters";

const makeClient = (url: string) => createAuthClient(url, { adapter: BetterAuthVanillaAdapter() });
type OtpResult = Promise<{ error: { message?: string; code?: string } | null }>;
// shortcut: SDK 0.8.2 installs Email OTP but loses its plugin types; remove when upstream restores them.
type NeonClient = ReturnType<typeof makeClient> & {
  emailOtp: {
    sendVerificationOtp: (data: { email: string; type: "email-verification" }) => OtpResult;
    verifyEmail: (data: { email: string; otp: string }) => OtpResult;
    requestPasswordReset: (data: { email: string }) => OtpResult;
    resetPassword: (data: { email: string; otp: string; password: string }) => OtpResult;
  };
};
let client: NeonClient | null = null;
let configuration: Promise<{ neonAuthUrl: string }> | undefined;

export function authConfiguration() {
  configuration ??= fetch("/api/auth/config/", { credentials: "same-origin" })
    .then(async (response) => {
      if (!response.ok) throw new Error("Authentication configuration unavailable");
      return response.json() as Promise<{ neonAuthUrl: string }>;
    }).catch((error) => { configuration = undefined; throw error; });
  return configuration;
}

export async function neonAuth() {
  const config = await authConfiguration();
  if (!config.neonAuthUrl) return null;
  client ??= makeClient(config.neonAuthUrl) as NeonClient;
  return client;
}

export async function neonHeaders(): Promise<Record<string, string>> {
  const auth = await neonAuth();
  if (!auth) return {};
  const result = await auth.getSession();
  if (result.error) throw new Error(result.error.message);
  const session = result.data?.session;
  return session ? {
    Authorization: "Bearer " + session.token,
    "X-Neon-Session": session.id,
  } : {};
}

export async function signOutNeon() {
  const auth = await neonAuth();
  if (auth) {
    const result = await auth.signOut();
    if (result.error) throw new Error(result.error.message);
  }
}
