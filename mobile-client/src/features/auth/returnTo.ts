export function safeReturnTo(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://spotly.invalid");
    if (url.origin !== "https://spotly.invalid") return "/";
    if (url.pathname === "/" || url.pathname === "/discover" || url.pathname === "/queue" || /^\/outlet\/[A-Za-z0-9-]+$/.test(url.pathname)) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return "/";
  }
  return "/";
}
