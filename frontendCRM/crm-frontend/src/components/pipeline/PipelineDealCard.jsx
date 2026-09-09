import { useNavigate } from "react-router-dom";
import "../../styles/pipeline/pipeline-deal-card.css";

function PipelineDealCard({
  deal,
  onDragStart,
  onDragEnd,
  updating = false,
}) {
  const navigate = useNavigate();

  /*
   * =====================================================
   * OPEN DEAL DETAILS
   * =====================================================
   */

  const handleOpenDeal = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (!deal?.deal_id) return;
    navigate(`/deal/${deal.deal_id}`);
  };

  /*
   * =====================================================
   * DEAL DRAG START
   * =====================================================
   */

  const handleDragStart = (event) => {
    if (updating) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.setData("text/plain", String(deal.deal_id));
    event.dataTransfer.effectAllowed = "move";
    onDragStart?.(deal);
  };

  /*
   * =====================================================
   * DEAL DRAG END
   * =====================================================
   */

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  const priority = deal?.deal_priority || "Medium";
  const status = deal?.deal_status || "Open";

  const formattedValue =
    deal?.deal_value !== null &&
    deal?.deal_value !== undefined &&
    deal?.deal_value !== ""
      ? `$${Number(deal.deal_value).toLocaleString()}`
      : "$0";

  const priorityClass = priority.toLowerCase().replace(/\s+/g, "-");
  const statusClass = status.toLowerCase().replace(/\s+/g, "-");

  const formattedDate = deal?.close_date
    ? new Date(deal.close_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  const ownerName = deal?.deal_owner || deal?.assigned_to_name || "";
  const ownerInitial = ownerName ? ownerName.charAt(0).toUpperCase() : "?";

  return (
    <div
      className={`pipeline-deal-card ${updating ? "pipeline-deal-card-updating" : ""}`}
      draggable={!updating}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleOpenDeal}
    >
      {/* Top Badges */}
      <div className="deal-card-badges">
        <span className={`deal-priority-pill priority-${priorityClass}`}>
          {priority}
        </span>
        <span className={`deal-status-pill status-${statusClass}`}>
          {status}
        </span>
      </div>

      {/* Title */}
      <h4 className="deal-card-title" title={deal?.deal_name || "Untitled Deal"}>
        {deal?.deal_name || "Untitled Deal"}
      </h4>

      {/* Organization */}
      {deal?.deal_organization && (
        <div className="deal-card-org">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <span>{deal.deal_organization}</span>
        </div>
      )}

      {/* Value */}
      <div className="deal-card-value-row">
        <span className="deal-value-amount">{formattedValue}</span>
        {formattedDate && (
          <span className="deal-close-date">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {formattedDate}
          </span>
        )}
      </div>

      {/* Bottom Metadata */}
      <div className="deal-card-footer">
        {ownerName ? (
          <div className="deal-card-owner-info" title={`Owner: ${ownerName}`}>
            <div className="deal-owner-circle">{ownerInitial}</div>
            <span className="deal-owner-label">{ownerName}</span>
          </div>
        ) : (
          <span className="deal-unassigned">Unassigned</span>
        )}

        <button
          type="button"
          className="deal-open-btn"
          onClick={handleOpenDeal}
          title="Open deal details"
        >
          Open
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {updating && (
        <div className="deal-updating-overlay">
          <span className="deal-spinner" />
          <span>Moving...</span>
        </div>
      )}
    </div>
  );
}

export default PipelineDealCard;