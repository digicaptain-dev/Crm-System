import { useNavigate } from "react-router-dom";

import "../../styles/pipeline/pipeline-deal-card.css";

function PipelineDealCard({
  deal,
  onDragStart,
  onDragEnd,
  updating = false,
}) {
  const navigate = useNavigate();

  // =====================================================
  // OPEN DEAL DETAILS
  // =====================================================

  const handleOpenDeal = (event) => {
    event.stopPropagation();

    if (!deal?.deal_id) {
      return;
    }

    navigate(`/deals/${deal.deal_id}`);
  };

  // =====================================================
  // DRAG START
  // =====================================================

  const handleDragStart = (event) => {
    if (updating) {
      event.preventDefault();
      return;
    }

    // Store deal ID in browser drag data
    event.dataTransfer.setData(
      "text/plain",
      deal.deal_id
    );

    event.dataTransfer.effectAllowed =
      "move";

    console.log(
      "Dragging deal:",
      deal
    );

    if (onDragStart) {
      onDragStart(deal);
    }
  };

  // =====================================================
  // DRAG END
  // =====================================================

  const handleDragEnd = () => {
    console.log(
      "Finished dragging:",
      deal?.deal_id
    );

    if (onDragEnd) {
      onDragEnd();
    }
  };

  // =====================================================
  // FORMAT VALUE
  // =====================================================

  const formattedValue =
    deal?.deal_value !== null &&
    deal?.deal_value !== undefined &&
    deal?.deal_value !== ""
      ? `$${Number(
          deal.deal_value
        ).toLocaleString()}`
      : "No value";

  // =====================================================
  // PRIORITY
  // =====================================================

  const priority =
    deal?.deal_priority ||
    "Medium";

  // =====================================================
  // STATUS
  // =====================================================

  const status =
    deal?.deal_status ||
    "Open";

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div
      className={[
        "pipeline-deal-card",
        updating
          ? "pipeline-deal-card-updating"
          : "",
      ].join(" ")}
      draggable={!updating}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >

      {/* =================================================
          CARD TOP
      ================================================= */}

      <div className="deal-card-top">

        <span
          className={[
            "deal-priority",
            priority
              .toLowerCase()
              .replace(/\s+/g, "-"),
          ].join(" ")}
        >
          {priority}
        </span>

        <span
          className={[
            "deal-status",
            status
              .toLowerCase()
              .replace(/\s+/g, "-"),
          ].join(" ")}
        >
          {status}
        </span>

      </div>

      {/* =================================================
          DEAL NAME
      ================================================= */}

      <button
        type="button"
        className="deal-card-name"
        onClick={handleOpenDeal}
      >
        {deal?.deal_name ||
          "Untitled Deal"}
      </button>

      {/* =================================================
          DEAL VALUE
      ================================================= */}

      <div className="deal-card-value">
        {formattedValue}
      </div>

      {/* =================================================
          CUSTOMER EMAIL
      ================================================= */}

      {deal?.customer_email && (
        <div className="deal-card-email">
          {deal.customer_email}
        </div>
      )}

      {/* =================================================
          OWNER
      ================================================= */}

      {deal?.deal_owner && (
        <div className="deal-card-owner">
          <span>Owner:</span>

          <strong>
            {deal.deal_owner}
          </strong>
        </div>
      )}

      {/* =================================================
          FOOTER
      ================================================= */}

      <div className="deal-card-footer">

        <button
          type="button"
          className="deal-view-button"
          onClick={handleOpenDeal}
        >
          View Deal
        </button>

        {updating && (
          <span className="deal-updating-text">
            Updating...
          </span>
        )}

      </div>

    </div>
  );
}

export default PipelineDealCard;