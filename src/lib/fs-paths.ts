// src/lib/fs-paths.ts
import path from "path";
export const STORAGE_ROOT =
  process.env.STORAGE_ROOT || path.join(process.cwd(), "data");
export function usersRoot() {
  return path.join(STORAGE_ROOT, "users");
}