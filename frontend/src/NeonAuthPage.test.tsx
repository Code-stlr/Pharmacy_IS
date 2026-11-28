import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import "./i18n";
import NeonAuthPage from "./NeonAuthPage";
import { api, ApiError } from "./api";
import { neonAuth } from "./neon";

vi.mock("./api", async (original) => ({ ...await original<typeof import("./api")>(), api: vi.fn() }));
vi.mock("./neon", () => ({ neonAuth: vi.fn(), neonHeaders: vi.fn(async () => ({})) }));
const ok = () => Promise.resolve({ error: null });
const auth = {
  getSession: vi.fn(async () => ({ data: null })),
  signUp: { email: vi.fn(ok) }, signIn: { email: vi.fn(ok), social: vi.fn(ok) }, signOut: vi.fn(ok),
  emailOtp: { sendVerificationOtp: vi.fn(ok), verifyEmail: vi.fn(ok), requestPasswordReset: vi.fn(ok), resetPassword: vi.fn(ok) },
};
const done = vi.fn();
beforeEach(() => { vi.clearAllMocks(); vi.mocked(neonAuth).mockResolvedValue(auth as unknown as NonNullable<Awaited<ReturnType<typeof neonAuth>>>); });
afterEach(cleanup);
async function open(path = "/login") {
  render(<MemoryRouter initialEntries={[path]}><NeonAuthPage onAuthenticated={done} /></MemoryRouter>);
  await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
}
function fill(label: string, value: string) { fireEvent.change(screen.getByLabelText(new RegExp(label)), { target: { value } }); }

test("sign-up always opens verification and never grants workspace access", async () => {
  await open("/register"); fill("Email", "person@example.test"); fill("Full name", "Test Person"); fill("^Password", "Strong-password-5938!"); fill("Confirm password", "Strong-password-5938!");
  fireEvent.submit(screen.getByRole("button", { name: "Create account" }).closest("form")!);
  expect(await screen.findByRole("heading", { name: "Verify your email" })).toBeInTheDocument();
  expect(done).not.toHaveBeenCalled(); expect(api).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: /Resend in/ })).toBeDisabled();
});
test("signup requires password confirmation and blocks a mismatch before account creation", async () => {
  await open("/register");
  expect(screen.getByLabelText(/Confirm password/)).toBeRequired();
  fill("Email", "person@example.test"); fill("Full name", "Test Person"); fill("^Password", "Strong-password-5938!"); fill("Confirm password", "wrong");
  fireEvent.submit(screen.getByRole("button", { name: "Create account" }).closest("form")!);
  expect(await screen.findByRole("alert")).toHaveTextContent("Passwords do not match");
  expect(screen.getByLabelText(/Confirm password/)).toBeInvalid();
  expect(auth.signUp.email).not.toHaveBeenCalled();
});
test("registration has one Sign in action and login clearly identifies Google and staff access", async () => {
  await open("/register");
  expect(screen.getAllByRole("button", { name: "Sign in" })).toHaveLength(1);
  expect(screen.queryByRole("button", { name: "Back to sign in" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByText("Don’t have an account?")).toBeInTheDocument();
  const google = screen.getByRole("button", { name: "Continue with Google" });
  expect(google.querySelector("img")).toHaveAttribute("src", "/google-g.png");
  expect(screen.getByRole("button", { name: "Sign in" })).toHaveClass("MuiButton-outlined");
  expect(screen.getByText("Administrator or pharmacist?")).toBeInTheDocument();
  expect(screen.getByText(/Use the staff login ID and password provided by your administrator/)).toBeInTheDocument();
});
test("verification consumes the entered OTP and returns to sign-in", async () => {
  await open("/verify-email"); fill("Email", "person@example.test"); fill("Verification code", "123456");
  fireEvent.submit(screen.getByRole("button", { name: "Verify email" }).closest("form")!);
  expect(await screen.findByText("Email verified. Sign in to continue.")).toBeInTheDocument();
  expect(auth.emailOtp.verifyEmail).toHaveBeenCalledWith({ email: "person@example.test", otp: "123456" });
  expect(done).not.toHaveBeenCalled();
});
test("resend starts a cooldown and displays provider rate limit errors", async () => {
  await open("/verify-email"); fill("Email", "person@example.test");
  auth.emailOtp.sendVerificationOtp.mockResolvedValueOnce({ error: { message: "Too many requests" } } as never);
  fireEvent.click(screen.getByRole("button", { name: "Resend verification email" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Too many requests");
  fireEvent.click(screen.getByRole("button", { name: "Resend verification email" }));
  expect(await screen.findByRole("button", { name: /Resend in/ })).toBeDisabled();
});
test("unverified login cannot enter the workspace", async () => {
  auth.signIn.email.mockResolvedValueOnce({ error: { code: "EMAIL_NOT_VERIFIED", message: "Verify email" } } as never);
  await open(); fill("Email", "person@example.test"); fill("Password", "Strong-password-5938!");
  fireEvent.submit(screen.getByRole("button", { name: "Sign in" }).closest("form")!);
  expect(await screen.findByRole("heading", { name: "Verify your email" })).toBeInTheDocument();
  expect(done).not.toHaveBeenCalled();
});
test("forgot password and reset use OTP and require matching passwords", async () => {
  await open("/forgot-password"); fill("Email", "person@example.test");
  fireEvent.submit(screen.getByRole("button", { name: "Send reset code" }).closest("form")!);
  expect(await screen.findByRole("heading", { name: "Reset password" })).toBeInTheDocument();
  fill("Verification code", "123456"); fill("^Password", "Strong-password-5938!"); fill("Confirm password", "mismatch");
  fireEvent.submit(screen.getByRole("button", { name: "Reset password" }).closest("form")!);
  expect(await screen.findByRole("alert")).toHaveTextContent("Passwords do not match");
  expect(auth.emailOtp.resetPassword).not.toHaveBeenCalled();
  fill("Confirm password", "Strong-password-5938!");
  fireEvent.submit(screen.getByRole("button", { name: "Reset password" }).closest("form")!);
  await waitFor(() => expect(screen.getByText("Password reset. Sign in with your new password.")).toBeInTheDocument());
});
test("remember-me and authenticated identity drive workspace access", async () => {
  const user = { id: 99, username: "verified", role: "Patient" };
  vi.mocked(api).mockResolvedValue(user);
  await open(); fill("Email", "person@example.test"); fill("Password", "Strong-password-5938!");
  fireEvent.submit(screen.getByRole("button", { name: "Sign in" }).closest("form")!);
  await waitFor(() => expect(done).toHaveBeenCalledWith(user));
  expect(auth.signIn.email).toHaveBeenCalledWith(expect.objectContaining({ rememberMe: true }));
});
test("first login requests profile completion rather than granting an unlinked role", async () => {
  vi.mocked(api).mockImplementation(async (path) => { if (path === "auth/me/") throw new ApiError("account_setup_required"); return []; });
  await open(); fill("Email", "person@example.test"); fill("Password", "Strong-password-5938!");
  fireEvent.submit(screen.getByRole("button", { name: "Sign in" }).closest("form")!);
  expect(await screen.findByRole("heading", { name: "Complete your patient profile" })).toBeInTheDocument();
  expect(done).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Link an existing pharmacy account" })).toBeInTheDocument();
});
