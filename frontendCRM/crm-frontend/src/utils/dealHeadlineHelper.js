/**
 * Deal Headline Helper
 * Formats website URLs into clean company titles,
 * falls back to email if website is not present,
 * and falls back to deal/company name if neither is available.
 */

const KNOWN_TLDS = [
  ".co.uk", ".com.au", ".co.nz", ".co.in", ".com", ".org", ".net",
  ".edu", ".gov", ".io", ".co", ".biz", ".info", ".us", ".uk",
  ".ca", ".au", ".in", ".tech", ".ai", ".app", ".store", ".shop",
  ".online", ".site", ".xyz", ".me", ".live"
];

function capitalize(word) {
  if (!word) return "";
  const lower = word.toLowerCase();
  if (lower === "llc" || lower === "inc" || lower === "corp" || lower === "ltd" || lower === "usa" || lower === "uk") {
    return lower.toUpperCase();
  }
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Formats a raw website URL into a readable title
 */
export function formatWebsiteToTitle(rawUrl, fallbackOrg = "") {
  if (!rawUrl || typeof rawUrl !== "string") return fallbackOrg || "";
  let clean = rawUrl.trim();
  if (!clean) return fallbackOrg || "";

  // If fallbackOrg exists, is properly spaced, and is not a placeholder
  if (
    fallbackOrg &&
    typeof fallbackOrg === "string" &&
    fallbackOrg.trim() &&
    !fallbackOrg.toLowerCase().includes("untitled") &&
    fallbackOrg.toLowerCase() !== "unknown"
  ) {
    return fallbackOrg.trim();
  }

  // Strip protocol and path
  clean = clean.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split(/[/?#]/)[0];

  // Strip known TLDs
  for (const tld of KNOWN_TLDS) {
    if (clean.toLowerCase().endsWith(tld)) {
      clean = clean.slice(0, -tld.length);
      break;
    }
  }

  // Replace hyphens, underscores, dots with space
  clean = clean.replace(/[-_.]+/g, " ").trim();

  // If already contains spaces, title case it
  if (clean.includes(" ")) {
    return clean.split(/\s+/).map(capitalize).join(" ");
  }

  // Check camelCase
  if (/[a-z][A-Z]/.test(clean)) {
    return clean
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .split(/\s+/)
      .map(capitalize)
      .join(" ");
  }

  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

/**
 * Returns the headline title to display on Deal Card / Pipeline Card
 * Priority:
 * 1. Website breakdown (e.g. Lovely Bunny's)
 * 2. Customer Email (if no website)
 * 3. Company / Deal Name / Contact Person (fallback)
 */
export function getDealHeadline(deal) {
  if (!deal) return { title: "Untitled Lead", type: "fallback" };

  const rawWebsite =
    deal.website ||
    (deal.deal_source && (deal.deal_source.includes(".") || deal.deal_source.startsWith("http"))
      ? deal.deal_source
      : "");

  // Priority 1: Website breakdown
  if (rawWebsite && typeof rawWebsite === "string" && rawWebsite.trim()) {
    const existingOrg = deal.deal_organization || deal.deal_name || "";
    const formatted = formatWebsiteToTitle(rawWebsite, existingOrg);
    if (formatted) {
      return { title: formatted, type: "website", raw: rawWebsite };
    }
  }

  // Priority 2: Customer Email
  if (
    deal.customer_email &&
    typeof deal.customer_email === "string" &&
    deal.customer_email.trim() &&
    deal.customer_email.includes("@")
  ) {
    return { title: deal.customer_email.trim(), type: "email", raw: deal.customer_email.trim() };
  }

  // Priority 3: Company / Deal Name / Contact Person
  if (deal.deal_organization && deal.deal_organization.trim()) {
    return { title: deal.deal_organization.trim(), type: "org" };
  }
  if (deal.deal_name && deal.deal_name.trim() && deal.deal_name !== "Untitled Deal") {
    return { title: deal.deal_name.trim(), type: "deal" };
  }
  if (deal.contact_person && deal.contact_person.trim() && deal.contact_person !== "Unknown") {
    return { title: deal.contact_person.trim(), type: "contact" };
  }

  return { title: "Untitled Lead", type: "fallback" };
}
