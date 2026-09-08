import { useNavigate } from "react-router-dom";

import "../../styles/pipeline/pipeline-deal-card.css";

function PipelineDealCard({
  deal,
  onDragStart,
  onDragEnd,
  updating = false,
}) {
  const navigate = useNavigate();

  const handleOpenDeal = (event) => {
    event.stopPropagation();

    if (!deal?.deal_id) {
      return;
    }

    navigate(
      `/deals/${deal.deal_id}`
    );
  };

  const handleDragStart = (event) => {
    if (updating) {
      event.preventDefault();
      return;
    }

    event.dataTransfer.setData(
      "text/plain",
      deal.deal_id
    );

    event.dataTransfer.effectAllowed =
      "move";

    onDragStart?.(deal);
  };

  const handleDragEnd = () => {
    onDragEnd?.();
  };

  const priority =
    deal?.deal_priority ||
    "Medium";

  const status =
    deal?.deal_status ||
    "Open";

  const formattedValue =
    deal?.deal_value !== null &&
    deal?.deal_value !== undefined &&
    deal?.deal_value !== ""
      ? `$${Number(
          deal.deal_value
        ).toLocaleString()}`
      : "No value";

  const priorityClass =
    priority
      .toLowerCase()
      .replace(/\s+/g, "-");

  const statusClass =
    status
      .toLowerCase()
      .replace(/\s+/g, "-");

  const formattedDate = deal?.close_date
    ? new Date(
        deal.close_date
      ).toLocaleDateString(
        "en-US",
        {
          month: "short",
          day: "numeric",
        }
      )
    : null;

  return (
    <div
      className={[
        "pipeline-deal-card",
        updating
          ? "pipeline-deal-card-updating"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      draggable={!updating}
      onDragStart={
        handleDragStart
      }
      onDragEnd={
        handleDragEnd
      }
    >

      {/* TOP */}

      <div className="deal-card-top">

        <span
          className={[
            "deal-priority",
            priorityClass,
          ].join(" ")}
        >
          {priority}
        </span>

        <span
          className={[
            "deal-status",
            statusClass,
          ].join(" ")}
        >
          {status}
        </span>

      </div>

      {/* NAME */}

      <button
        type="button"
        className="deal-card-name"
        onClick={
          handleOpenDeal
        }
      >
        {deal?.deal_name ||
          "Untitled Deal"}
      </button>

      {/* VALUE */}

      <div className="deal-card-value">
        {formattedValue}
      </div>

      {/* CUSTOMER */}

      {deal?.customer_email && (
        <div className="deal-card-email">
          <span>✉</span>
          {deal.customer_email}
        </div>
      )}

      {/* CLOSE DATE */}

      {formattedDate && (
        <div className="deal-card-date">
          <span>◷</span>
          Close {formattedDate}
        </div>
      )}

      {/* OWNER */}

      {deal?.deal_owner && (
        <div className="deal-card-owner">

          <div className="deal-owner-avatar">
            {String(
              deal.deal_owner
            )
              .charAt(0)
              .toUpperCase()}
          </div>

          <div>
            <span>Owner</span>

            <strong>
              {deal.deal_owner}
            </strong>
          </div>

        </div>
      )}

      {/* FOOTER */}

      <div className="deal-card-footer">

        <button
          type="button"
          className="deal-view-button"
          onClick={
            handleOpenDeal
          }
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