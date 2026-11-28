import { useState } from "react";
import { afterEach, expect, test, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import "./i18n";
import BranchSelect from "./BranchSelect";
import { nearestBranch } from "./nearest-branch";
import type { Branch } from "./api";

const branches: Branch[] = [
  { id: 1, code: "MAIN", name: "Mega", is_active: true, address: "Розыбакиева, 247а", latitude: "43.202959", longitude: "76.892411" },
  { id: 2, code: "TOLE", name: "Tole-Bi", is_active: true, address: "Толе би, 59", latitude: "43.255628", longitude: "76.943119" },
  { id: 3, code: "TASTAK", name: "Tastak", is_active: true, address: "Тургут Озала, 80 к5", latitude: "43.252241", longitude: "76.880888" },
  { id: 4, code: "DOSTYQ", name: "Dostyq", is_active: true, address: "Самал-2, 111", latitude: "43.233057", longitude: "76.957123" },
];
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function Picker() {
  const [value, setValue] = useState<number | "">("");
  return <form><BranchSelect branches={branches} value={value} onChange={setValue} /></form>;
}
function mockLocation(implementation: (...args: any[]) => void) {
  const getCurrentPosition = vi.fn(implementation);
  vi.spyOn(navigator, "geolocation", "get").mockReturnValue({ getCurrentPosition } as unknown as Geolocation);
  return getCurrentPosition;
}
// jsdom has no geolocation getter, unlike a browser.
Object.defineProperty(navigator, "geolocation", { configurable: true, get: () => undefined });

test("selects each configured branch correctly, including string decimals and coincident points", () => {
  for (const branch of branches) {
    const result = nearestBranch(branches, Number(branch.latitude), Number(branch.longitude));
    expect(result?.branch.id).toBe(branch.id);
    expect(result?.distanceKm).toBeCloseTo(0);
  }
  expect(nearestBranch(branches, 43.202, 76.891)?.branch.id).toBe(1);
});
test("ignores inactive, missing and invalid coordinates and handles globe boundaries", () => {
  const invalid = branches.map((branch) => ({ ...branch, latitude: null }));
  expect(nearestBranch(invalid, 43, 76)).toBeNull();
  expect(nearestBranch(branches, NaN, 76)).toBeNull();
  expect(nearestBranch(branches, 91, 76)).toBeNull();
  expect(nearestBranch([{ ...branches[0], is_active: false }], 43, 76)).toBeNull();
  expect(nearestBranch([{ ...branches[0], latitude: "0", longitude: "-179.99" }], 0, 179.99)?.distanceKm).toBeLessThan(3);
  expect(nearestBranch([{ ...branches[0], latitude: 0, longitude: 0 }], 0, 180)?.distanceKm).toBeCloseTo(20015, 0);
});
test("asks for location only on click and submits only the selected branch ID", () => {
  const locate = mockLocation((success) => success({ coords: { latitude: 43.202959, longitude: 76.892411 } }));
  const { container } = render(<Picker />);
  expect(locate).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Use my location" }));
  expect(screen.getByRole("status")).toHaveTextContent("Selected Mega");
  expect(new FormData(container.querySelector("form")!).get("preferred_branch")).toBe("1");
  expect(Array.from(new FormData(container.querySelector("form")!).keys())).toEqual(["preferred_branch"]);
  expect(locate).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), expect.objectContaining({ timeout: 10000 }));
});
test("denied permission and timeout preserve manual selection", () => {
  const locate = mockLocation((_success, error) => error({ code: 1 }));
  render(<Picker />);
  fireEvent.click(screen.getByRole("button", { name: "Use my location" }));
  expect(screen.getByRole("alert")).toHaveTextContent("permission was denied");
  locate.mockImplementation((_success, error) => error({ code: 3 }));
  fireEvent.click(screen.getByRole("button", { name: "Use my location" }));
  expect(screen.getByRole("alert")).toHaveTextContent("took too long");
  expect(screen.getByRole("combobox")).toBeEnabled();
});
test("a manual selection wins over a late location result", () => {
  let success: (position: unknown) => void = () => {};
  mockLocation((callback) => { success = callback; });
  const { container } = render(<Picker />);
  fireEvent.click(screen.getByRole("button", { name: "Use my location" }));
  fireEvent.mouseDown(screen.getByRole("combobox"));
  fireEvent.click(screen.getByRole("option", { name: /Tole-Bi/ }));
  act(() => success({ coords: { latitude: 43.202959, longitude: 76.892411 } }));
  expect(new FormData(container.querySelector("form")!).get("preferred_branch")).toBe("2");
});
test("missing coordinates explain why geolocation is unavailable", () => {
  render(<BranchSelect branches={[{ ...branches[0], latitude: null, longitude: null }]} value="" onChange={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Use my location" })).toBeDisabled();
  expect(screen.getByRole("alert")).toHaveTextContent("not been configured");
});
