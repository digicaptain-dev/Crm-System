/**
 * Inactivity Helper for Leads/Deals
 *
 * A lead is marked inactive if:
 * 1. Its status is "Open" (won/lost leads do not need active follow-up).
 * 2. No action has been taken for 4 or more days (based on latest activity, last_updated, or creation_date).
 */

export function getDealInactivity(deal) {
  if (!deal) {
    return {
      isInactive: false,
      daysInactive: 0,
      badgeLabel: "",
      tooltipText: "",
      urgency: "none",
    };
  }

  // Only monitor Open leads
  const status = String(deal.deal_status || "Open").trim().toLowerCase();
  if (status !== "open") {
    return {
      isInactive: false,
      daysInactive: 0,
      badgeLabel: "",
      tooltipText: "",
      urgency: "none",
    };
  }

  // Prioritize latest activity > last_updated > creation_date
  const rawDate = deal.last_activity_at || deal.last_updated || deal.creation_date;
  if (!rawDate) {
    return {
      isInactive: false,
      daysInactive: 0,
      badgeLabel: "",
      tooltipText: "",
      urgency: "none",
    };
  }

  const actionDate = new Date(rawDate);
  if (isNaN(actionDate.getTime())) {
    return {
      isInactive: false,
      daysInactive: 0,
      badgeLabel: "",
      tooltipText: "",
      urgency: "none",
    };
  }

  const now = new Date();
  const diffMs = now.getTime() - actionDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays >= 4) {
    const urgency = diffDays >= 8 ? "danger" : "warning";
    return {
      isInactive: true,
      daysInactive: diffDays,
      badgeLabel: `${diffDays}d inactive`,
      tooltipText: `⚠️ Inactive: No action taken on this lead for ${diffDays} days.`,
      urgency,
      lastActionDate: actionDate,
    };
  }

  return {
    isInactive: false,
    daysInactive: Math.max(0, diffDays),
    badgeLabel: "",
    tooltipText: "",
    urgency: "none",
    lastActionDate: actionDate,
  };
}
