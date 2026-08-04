export function safePracticeAction(action) {
  if (!action?.href) return null;
  try {
    const url = new URL(action.href);
    return url.protocol === "https:"
      && url.hostname === "robotaxi.xingbuild.top"
      && !url.username
      && !url.password
      ? { href: url.href }
      : null;
  } catch {
    return null;
  }
}
