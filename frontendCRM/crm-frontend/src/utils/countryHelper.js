/**
 * Utility to extract and format country badge (US, UK, IN, CA, AU, etc.) from deal data
 */

export function getCountryBadge(deal) {
  if (!deal) return { code: "US", label: "US", flag: "🇺🇸" };

  const address = (deal.customer_address || "").toLowerCase();
  const phone = (deal.customer_number || "").replace(/[^0-9+]/g, "");
  const website = (deal.website || "").toLowerCase();
  const email = (deal.customer_email || "").toLowerCase();
  const tags = (deal.tags || "").toLowerCase();

  // 1. UK / United Kingdom
  if (
    address.includes("united kingdom") ||
    address.includes("london") ||
    address.includes("england") ||
    address.includes("scotland") ||
    address.includes("wales") ||
    address.includes("uk") ||
    phone.startsWith("+44") ||
    phone.startsWith("44") ||
    website.endsWith(".co.uk") ||
    website.endsWith(".uk") ||
    email.endsWith(".co.uk") ||
    email.endsWith(".uk") ||
    tags.includes("uk")
  ) {
    return { code: "UK", label: "UK", flag: "🇬🇧" };
  }

  // 2. India
  if (
    address.includes("india") ||
    address.includes("delhi") ||
    address.includes("mumbai") ||
    address.includes("bangalore") ||
    address.includes("bengaluru") ||
    address.includes("hyderabad") ||
    address.includes("chennai") ||
    address.includes("kolkata") ||
    address.includes("pune") ||
    phone.startsWith("+91") ||
    phone.startsWith("91") ||
    website.endsWith(".in") ||
    website.endsWith(".co.in") ||
    email.endsWith(".in") ||
    tags.includes("india") ||
    tags.includes("in")
  ) {
    return { code: "IN", label: "IN", flag: "🇮🇳" };
  }

  // 3. Canada
  if (
    address.includes("canada") ||
    address.includes("toronto") ||
    address.includes("vancouver") ||
    address.includes("montreal") ||
    address.includes("ontario") ||
    address.includes("quebec") ||
    address.includes("alberta") ||
    address.includes("british columbia") ||
    website.endsWith(".ca") ||
    email.endsWith(".ca") ||
    tags.includes("canada")
  ) {
    return { code: "CA", label: "CA", flag: "🇨🇦" };
  }

  // 4. Australia
  if (
    address.includes("australia") ||
    address.includes("sydney") ||
    address.includes("melbourne") ||
    address.includes("brisbane") ||
    address.includes("perth") ||
    address.includes("queensland") ||
    address.includes("new south wales") ||
    phone.startsWith("+61") ||
    phone.startsWith("61") ||
    website.endsWith(".com.au") ||
    website.endsWith(".au") ||
    email.endsWith(".au") ||
    tags.includes("australia")
  ) {
    return { code: "AU", label: "AU", flag: "🇦🇺" };
  }

  // 5. Germany
  if (
    address.includes("germany") ||
    address.includes("deutschland") ||
    address.includes("berlin") ||
    address.includes("munich") ||
    phone.startsWith("+49") ||
    website.endsWith(".de") ||
    email.endsWith(".de")
  ) {
    return { code: "DE", label: "DE", flag: "🇩🇪" };
  }

  // 6. United States (detect USA keywords, states, or standard 10-digit number)
  if (
    address.includes("united states") ||
    address.includes("usa") ||
    address.includes("u.s.a") ||
    address.includes("u.s.") ||
    phone.startsWith("+1") ||
    phone.startsWith("1") ||
    /\b(al|ak|az|ar|ca|co|ct|de|fl|ga|hi|id|il|in|ia|ks|ky|la|me|md|ma|mi|mn|ms|mo|mt|ne|nv|nh|nj|nm|ny|nc|nd|oh|ok|or|pa|ri|sc|sd|tn|tx|ut|vt|va|wa|wv|wi|wy)\b/i.test(address)
  ) {
    return { code: "US", label: "US", flag: "🇺🇸" };
  }

  // Default fallback to US
  return { code: "US", label: "US", flag: "🇺🇸" };
}
