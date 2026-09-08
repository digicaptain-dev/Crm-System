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
  // DRAG START
  // =====================================================

  const handleDragStart = (e) => {
    if (!deal?.deal_id) {
      return;
    }

    /*
     * Store deal ID inside browser drag event.
     *
     * PipelineBoard will use this ID when the deal
     * is dropped into another stage.
     */

    e.dataTransfer.setData(
      "dealId",
      String(deal.deal_id)
    );

    e.dataTransfer.effectAllowed = "move";

    onDragStart?.(e, deal);
  };

  // =====================================================
  // DRAG END
  // =====================================================

  const handleDragEnd = (e) => {
    onDragEnd?.(e, deal);
  };

  // =====================================================
  // MENU
  // =====================================================

  const handleMenuClick = (e) => {
    e.stopPropagation();

    /*
     * Deal actions will be added here later.
     *
     * Example:
     * - Edit
     * - Assign
     * - Delete
     * - Change Stage
     */

    console.log(
      "Deal menu:",
      deal?.deal_id
    );
  };

  // =====================================================
  // VALUE
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
    deal?.deal_priority || "Medium";

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div
      className="deal-card"
      draggable={Boolean(
        deal?.deal_id
      )}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleOpenDeal}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (
          e.key === "Enter" ||
          e.key === " "
        ) {
          e.preventDefault();
          handleOpenDeal();
        }
      }}
    >

      {/* =================================================
          TOP
      ================================================= */}

      <div className="deal-card-top">

        <div className="deal-name">
          {deal?.deal_name ||
            "Untitled Deal"}
        </div>

        <button
          type="button"
          className="deal-menu"
          onClick={handleMenuClick}
          onMouseDown={(e) =>
            e.stopPropagation()
          }
          draggable={false}
          aria-label="Deal actions"
        >
          ⋮
        </button>

      </div>

      {/* =================================================
          ORGANIZATION
      ================================================= */}

      <div className="deal-company">
        {deal?.deal_organization ||
          "No organization"}
      </div>

      {/* =================================================
          EMAIL
      ================================================= */}

      <div className="deal-contact">
        {deal?.customer_email ||
          "No email"}
      </div>

      {/* =================================================
          FOOTER
      ================================================= */}

      <div className="deal-card-footer">

        <div className="deal-value">
          {formattedValue}
        </div>

        <div
          className={`deal-priority ${String(
            priority
          ).toLowerCase()}`}
        >
          {priority}
        </div>

      </div>

      {/* =================================================
          OWNER
      ================================================= */}

      <div className="deal-owner">

        Owner:{" "}
        {deal?.deal_owner ||
          "Unassigned"}

      </div>

      {/* =================================================
          STATUS
      ================================================= */}

      {deal?.deal_status && (
        <div
          className={`deal-status ${String(
            deal.deal_status
          ).toLowerCase()}`}
        >
          {deal.deal_status}
        </div>
      )}

    </div>
  );
}

export default DealCard;