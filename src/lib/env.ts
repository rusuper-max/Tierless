export const IS_DEV = process.env.NODE_ENV !== "production";
export const DATA_BACKEND = (process.env.DATA_BACKEND || (IS_DEV ? "local" : "blob")).toLowerCase();
// "local" za dev => instant; "blob" za vercel

export function isBlob() {
  return DATA_BACKEND === "blob";
}