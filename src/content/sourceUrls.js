const controlCharacterPattern = /[\u0000-\u001F\u007F]/;
const absoluteHttpsPattern = /^https:\/\//;
const siteRelativePattern = /^\/(?!\/)/;

export function classifySourceUrl(source) {
  const value = source?.url;
  if (
    typeof value !== "string" ||
    value === "" ||
    value !== value.trim() ||
    controlCharacterPattern.test(value) ||
    value.includes("\\")
  ) {
    return { valid: false, reason: "source url contains invalid characters" };
  }

  if (siteRelativePattern.test(value)) {
    if (source.sourceTier !== "internal_snapshot" || source.sourceType !== "internal_snapshot") {
      return {
        valid: false,
        reason: "site-relative source url requires internal_snapshot tier and type",
      };
    }
    try {
      const parsed = new URL(value, "https://xingbuild.top");
      if (parsed.origin !== "https://xingbuild.top") {
        return { valid: false, reason: "site-relative source url must remain on xingbuild.top" };
      }
      return { valid: true, kind: "internal", href: `${parsed.pathname}${parsed.search}${parsed.hash}` };
    } catch {
      return { valid: false, reason: "site-relative source url is invalid" };
    }
  }

  if (!absoluteHttpsPattern.test(value)) {
    return {
      valid: false,
      reason: "external source url must be an absolute https url",
    };
  }

  try {
    const parsed = new URL(value);
    if (
      parsed.protocol !== "https:" ||
      !parsed.hostname ||
      parsed.username ||
      parsed.password
    ) {
      return { valid: false, reason: "external source url must be a credential-free https url" };
    }
    return { valid: true, kind: "external", href: parsed.href };
  } catch {
    return { valid: false, reason: "external source url is invalid" };
  }
}
