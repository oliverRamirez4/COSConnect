export const basePath = "/apps/shelter-connect";
export const assetPrefix = "/apps/shelter-connect-static";

export function withBase(path: string): string {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  return `${basePath}${path}`;
}
