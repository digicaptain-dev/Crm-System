import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/pipeline/pipeline-deal-card.css";

function PipelineDealCard({
  deal,
  stages = [],
  onDragStart,
  onDragEnd,
  onMoveStage,
  updating = false,
  countdown = null,
}) {
  const navigate = useNavigate();
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const moveMenuRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moveMenuRef.current && !moveMenuRef.current.contains(e.target)) {
        setShowMoveMenu(false);
      }
    };
    if (showMoveMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showMoveMenu]);

  /*
   * =====================================================
   * OPEN DEAL DETAILS
   * =====================================================
   */
  const handleOpenDeal = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (countdown !== null) return;
    if (!deal?.deal_id) return;
    navigate(`/deal/${deal.deal_id}`);
  };

  /*
   * =====================================================
   * DEAL DRAG START
   * =====================================================
   */
  const handleDragStart = (event) => {
    if (updating || countdown !== null) {
      event.preventDefault();
      return;
    }
    setShowMoveMenu(false);
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

  const handleStageSelect = (event, targetStageId) => {
    event.preventDefault();
    event.stopPropagation();
    setShowMoveMenu(false);
    if (String(deal?.deal_stage) === String(targetStageId)) return;
    if (onMoveStage) {
      onMoveStage(deal, targetStageId);
    }
  };

  const priority = deal?.deal_priority || "Medium";
  const status = deal?.deal_status || "Open";

  const priorityClass = priority.toLowerCase().replace(/\s+/g, "-");
  const statusClass = status.toLowerCase().replace(/\s+/g, "-");

  const formattedDate = deal?.close_date
    ? new Date(deal.close_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  const ownerName = deal?.deal_owner || deal?.assigned_user_name || "";

  return (
    <div
      className={`pipeline-deal-card ${updating ? "pipeline-deal-card-updating" : ""} ${countdown !== null ? "pipeline-deal-card-counting-down" : ""}`}
      draggable={!updating && !showMoveMenu && countdown === null}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleOpenDeal}
    >
      {/* Top Badges & Quick Move Button */}
      <div className="deal-card-badges">
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <span className={`deal-priority-pill priority-${priorityClass}`}>
            {priority}
          </span>
          <span className={`deal-status-pill status-${statusClass}`}>
            {status}
          </span>
        </div>

        {/* Quick Move Stage Trigger */}
        {stages.length > 0 && countdown === null && (
          <div className="deal-move-stage-container" ref={moveMenuRef}>
            <button
              type="button"
              className={`deal-move-stage-btn ${showMoveMenu ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowMoveMenu((prev) => !prev);
              }}
              title="Move deal to any stage"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                <path d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <span>Move</span>
            </button>

            {/* Move Stage Dropdown Popover */}
            {showMoveMenu && (
              <div
                className="deal-stage-popover"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="stage-popover-header">
                  <span>Move to Stage</span>
                  <button
                    type="button"
                    className="stage-popover-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMoveMenu(false);
                    }}
                  >
                    ×
                  </button>
                </div>

                <div className="stage-popover-list">
                  {stages.map((stageItem) => {
                    const isCurrentStage =
                      String(deal?.deal_stage) === String(stageItem.stage_id);

                    return (
                      <button
                        key={stageItem.stage_id}
                        type="button"
                        className={`stage-popover-item ${isCurrentStage ? "current" : ""}`}
                        onClick={(e) => handleStageSelect(e, stageItem.stage_id)}
                        disabled={isCurrentStage}
                      >
                        <span className="stage-item-indicator" />
                        <span className="stage-item-name">{stageItem.stage_name}</span>
                        {isCurrentStage && (
                          <span className="stage-item-current-tag">Current</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Title */}
      <h4 className="deal-card-title" title={deal?.deal_name || "Untitled Deal"}>
        {deal?.deal_name || "Untitled Deal"}
      </h4>

      {/* Owner / Contact */}
      {ownerName && (
        <div className="deal-card-org">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>{ownerName}</span>
        </div>
      )}

      {/* Close Date */}
      {formattedDate && (
        <div className="deal-card-value-row">
          <span className="deal-close-date">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Close: {formattedDate}
          </span>
        </div>
      )}

      {/* Bottom Metadata */}
      <div className="deal-card-footer">
        {deal?.moved_by_name ? (
          <div className="deal-card-moved-by-tag" title={`Moved by ${deal.moved_by_name}`}>
            <span className="deal-moved-by-dot" />
            <span className="deal-moved-by-text">User {deal.moved_by_name} Moved this</span>
          </div>
        ) : deal?.assigned_user_name ? (
          <div className="deal-card-owner-info" title={`Assigned User: ${deal.assigned_user_name}`}>
            <div className="deal-owner-circle">{deal.assigned_user_name.charAt(0).toUpperCase()}</div>
            <span className="deal-owner-label">{deal.assigned_user_name}</span>
          </div>
        ) : (
          <span className="deal-unassigned">Not Assigned</span>
        )}

        <button
          type="button"
          className="deal-open-btn"
          onClick={handleOpenDeal}
          title="Open deal details"
          disabled={countdown !== null}
        >
          Open
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* 5-Second Pool Removal Countdown Overlay */}
      {countdown !== null && (
        <div className="deal-pool-countdown-overlay">
          <div className="pool-countdown-box">
            <div className="pool-countdown-top">
              <span className="pool-countdown-badge">Moved to Pool Drive</span>
              <span className="pool-countdown-sec">{countdown}s</span>
            </div>
            <p className="pool-countdown-msg">
              Removing from your account in <strong>{countdown}s</strong>...
            </p>
            <div className="pool-countdown-bar-wrap">
              <div
                className="pool-countdown-bar-inner"
                style={{ width: `${(countdown / 5) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {updating && countdown === null && (
        <div className="deal-updating-overlay">
          <span className="deal-spinner" />
          <span>Moving...</span>
        </div>
      )}
    </div>
  );
}

export default PipelineDealCard;