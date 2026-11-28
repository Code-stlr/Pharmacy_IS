import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "./i18n";
import ChangePassword from "./ChangePassword";
import { neonAuth } from "./neon";
vi.mock("./neon", () => ({ neonAuth: vi.fn() }));
const changePassword = vi.fn(), close = vi.fn(), changed = vi.fn();
beforeEach(() => { vi.clearAllMocks(); changePassword.mockResolvedValue({ error: null }); vi.mocked(neonAuth).mockResolvedValue({ changePassword } as unknown as NonNullable<Awaited<ReturnType<typeof neonAuth>>>); });
afterEach(cleanup);
function open() { render(<ChangePassword onClose={close} onChanged={changed} />); }
function fill(label: string, value: string) { fireEvent.change(screen.getByLabelText(new RegExp(label)), { target: { value } }); }
function submit() { fireEvent.submit(screen.getByRole("button", { name: "Change password" }).closest("form")!); }
test("confirmation mismatch blocks the provider call", async () => {
  open(); fill("Current password", "Old-password-5839!"); fill("New password", "New-password-5839!"); fill("Confirm password", "wrong"); submit();
  expect(await screen.findByText("Passwords do not match.")).toBeInTheDocument();
  expect(changePassword).not.toHaveBeenCalled(); expect(close).not.toHaveBeenCalled();
});
test("changes the password using the current password and revokes other sessions without email", async () => {
  open(); fill("Current password", "Old-password-5839!"); fill("New password", "New-password-5839!"); fill("Confirm password", "New-password-5839!"); submit();
  await waitFor(() => expect(changed).toHaveBeenCalledOnce());
  expect(changePassword).toHaveBeenCalledWith({ currentPassword: "Old-password-5839!", newPassword: "New-password-5839!", revokeOtherSessions: true });
  expect(close).toHaveBeenCalledOnce();
});
test("a wrong current password leaves the dialog open with the provider error", async () => {
  changePassword.mockResolvedValue({ error: { message: "Current password is incorrect" } });
  open(); fill("Current password", "wrong"); fill("New password", "New-password-5839!"); fill("Confirm password", "New-password-5839!"); submit();
  expect(await screen.findByRole("alert")).toHaveTextContent("Current password is incorrect");
  expect(close).not.toHaveBeenCalled(); expect(changed).not.toHaveBeenCalled();
});
