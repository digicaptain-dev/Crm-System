/**
 * Smart Company Name Formatter
 * Automatically formats unspaced company names like "Philgraylandscapingca"
 * into "Phil Gray Landscaping CA" while preserving already well-formatted names.
 */

const KNOWN_SUFFIXES = new Set([
  "llc", "inc", "corp", "corporation", "ltd", "limited", "co", "company",
  "gmbh", "pvt", "pty", "pllc", "pc", "usa", "uk"
]);

const KNOWN_STATES = new Set([
  "ca", "ny", "tx", "fl", "il", "pa", "oh", "ga", "nc", "mi", "nj", "va",
  "wa", "az", "ma", "tn", "in", "mo", "md", "wi", "co", "mn", "sc", "al",
  "la", "ky", "or", "ok", "ct", "ut", "ia", "nv", "ar", "ms", "ks", "nm",
  "ne", "id", "wv", "hi", "nh", "me", "mt", "ri", "de", "sd", "nd", "ak",
  "vt", "wy"
]);

const BUSINESS_KEYWORDS = [
  "landscaping", "landscapes", "landscape", "lawncare", "lawn", "tree", "trees",
  "cleaning", "cleaners", "clean", "janitorial", "maid",
  "plumbing", "plumber", "plumbers",
  "woodworks", "woodwork", "woodworking", "carpentry", "cabinets", "cabinetry",
  "construction", "construct", "builders", "builder", "building", "masonry",
  "remodeling", "remodel", "renovation", "renovations",
  "electric", "electrical", "electrician", "electricians",
  "roofing", "roof", "roofers", "roofer",
  "heating", "cooling", "hvac", "airconditioning", "refrigeration",
  "painting", "painters", "painter", "paint",
  "flooring", "floors", "floor", "carpet", "tile", "hardwood",
  "glass", "windows", "window", "doors", "door", "garage",
  "pools", "pool", "spa", "spas", "patio", "paving", "concrete", "fencing", "fence",
  "realty", "realestate", "properties", "property", "homes", "home", "realtors", "realtor",
  "financial", "finance", "advisors", "advisor", "wealth", "capital", "investments", "insurance",
  "consulting", "consultants", "consultant", "associates", "partners", "group", "holdings",
  "dental", "dentist", "dentistry", "orthodontics", "medical", "health", "clinic", "care", "wellness",
  "fitness", "gym", "crossfit", "training", "sports",
  "auto", "automotive", "motors", "motor", "repair", "towing", "mechanic", "detailing", "bodyworks",
  "services", "service", "solutions", "solution", "systems", "system",
  "agency", "studio", "studios", "design", "designs", "creative", "media", "marketing", "digital",
  "tech", "technology", "technologies", "software", "labs", "lab", "innovations", "ventures",
  "law", "legal", "attorney", "attorneys", "lawyers", "lawyer",
  "security", "protection", "alarms", "locksmith",
  "transport", "logistics", "shipping", "freight", "trucking", "moving", "movers", "storage",
  "catering", "restaurant", "bakery", "cafe", "bistro", "grill", "diner", "hotel", "hospitality",
  "photography", "photo", "video", "productions", "films",
  "solar", "energy", "power", "environmental", "pest", "pestcontrol",
  "supply", "supplies", "distributors", "distributor", "wholesale", "trading",
  "enterprises", "enterprise", "industries", "industry", "international", "global",
  "direct", "express", "pro", "pros", "plus", "hub", "center", "centre", "point", "zone"
];

// Sort keywords longest first to match maximum prefixes
BUSINESS_KEYWORDS.sort((a, b) => b.length - a.length);

/**
 * Capitalizes a single word properly
 */
function capitalizeWord(word) {
  if (!word) return "";
  const lower = word.toLowerCase();
  if (KNOWN_SUFFIXES.has(lower) || KNOWN_STATES.has(lower)) {
    return lower.toUpperCase();
  }
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Formats a single company name
 * @param {string} companyName Raw company name
 * @param {string} [contactPerson] Optional contact person name for context
 * @returns {string} Cleaned formatted company name
 */
function formatCompanyName(companyName, contactPerson = "") {
  if (!companyName || typeof companyName !== "string") {
    return companyName || "";
  }

  let name = companyName.trim();
  if (!name) return "";

  // 1. If it already has multiple spaces, keep it and just ensure proper Title Case
  if (name.includes(" ")) {
    // Preserve existing clean spaced names, normalize spaces
    return name
      .replace(/\s+/g, " ")
      .split(" ")
      .map(capitalizeWord)
      .join(" ");
  }

  // 2. If it is CamelCase / PascalCase (e.g. "PhilGrayLandscapingCA")
  if (/[a-z][A-Z]/.test(name)) {
    const splitCamel = name
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
    return splitCamel
      .split(" ")
      .map(capitalizeWord)
      .join(" ");
  }

  // 3. Unspaced name (e.g. "Philgraylandscapingca" or "philgraylandscapingca")
  let remaining = name;
  const parts = [];

  // 3a. If contactPerson matches the beginning of the company name
  if (contactPerson && typeof contactPerson === "string") {
    const cleanContact = contactPerson.trim();
    const contactWords = cleanContact.split(/\s+/).filter(Boolean);
    const contactJoined = contactWords.join("").toLowerCase();

    if (
      contactJoined.length >= 3 &&
      remaining.toLowerCase().startsWith(contactJoined)
    ) {
      parts.push(...contactWords.map(capitalizeWord));
      remaining = remaining.slice(contactJoined.length);
    }
  }

  // 3b. Segment remaining keywords
  let loopCount = 0;
  while (remaining.length > 0 && loopCount < 10) {
    loopCount++;
    const lowerRem = remaining.toLowerCase();
    let matched = false;

    // Check if remaining matches state at the end (e.g. "ca", "tx")
    if (KNOWN_STATES.has(lowerRem)) {
      parts.push(lowerRem.toUpperCase());
      remaining = "";
      break;
    }

    // Check if remaining matches suffix at the end (e.g. "llc", "inc")
    if (KNOWN_SUFFIXES.has(lowerRem)) {
      parts.push(lowerRem.toUpperCase());
      remaining = "";
      break;
    }

    // Try to match business keyword from start or anywhere inside remaining
    let earliestKwIndex = -1;
    let earliestKw = "";

    for (const kw of BUSINESS_KEYWORDS) {
      const idx = lowerRem.indexOf(kw);
      if (idx !== -1) {
        if (earliestKwIndex === -1 || idx < earliestKwIndex || (idx === earliestKwIndex && kw.length > earliestKw.length)) {
          earliestKwIndex = idx;
          earliestKw = kw;
        }
      }
    }

    if (earliestKwIndex === 0) {
      parts.push(capitalizeWord(earliestKw));
      remaining = remaining.slice(earliestKw.length);
      matched = true;
    } else if (earliestKwIndex > 0) {
      const prefix = remaining.slice(0, earliestKwIndex);
      parts.push(capitalizeWord(prefix));
      parts.push(capitalizeWord(earliestKw));
      remaining = remaining.slice(earliestKwIndex + earliestKw.length);
      matched = true;
    }

    if (!matched) {
      // Check if ends with state or suffix
      let stateOrSuffixMatched = false;
      for (const st of KNOWN_STATES) {
        if (lowerRem.endsWith(st) && lowerRem.length > st.length + 2) {
          const prefix = remaining.slice(0, remaining.length - st.length);
          parts.push(capitalizeWord(prefix));
          parts.push(st.toUpperCase());
          remaining = "";
          stateOrSuffixMatched = true;
          break;
        }
      }
      if (stateOrSuffixMatched) break;

      for (const suf of KNOWN_SUFFIXES) {
        if (lowerRem.endsWith(suf) && lowerRem.length > suf.length + 2) {
          const prefix = remaining.slice(0, remaining.length - suf.length);
          parts.push(capitalizeWord(prefix));
          parts.push(suf.toUpperCase());
          remaining = "";
          stateOrSuffixMatched = true;
          break;
        }
      }
      if (stateOrSuffixMatched) break;

      // Fallback: push remaining as is
      parts.push(capitalizeWord(remaining));
      remaining = "";
      break;
    }
  }

  if (parts.length > 0) {
    return parts.join(" ");
  }

  return capitalizeWord(name);
}

module.exports = {
  formatCompanyName,
  capitalizeWord
};
