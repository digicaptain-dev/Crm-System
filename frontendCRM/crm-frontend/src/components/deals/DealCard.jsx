import { useNavigate } from "react-router-dom";
import "../../styles/deals/deal-card.css";

function DealCard({
  deal,
  onDragStart,
  onDragEnd,
  onClick,
}) {
  const navigate = useNavigate();

  // =====================================================
  // OPEN DEAL DETAILS
  // =====================================================

  const handleOpenDeal = (e) => {
    e.stopPropagation();
    if (!deal?.deal_id) {
      console.error("Deal ID missing:", deal);
      return;
    }
    if (onClick) {
      onClick(deal);
      return;
    }
    navigate(`/deal/${deal.deal_id}`);
  };

  // =====================================================
  // DRAG HANDLERS
  // =====================================================

  const handleDragStart = (e) => {
    if (!deal?.deal_id) return;

    e.dataTransfer.setData("text/plain", String(deal.deal_id));
    e.dataTransfer.effectAllowed = "move";

    onDragStart?.(e, deal);
  };

  const handleDragEnd = (e) => {
    onDragEnd?.(e, deal);
  };

  // =====================================================
  // FORMATTING & VALUES
  // =====================================================

  const formattedValue =
    deal?.deal_value !== null &&
    deal?.deal_value !== undefined &&
    deal?.deal_value !== ""
      ? `$${Number(deal.deal_value).toLocaleString()}`
      : "No value";

  const priority = (deal?.deal_priority || "Medium").toLowerCase();
  const ownerName = deal?.owner_name || deal?.deal_owner || "Unassigned";
  const ownerInitial = ownerName.charAt(0).toUpperCase() || "U";
  const status = (deal?.deal_status || "Open").toLowerCase();

  return (
    <div
      className={`deal-card priority-border-${priority}`}
      draggable={Boolean(deal?.deal_id)}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleOpenDeal}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpenDeal(e);
        }
      }}
    >
      {/* =================================================
          TOP: DEAL NAME & PRIORITY
      ================================================= */}
      <div className="deal-card-header">
        <h4 className="deal-card-title" title={deal?.deal_name || "Untitled Deal"}>
          {deal?.deal_name || "Untitled Deal"}
        </h4>
        <span className={`deal-priority-pill priority-${priority}`}>
          {deal?.deal_priority || "Medium"}
        </span>
      </div>

      {/* =================================================
          BODY: ORGANIZATION & CONTACT
      ================================================= */}
      <div className="deal-card-body">
        {deal?.deal_organization && (
          <div className="deal-info-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
              <line x1="9" y1="22" x2="9" y2="22.01" />
              <line x1="15" y1="22" x2="15" y2="22.01" />
              <line x1="9" y1="6" x2="9" y2="6.01" />
              <line x1="15" y1="6" x2="15" y2="6.01" />
              <line x1="9" y1="10" x2="9" y2="10.01" />
              <line x1="15" y1="10" x2="15" y2="10.01" />
              <line x1="9" y1="14" x2="9" y2="14.01" />
              <line x1="15" y1="14" x2="15" y2="14.01" />
              <line x1="9" y1="18" x2="9" y2="18.01" />
              <line x1="15" y1="18" x2="15" y2="18.01" />
            </svg>
            <span className="deal-info-text">{deal.deal_organization}</span>
          </div>
        )}

        {(deal?.customer_email || deal?.contact_person) && (
          <div className="deal-info-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="deal-info-text">
              {deal.contact_person || deal.customer_email}
            </span>
          </div>
        )}
      </div>

      {/* =================================================
          FOOTER: VALUE, STATUS & OWNER
      ================================================= */}
      <div className="deal-card-footer">
        <div className="deal-value-tag">{formattedValue}</div>

        <div className="deal-footer-meta">
          {deal?.deal_status && (
            <span className={`deal-status-pill status-${status}`}>
              {deal.deal_status}
            </span>
          )}

          <div className="deal-owner-avatar" title={`Owner: ${ownerName}`}>
            {ownerInitial}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DealCard;