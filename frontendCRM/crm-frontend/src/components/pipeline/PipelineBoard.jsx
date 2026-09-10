import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import PipelineDealCard from "./PipelineDealCard";
import "../../styles/pipeline/pipeline-board.css";

// Stage accent themes
const STAGE_THEMES = [
  { accent: "#3b82f6", bg: "rgba(59, 130, 246, 0.08)", text: "#1d4ed8", border: "#bfdbfe" },
  { accent: "#8b5cf6", bg: "rgba(139, 92, 246, 0.08)", text: "#6d28d9", border: "#ddd6fe" },
  { accent: "#06b6d4", bg: "rgba(6, 182, 212, 0.08)", text: "#0e7490", border: "#a5f3fc" },
  { accent: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)", text: "#b45309", border: "#fde68a" },
  { accent: "#ec4899", bg: "rgba(236, 72, 153, 0.08)", text: "#be185d", border: "#fbcfe8" },
  { accent: "#10b981", bg: "rgba(16, 185, 129, 0.08)", text: "#047857", border: "#a7f3d0" },
];

function PipelineBoard({
  pipeline,
  view = "board",
  onAddStage,
  onEditStage,
  onDeleteStage,
  onReorderStages,
  onAddDeal,
  canManagePipelines = true,
}) {
  const navigate = useNavigate();

  const [stages, setStages] = useState([]);
  const [draggedDealId, setDraggedDealId] = useState(null);
  const [updatingDealId, setUpdatingDealId] = useState(null);
  const [dragOverStageId, setDragOverStageId] = useState(null);
  const [draggedStageId, setDraggedStageId] = useState(null);
  const [reorderingStages, setReorderingStages] = useState(false);
  const [error, setError] = useState("");

  /* Current User & Role */
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("user") || "null");
  } catch {}
  const isEmployee = currentUser?.role === "user";

  const [poolCountdowns, setPoolCountdowns] = useState({});
  const [pendingPoolConfirmation, setPendingPoolConfirmation] = useState(null);

  /* =====================================================
     5-SECOND COUNTDOWN EFFECT FOR EMPLOYEE POOL MOVES
  ===================================================== */
  useEffect(() => {
    const activeKeys = Object.keys(poolCountdowns);
    if (activeKeys.length === 0) return;

    const timer = setInterval(() => {
      setPoolCountdowns((prev) => {
        const next = { ...prev };
        let changed = false;
        Object.entries(next).forEach(([dealId, sec]) => {
          if (sec > 1) {
            next[dealId] = sec - 1;
            changed = true;
          } else {
            delete next[dealId];
            changed = true;
            if (isEmployee) {
              setStages((currStages) =>
                currStages.map((stg) => ({
                  ...stg,
                  deals: stg.deals.filter((d) => String(d.deal_id) !== String(dealId)),
                }))
              );
            }
          }
        });
        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [poolCountdowns, isEmployee]);

  /* =====================================================
     SYNC PIPELINE DATA
  ===================================================== */
  useEffect(() => {
    if (!pipeline?.stages) {
      setStages([]);
      return;
    }

    const sortedStages = [...pipeline.stages]
      .map((stage) => ({
        ...stage,
        deals: Array.isArray(stage.deals) ? stage.deals : [],
      }))
      .sort((a, b) => Number(a.stage_order || 0) - Number(b.stage_order || 0));

    setStages(sortedStages);
  }, [pipeline]);

  const totalVisibleDeals = useMemo(() => {
    return stages.reduce((total, stage) => total + stage.deals.length, 0);
  }, [stages]);

  /* =====================================================
     DRAG & DROP: DEALS
  ===================================================== */
  const handleDealDragStart = (deal) => {
    if (!deal?.deal_id) return;
    setDraggedDealId(deal.deal_id);
    setDraggedStageId(null);
    setError("");
  };

  const handleDealDragEnd = () => {
    setDraggedDealId(null);
    setDragOverStageId(null);
  };

  /* =====================================================
     DRAG & DROP: STAGES
  ===================================================== */
  const handleStageDragStart = (event, stage) => {
    if (!stage?.stage_id) return;
    setDraggedStageId(stage.stage_id);
    setDraggedDealId(null);
    setError("");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-pipeline-stage", String(stage.stage_id));
  };

  const handleStageDragEnd = () => {
    setDraggedStageId(null);
    setDragOverStageId(null);
  };

  const handleDragOver = (event, stageId) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverStageId !== stageId) {
      setDragOverStageId(stageId);
    }
  };

  const handleDragLeave = (event, stageId) => {
    if (dragOverStageId === stageId) {
      setDragOverStageId(null);
    }
  };

  /* =====================================================
     STAGE REORDER DROP
  ===================================================== */
  const handleStageDrop = async (event, targetStage) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOverStageId(null);

    const sourceStageId = event.dataTransfer.getData("application/x-pipeline-stage");
    if (!sourceStageId || !targetStage?.stage_id) return;
    if (String(sourceStageId) === String(targetStage.stage_id)) {
      setDraggedStageId(null);
      return;
    }

    const sourceIndex = stages.findIndex((s) => String(s.stage_id) === String(sourceStageId));
    const targetIndex = stages.findIndex((s) => String(s.stage_id) === String(targetStage.stage_id));
    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedStageId(null);
      return;
    }

    const reorderedStages = [...stages];
    const [movedStage] = reorderedStages.splice(sourceIndex, 1);
    reorderedStages.splice(targetIndex, 0, movedStage);

    const normalizedStages = reorderedStages.map((stage, index) => ({
      ...stage,
      stage_order: index + 1,
    }));

    setStages(normalizedStages);

    setDraggedStageId(null);
    setReorderingStages(true);
    setError("");

    try {
      if (onReorderStages) {
        await onReorderStages(normalizedStages);
      }
    } catch (err) {
      console.error("Stage reorder error:", err);
    } finally {
      setReorderingStages(false);
    }
  };

  /* =====================================================
     EXECUTE DEAL MOVE (CORE LOGIC)
  ===================================================== */
  const executeMoveDeal = async (deal, targetStage, sourceStage) => {
    const dealId = deal.deal_id;
    setUpdatingDealId(dealId);
    setError("");

    const moverName = currentUser?.name || "User";
    const isTargetPool =
      targetStage.stage_name && targetStage.stage_name.toLowerCase().includes("pool");

    // Optimistic UI update
    setStages((previousStages) =>
      previousStages.map((stage) => {
        if (String(stage.stage_id) === String(sourceStage.stage_id)) {
          return {
            ...stage,
            deals: stage.deals.filter((item) => String(item.deal_id) !== String(dealId)),
          };
        }
        if (String(stage.stage_id) === String(targetStage.stage_id)) {
          return {
            ...stage,
            deals: [
              ...stage.deals,
              {
                ...deal,
                deal_stage: targetStage.stage_id,
                ...(isTargetPool ? { moved_by_name: moverName } : {}),
              },
            ],
          };
        }
        return stage;
      })
    );

    if (isTargetPool && isEmployee) {
      // Start 5-second countdown on this deal for employee
      setPoolCountdowns((prev) => ({ ...prev, [dealId]: 5 }));
    }

    try {
      await api.put(`/deals/${dealId}/stage`, {
        deal_stage: targetStage.stage_id,
      });
    } catch (err) {
      console.error("Move deal error:", err);
      // Revert optimistic update
      setStages((previousStages) =>
        previousStages.map((stage) => {
          if (String(stage.stage_id) === String(sourceStage.stage_id)) {
            return {
              ...stage,
              deals: [...stage.deals, deal],
            };
          }
          if (String(stage.stage_id) === String(targetStage.stage_id)) {
            return {
              ...stage,
              deals: stage.deals.filter((item) => String(item.deal_id) !== String(dealId)),
            };
          }
          return stage;
        })
      );
      setPoolCountdowns((prev) => {
        const next = { ...prev };
        delete next[dealId];
        return next;
      });
      setError(err.response?.data?.message || err.message || "Failed to move deal.");
    } finally {
      setUpdatingDealId(null);
      setDraggedDealId(null);
    }
  };

  /* =====================================================
     INITIATE DEAL MOVE (CONFIRMATION FOR POOL DRIVE)
  ===================================================== */
  const initiateDealMove = (deal, targetStage, sourceStage) => {
    if (!deal?.deal_id || !targetStage?.stage_id || !sourceStage?.stage_id) return;
    if (String(sourceStage.stage_id) === String(targetStage.stage_id)) return;

    const isTargetPool =
      targetStage.stage_name && targetStage.stage_name.toLowerCase().includes("pool");

    if (isTargetPool) {
      setPendingPoolConfirmation({
        deal,
        targetStage,
        sourceStage,
      });
    } else {
      executeMoveDeal(deal, targetStage, sourceStage);
    }
  };

  const confirmPoolMove = async () => {
    if (!pendingPoolConfirmation) return;
    const { deal, targetStage, sourceStage } = pendingPoolConfirmation;
    setPendingPoolConfirmation(null);
    await executeMoveDeal(deal, targetStage, sourceStage);
  };

  /* =====================================================
     DEAL MOVE DROP
  ===================================================== */
  const handleDealDrop = async (event, targetStage) => {
    event.preventDefault();
    event.stopPropagation();
    setDragOverStageId(null);

    const stageDragId = event.dataTransfer.getData("application/x-pipeline-stage");
    if (stageDragId) return;

    const dealId = event.dataTransfer.getData("text/plain");
    if (!dealId || !targetStage?.stage_id) return;

    const sourceStage = stages.find((s) =>
      s.deals.some((d) => String(d.deal_id) === String(dealId))
    );
    if (!sourceStage) return;

    const deal = sourceStage.deals.find((item) => String(item.deal_id) === String(dealId));
    if (!deal) {
      setDraggedDealId(null);
      return;
    }

    initiateDealMove(deal, targetStage, sourceStage);
  };

  const handleMoveDealToStage = async (deal, targetStageId) => {
    if (!deal?.deal_id || !targetStageId) return;

    const sourceStage = stages.find((s) =>
      s.deals.some((d) => String(d.deal_id) === String(deal.deal_id))
    );
    if (!sourceStage || String(sourceStage.stage_id) === String(targetStageId)) return;

    const targetStage = stages.find((s) => String(s.stage_id) === String(targetStageId));
    if (!targetStage) return;

    initiateDealMove(deal, targetStage, sourceStage);
  };

  const handleDrop = async (event, targetStage) => {
    const stageDragId = event.dataTransfer.getData("application/x-pipeline-stage");
    if (stageDragId) {
      await handleStageDrop(event, targetStage);
    } else {
      await handleDealDrop(event, targetStage);
    }
  };

  /* =====================================================
     LIST VIEW
  ===================================================== */
  if (view === "list") {
    return (
      <div className="pipeline-board-container">
        {error && (
          <div className="pipeline-board-alert">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")}>×</button>
          </div>
        )}

        <div className="pipeline-list-header">
          <div className="pipeline-list-title-group">
            <h3>{pipeline?.pipeline_name || "Pipeline"}</h3>
            <span className="pipeline-list-count">
              {totalVisibleDeals} {totalVisibleDeals === 1 ? "deal" : "deals"}
            </span>
          </div>

          {canManagePipelines && onAddStage && (
            <button type="button" className="pipeline-btn-add-stage-sm" onClick={onAddStage}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Stage
            </button>
          )}
        </div>

        {totalVisibleDeals === 0 ? (
          <div className="pipeline-empty-card">
            <div className="empty-icon-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="9" y1="21" x2="9" y2="9" />
              </svg>
            </div>
            <h3>No Deals Found</h3>
            <p>No deals match the selected filter criteria.</p>
          </div>
        ) : (
          <div className="pipeline-table-wrapper">
            <table className="pipeline-modern-table">
              <thead>
                <tr>
                  <th>Deal Name</th>
                  <th>Stage</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Close Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stages.flatMap((stage) =>
                  stage.deals.map((deal) => (
                    <tr
                      key={`${stage.stage_id}-${deal.deal_id}`}
                      onClick={() => navigate(`/deal/${deal.deal_id}`)}
                    >
                      <td>
                        <div className="table-deal-cell">
                          <strong>{deal.deal_name || "Untitled Deal"}</strong>
                          {deal.deal_organization && (
                            <span className="table-deal-sub">{deal.deal_organization}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="table-stage-chip">{stage.stage_name}</span>
                      </td>
                      <td>
                        <span className="table-owner-text">{deal.deal_owner || "Unassigned"}</span>
                      </td>
                      <td>
                        <span
                          className={`table-status-pill status-${String(deal.deal_status || "open").toLowerCase()}`}
                        >
                          {deal.deal_status || "Open"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`table-priority-pill priority-${String(deal.deal_priority || "medium").toLowerCase()}`}
                        >
                          {deal.deal_priority || "Medium"}
                        </span>
                      </td>
                      <td>
                        <span className="table-date-text">
                          {deal.close_date
                            ? new Date(deal.close_date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="table-action-link"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/deal/${deal.deal_id}`);
                          }}
                        >
                          View →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  /* =====================================================
     BOARD VIEW (KANBAN)
  ===================================================== */
  return (
    <div className="pipeline-board-container">
      {error && (
        <div className="pipeline-board-alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>×</button>
        </div>
      )}

      {reorderingStages && (
        <div className="pipeline-reorder-banner">
          <span className="spin-icon">↻</span>
          <span>Saving stage order...</span>
        </div>
      )}

      {stages.length === 0 ? (
        <div className="pipeline-empty-card">
          <div className="empty-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <h3>No Stages in Pipeline</h3>
          <p>Create stages (e.g. Qualified, Demo, Proposal, Closed) to organize your sales flow.</p>
          {canManagePipelines && onAddStage && (
            <button type="button" className="pipeline-btn-primary" onClick={onAddStage}>
              + Add First Stage
            </button>
          )}
        </div>
      ) : (
        <div className="pipeline-kanban-board">
          <div className="pipeline-columns-row">
            {stages.map((stage, index) => {
              const deals = Array.isArray(stage.deals) ? stage.deals : [];
              const theme = STAGE_THEMES[index % STAGE_THEMES.length];
              const isDragOver = String(dragOverStageId) === String(stage.stage_id);
              const isDraggedStage = String(draggedStageId) === String(stage.stage_id);

              return (
                <div
                  className={`pipeline-stage-column ${isDragOver ? "column-drag-hover" : ""} ${isDraggedStage ? "column-is-dragged" : ""}`}
                  key={stage.stage_id}
                  onDragOver={(e) => handleDragOver(e, stage.stage_id)}
                  onDragLeave={(e) => handleDragLeave(e, stage.stage_id)}
                  onDrop={(e) => handleDrop(e, stage)}
                >
                  {/* Column Header */}
                  <div className="stage-column-header" style={{ borderTopColor: theme.accent }}>
                    <div className="stage-header-main">
                      {canManagePipelines && (
                        <div
                          className="stage-drag-handle"
                          draggable={!reorderingStages}
                          onDragStart={(e) => handleStageDragStart(e, stage)}
                          onDragEnd={handleStageDragEnd}
                          title="Drag to reorder stage order"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="9" cy="5" r="1" />
                            <circle cx="9" cy="12" r="1" />
                            <circle cx="9" cy="19" r="1" />
                            <circle cx="15" cy="5" r="1" />
                            <circle cx="15" cy="12" r="1" />
                            <circle cx="15" cy="19" r="1" />
                          </svg>
                        </div>
                      )}

                      <div className="stage-name-wrap">
                        <span className="stage-dot" style={{ backgroundColor: theme.accent }} />
                        <h3 className="stage-name" title={stage.stage_name}>
                          {stage.stage_name || "Unnamed Stage"}
                        </h3>
                      </div>

                      <div className="stage-header-actions">
                        <span className="stage-counter">{deals.length}</span>
                        {canManagePipelines && onEditStage && (
                          <button
                            type="button"
                            className="stage-tool-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditStage(stage);
                            }}
                            title="Edit Stage"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                          </button>
                        )}
                        {canManagePipelines && onDeleteStage && (
                          <button
                            type="button"
                            className="stage-tool-btn stage-delete-tool"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteStage(stage);
                            }}
                            title="Delete Stage"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18" />
                              <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="stage-header-meta">
                      <span className="stage-deals-count-text">
                        {deals.length} {deals.length === 1 ? "deal" : "deals"}
                      </span>
                    </div>
                  </div>

                  {/* Deals Container */}
                  <div className="stage-column-cards">
                    {deals.length === 0 ? (
                      <div
                        className="stage-empty-placeholder"
                        style={{ cursor: canManagePipelines ? "pointer" : "default" }}
                        onClick={() => {
                          if (canManagePipelines) {
                            if (onAddDeal) onAddDeal(stage);
                            else navigate("/deals");
                          }
                        }}
                      >
                        {canManagePipelines && <div className="empty-plus-icon">+</div>}
                        <span className="empty-drop-text">No deals here</span>
                        <span className="empty-drop-sub">
                          {canManagePipelines ? "Click to add or drop a deal" : "Drop deals here"}
                        </span>
                      </div>
                    ) : (
                      deals.map((deal) => (
                        <PipelineDealCard
                          key={deal.deal_id}
                          deal={deal}
                          stages={stages}
                          onDragStart={handleDealDragStart}
                          onDragEnd={handleDealDragEnd}
                          onMoveStage={handleMoveDealToStage}
                          updating={String(updatingDealId) === String(deal.deal_id)}
                          countdown={poolCountdowns[deal.deal_id] ?? null}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}

            {/* Quick Add Stage Button at the end of the board */}
            {canManagePipelines && onAddStage && (
              <div className="pipeline-add-stage-column-card">
                <button
                  type="button"
                  className="pipeline-add-stage-card-btn"
                  onClick={onAddStage}
                >
                  <div className="add-stage-plus-circle">+</div>
                  <span>Add New Stage</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pool Drive Confirmation Modal */}
      {pendingPoolConfirmation && (
        <div
          className="pipeline-modal-backdrop"
          onClick={() => setPendingPoolConfirmation(null)}
        >
          <div
            className="pool-confirm-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pool-confirm-header">
              <div className="pool-confirm-icon-box">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="pool-confirm-title-area">
                <h3 className="pool-confirm-title">Move to Pool Drive?</h3>
                <p className="pool-confirm-subtitle">
                  Move <strong>{pendingPoolConfirmation.deal?.deal_name || "this deal"}</strong> to Pool Drive?
                </p>
              </div>
            </div>

            <div className="pool-confirm-body">
              <div className="pool-confirm-info-box">
                <span className="pool-info-dot" />
                <p>
                  This lead will be unassigned and transferred to the central Pool Drive for Admins and Managers.
                  {isEmployee && " It will disappear from your account after 5 seconds."}
                </p>
              </div>
            </div>

            <div className="pool-confirm-actions">
              <button
                type="button"
                className="pool-btn-cancel"
                onClick={() => setPendingPoolConfirmation(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pool-btn-confirm"
                onClick={confirmPoolMove}
                autoFocus
              >
                Confirm Move
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PipelineBoard;