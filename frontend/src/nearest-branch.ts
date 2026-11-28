import type { Branch } from "./api";

export function branchCoordinates(branch: Branch): { latitude: number; longitude: number } | null {
  if (branch.latitude == null || branch.longitude == null || branch.latitude === "" || branch.longitude === "") return null;
  const latitude = Number(branch.latitude), longitude = Number(branch.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : null;
}

export function nearestBranch(branches: Branch[], latitude: number, longitude: number) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  const radians = (degrees: number) => degrees * Math.PI / 180;
  let nearest: { branch: Branch; distanceKm: number } | null = null;
  for (const branch of branches) {
    if (!branch.is_active) continue;
    const coordinates = branchCoordinates(branch);
    if (!coordinates) continue;
    const a = Math.sin(radians(coordinates.latitude - latitude) / 2) ** 2
      + Math.cos(radians(latitude)) * Math.cos(radians(coordinates.latitude)) * Math.sin(radians(coordinates.longitude - longitude) / 2) ** 2;
    const distanceKm = 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
    if (!nearest || distanceKm < nearest.distanceKm) nearest = { branch, distanceKm };
  }
  return nearest;
}
