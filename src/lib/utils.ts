import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if a route is currently active based on the pathname
 * @param currentPathname - The current pathname from useLocation()
 * @param targetUrl - The target URL to check against
 * @param options - Optional configuration
 * @param options.exact - If true, requires exact match. If false, allows prefix matching (default: true)
 * @returns true if the route is active, false otherwise
 */
export function isRouteActive(
  currentPathname: string,
  targetUrl: string,
  options?: { exact?: boolean }
): boolean {
  const exact = options?.exact !== false; // Default to true

  // Normalize paths: remove trailing slashes (except for root)
  const normalizePath = (path: string): string => {
    if (path === "/") return "/";
    return path.replace(/\/$/, "") || "/";
  };

  const normalizedCurrent = normalizePath(currentPathname);
  const normalizedTarget = normalizePath(targetUrl);

  if (exact) {
    // Exact match: paths must be identical
    return normalizedCurrent === normalizedTarget;
  } else {
    // Prefix match: current pathname should start with target URL
    // But ensure we don't match partial segments (e.g., /org should not match /organizations)
    if (normalizedCurrent === normalizedTarget) {
      return true;
    }
    // Check if current path starts with target + "/" to ensure we match full segments
    return normalizedCurrent.startsWith(normalizedTarget + "/");
  }
}
