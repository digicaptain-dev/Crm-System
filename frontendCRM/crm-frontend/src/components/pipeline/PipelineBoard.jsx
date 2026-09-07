import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

import PipelineDealCard from "./PipelineDealCard";

import "../../styles/pipeline/pipeline-board.css";

function PipelineBoard({
  pipeline,
  view = "board",
  onAddStage,
  onEditStage,
  onDeleteStage,
  onReorderStages,
}) {
  const navigate = useNavigate();

  const [stages, setStages] = useState([]);

  const [draggedDealId, setDraggedDealId] = useState(null);
  const [updatingDealId, setUpdatingDealId] = useState(null);

  const [draggedStageId, setDraggedStageId] = useState(null);
  const [reorderingStages, setReorderingStages] = useState(false);

  const [error, setError] = useState("");

  /*
   * =====================================================
   * SYNC PIPELINE DATA
   * =====================================================
   */

  useEffect(() => {
    if (!pipeline?.stages) {
      setStages([]);
      return;
    }

    const sortedStages = [...pipeline.stages]
      .map((stage) => ({
        ...stage,
        deals: Array.isArray(stage.deals)
          ? stage.deals
          : [],
      }))
      .sort(
        (a, b) =>
          Number(a.stage_order || 0) -
          Number(b.stage_order || 0)
      );

    setStages(sortedStages);
  }, [pipeline]);

  /*
   * =====================================================
   * STAGE VALUE
   * =====================================================
   */

  const getStageValue = (deals) => {
    return deals.reduce((total, deal) => {
      const value = Number(deal?.deal_value);

      return Number.isFinite(value)
        ? total + value
        : total;
    }, 0);
  };

  /*
   * =====================================================
   * FORMAT CURRENCY
   * =====================================================
   */

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);
  };

  /*
   * =====================================================
   * TOTAL VISIBLE DEALS
   * =====================================================
   */

  const totalVisibleDeals = useMemo(() => {
    return stages.reduce(
      (total, stage) =>
        total + stage.deals.length,
      0
    );
  }, [stages]);

  /*
   * =====================================================
   * DEAL DRAG START
   * =====================================================
   */

  const handleDealDragStart = (deal) => {
    const dealId = deal?.deal_id;

    if (!dealId) {
      return;
    }

    setDraggedDealId(dealId);
    setDraggedStageId(null);
    setError("");
  };

  /*
   * =====================================================
   * DEAL DRAG END
   * =====================================================
   */

  const handleDealDragEnd = () => {
    setDraggedDealId(null);
  };

  /*
   * =====================================================
   * STAGE DRAG START
   * =====================================================
   */

  const handleStageDragStart = (event, stage) => {
    if (!stage?.stage_id) {
      return;
    }

    setDraggedStageId(stage.stage_id);
    setDraggedDealId(null);
    setError("");

    event.dataTransfer.effectAllowed = "move";

    event.dataTransfer.setData(
      "application/x-pipeline-stage",
      String(stage.stage_id)
    );
  };

  /*
   * =====================================================
   * STAGE DRAG END
   * =====================================================
   */

  const handleStageDragEnd = () => {
    setDraggedStageId(null);
  };

  /*
   * =====================================================
   * DRAG OVER
   * =====================================================
   */

  const handleDragOver = (event) => {
    event.preventDefault();

    event.dataTransfer.dropEffect = "move";
  };

  /*
   * =====================================================
   * REORDER STAGES
   * =====================================================
   */

  const handleStageDrop = async (
    event,
    targetStage
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const sourceStageId =
      event.dataTransfer.getData(
        "application/x-pipeline-stage"
      );

    if (
      !sourceStageId ||
      !targetStage?.stage_id
    ) {
      return;
    }

    if (
      String(sourceStageId) ===
      String(targetStage.stage_id)
    ) {
      setDraggedStageId(null);
      return;
    }

    const sourceIndex = stages.findIndex(
      (stage) =>
        String(stage.stage_id) ===
        String(sourceStageId)
    );

    const targetIndex = stages.findIndex(
      (stage) =>
        String(stage.stage_id) ===
        String(targetStage.stage_id)
    );

    if (
      sourceIndex === -1 ||
      targetIndex === -1
    ) {
      setDraggedStageId(null);
      return;
    }

    const reorderedStages = [...stages];

    const [movedStage] =
      reorderedStages.splice(
        sourceIndex,
        1
      );

    reorderedStages.splice(
      targetIndex,
      0,
      movedStage
    );

    /*
     * Immediately update local UI.
     */

    const normalizedStages =
      reorderedStages.map(
        (stage, index) => ({
          ...stage,
          stage_order: index + 1,
        })
      );

    setStages(normalizedStages);
    setDraggedStageId(null);
    setReorderingStages(true);
    setError("");

    try {
      /*
       * Send complete ordered stage list
       * to Pipeline.jsx.
       */

      if (onReorderStages) {
        await onReorderStages(
          normalizedStages
        );
      }
    } catch (err) {
      /*
       * Parent handles the API error.
       * Refreshing pipeline data will restore
       * the correct backend order.
       */

      console.error(
        "Stage reorder error:",
        err
      );
    } finally {
      setReorderingStages(false);
    }
  };

  /*
   * =====================================================
   * DEAL DROP
   * =====================================================
   */

  const handleDealDrop = async (
    event,
    targetStage
  ) => {
    event.preventDefault();
    event.stopPropagation();

    /*
     * If this is a stage drag, do not
     * process it as a deal drag.
     */

    const stageDragId =
      event.dataTransfer.getData(
        "application/x-pipeline-stage"
      );

    if (stageDragId) {
      return;
    }

    const dealId =
      event.dataTransfer.getData(
        "text/plain"
      );

    if (
      !dealId ||
      !targetStage?.stage_id
    ) {
      return;
    }

    /*
     * Find current stage.
     */

    const sourceStage = stages.find(
      (stage) =>
        stage.deals.some(
          (deal) =>
            String(deal.deal_id) ===
            String(dealId)
        )
    );

    if (!sourceStage) {
      return;
    }

    /*
     * Don't call API if dropped in
     * the same stage.
     */

    if (
      String(sourceStage.stage_id) ===
      String(targetStage.stage_id)
    ) {
      setDraggedDealId(null);
      return;
    }

    const deal = sourceStage.deals.find(
      (item) =>
        String(item.deal_id) ===
        String(dealId)
    );

    if (!deal) {
      setDraggedDealId(null);
      return;
    }

    setUpdatingDealId(dealId);
    setError("");

    /*
     * Optimistic UI update.
     */

    setStages((previousStages) =>
      previousStages.map((stage) => {
        /*
         * Remove deal from old stage.
         */

        if (
          String(stage.stage_id) ===
          String(sourceStage.stage_id)
        ) {
          return {
            ...stage,
            deals: stage.deals.filter(
              (item) =>
                String(item.deal_id) !==
                String(dealId)
            ),
          };
        }

        /*
         * Add deal to target stage.
         */

        if (
          String(stage.stage_id) ===
          String(targetStage.stage_id)
        ) {
          return {
            ...stage,
            deals: [
              ...stage.deals,
              {
                ...deal,
                deal_stage:
                  targetStage.stage_id,
              },
            ],
          };
        }

        return stage;
      })
    );

    try {
      /*
       * =================================================
       * UPDATE DEAL STAGE IN BACKEND
       * =================================================
       *
       * IMPORTANT:
       * Use the configured `api` instance instead
       * of raw axios.
       *
       * services/api.js automatically adds:
       *
       * Authorization: Bearer <token>
       *
       * through the request interceptor.
       */

      await api.put(
        `/deals/${dealId}/stage`,
        {
          deal_stage:
            targetStage.stage_id,
        }
      );
    } catch (err) {
      console.error(
        "Move deal error:",
        err
      );

      /*
       * Rollback optimistic update.
       */

      setStages((previousStages) =>
        previousStages.map((stage) => {
          /*
           * Restore deal to original stage.
           */

          if (
            String(stage.stage_id) ===
            String(sourceStage.stage_id)
          ) {
            return {
              ...stage,
              deals: [
                ...stage.deals,
                deal,
              ],
            };
          }

          /*
           * Remove deal from target stage.
           */

          if (
            String(stage.stage_id) ===
            String(targetStage.stage_id)
          ) {
            return {
              ...stage,
              deals: stage.deals.filter(
                (item) =>
                  String(item.deal_id) !==
                  String(dealId)
              ),
            };
          }

          return stage;
        })
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to move deal."
      );
    } finally {
      setUpdatingDealId(null);
      setDraggedDealId(null);
    }
  };

  /*
   * =====================================================
   * COMBINED DROP HANDLER
   * =====================================================
   */

  const handleDrop = async (
    event,
    targetStage
  ) => {
    const stageDragId =
      event.dataTransfer.getData(
        "application/x-pipeline-stage"
      );

    if (stageDragId) {
      await handleStageDrop(
        event,
        targetStage
      );

      return;
    }

    await handleDealDrop(
      event,
      targetStage
    );
  };

  /*
   * =====================================================
   * ADD DEAL
   * =====================================================
   */

  const handleAddDeal = (stage) => {
    if (!stage) {
      return;
    }

    navigate("/deals");
  };

  /*
   * =====================================================
   * EDIT STAGE
   * =====================================================
   */

  const handleEditStageClick = (
    event,
    stage
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (!stage || !onEditStage) {
      return;
    }

    onEditStage(stage);
  };

  /*
   * =====================================================
   * DELETE STAGE
   * =====================================================
   */

  const handleDeleteStageClick = (
    event,
    stage
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (!stage || !onDeleteStage) {
      return;
    }

    onDeleteStage(stage);
  };

  /*
   * =====================================================
   * LIST VIEW
   * =====================================================
   */

  if (view === "list") {
    return (
      <div className="pipeline-board-wrapper">

        {error && (
          <div className="pipeline-board-error">
            <span>{error}</span>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              ×
            </button>
          </div>
        )}

        <div className="pipeline-list-header">
          <div>
            <h3>
              {pipeline?.pipeline_name ||
                "Pipeline"}
            </h3>

            <span>
              {totalVisibleDeals}{" "}
              {totalVisibleDeals === 1
                ? "deal"
                : "deals"}
            </span>
          </div>

          {onAddStage && (
            <button
              type="button"
              className="pipeline-list-add-stage-btn"
              onClick={onAddStage}
            >
              <span>+</span>
              Add Stage
            </button>
          )}
        </div>

        {totalVisibleDeals === 0 ? (
          <div className="pipeline-board-empty">
            <div className="pipeline-board-empty-icon">
              +
            </div>

            <h3>No deals found</h3>

            <p>
              There are no deals matching the
              current filters.
            </p>
          </div>
        ) : (
          <div className="pipeline-list-container">
            <table className="pipeline-list-table">
              <thead>
                <tr>
                  <th>Deal</th>
                  <th>Stage</th>
                  <th>Value</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Email</th>
                </tr>
              </thead>

              <tbody>
                {stages.flatMap((stage) =>
                  stage.deals.map((deal) => (
                    <tr
                      key={`${stage.stage_id}-${deal.deal_id}`}
                      onClick={() =>
                        navigate(
                          `/deals/${deal.deal_id}`
                        )
                      }
                    >
                      <td>
                        <strong>
                          {deal.deal_name ||
                            "Untitled Deal"}
                        </strong>
                      </td>

                      <td>
                        <span className="pipeline-list-stage">
                          {stage.stage_name}
                        </span>
                      </td>

                      <td>
                        {deal.deal_value !==
                          null &&
                        deal.deal_value !==
                          undefined &&
                        deal.deal_value !== ""
                          ? formatCurrency(
                              Number(
                                deal.deal_value
                              )
                            )
                          : "No value"}
                      </td>

                      <td>
                        {deal.deal_owner ||
                          "Unassigned"}
                      </td>

                      <td>
                        <span
                          className={[
                            "pipeline-list-status",
                            String(
                              deal.deal_status ||
                                "Open"
                            )
                              .toLowerCase()
                              .replace(
                                /\s+/g,
                                "-"
                              ),
                          ].join(" ")}
                        >
                          {deal.deal_status ||
                            "Open"}
                        </span>
                      </td>

                      <td>
                        {deal.deal_priority ||
                          "Medium"}
                      </td>

                      <td>
                        {deal.customer_email ||
                          "—"}
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

  /*
   * =====================================================
   * BOARD VIEW
   * =====================================================
   */

  return (
    <div className="pipeline-board-wrapper">

      {error && (
        <div className="pipeline-board-error">
          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            ×
          </button>
        </div>
      )}

      {reorderingStages && (
        <div className="pipeline-reorder-status">
          Saving stage order...
        </div>
      )}

      {stages.length === 0 ? (
        <div className="pipeline-board-empty">

          <div className="pipeline-board-empty-icon">
            +
          </div>

          <h3>No stages found</h3>

          <p>
            This pipeline does not have any
            stages yet.
          </p>

          {onAddStage && (
            <button
              type="button"
              className="pipeline-add-stage-empty-btn"
              onClick={onAddStage}
            >
              <span>+</span>
              Add Stage
            </button>
          )}
        </div>
      ) : (
        <div className="pipeline-board">

          {stages.map((stage, index) => {
            const deals = Array.isArray(
              stage.deals
            )
              ? stage.deals
              : [];

            const stageValue =
              getStageValue(deals);

            const isDraggedStage =
              String(draggedStageId) ===
              String(stage.stage_id);

            return (
              <div
                className={[
                  "pipeline-column",

                  draggedDealId
                    ? "pipeline-column-drag-active"
                    : "",

                  isDraggedStage
                    ? "pipeline-column-stage-dragging"
                    : "",
                ]
                  .filter(Boolean)
                  .join(" ")}

                key={stage.stage_id}

                onDragOver={
                  handleDragOver
                }

                onDrop={(event) =>
                  handleDrop(
                    event,
                    stage
                  )
                }
              >

                {/* =================================================
                    STAGE HEADER
                ================================================= */}

                <div className="pipeline-column-header">

                  <div className="pipeline-column-title-row">

                    {/* Stage Drag Handle */}

                    <div
                      className="pipeline-stage-drag-handle"
                      draggable={
                        !reorderingStages
                      }
                      onDragStart={(event) =>
                        handleStageDragStart(
                          event,
                          stage
                        )
                      }
                      onDragEnd={
                        handleStageDragEnd
                      }
                      title="Drag to reorder stage"
                    >
                      ⋮⋮
                    </div>

                    <div className="pipeline-column-title">

                      <h3>
                        {stage.stage_name ||
                          "Unnamed Stage"}
                      </h3>

                      <span className="pipeline-stage-count">
                        {deals.length}
                      </span>

                    </div>

                    {/* Stage Actions */}

                    <div className="pipeline-stage-actions">

                      {onEditStage && (
                        <button
                          type="button"
                          className="pipeline-stage-action-btn"
                          onClick={(event) =>
                            handleEditStageClick(
                              event,
                              stage
                            )
                          }
                          title="Edit stage"
                        >
                          ✎
                        </button>
                      )}

                      {onDeleteStage && (
                        <button
                          type="button"
                          className="pipeline-stage-action-btn pipeline-stage-delete-btn"
                          onClick={(event) =>
                            handleDeleteStageClick(
                              event,
                              stage
                            )
                          }
                          title="Delete stage"
                        >
                          ×
                        </button>
                      )}

                    </div>
                  </div>

                  <div className="pipeline-column-meta">
                    <span>
                      {formatCurrency(
                        stageValue
                      )}
                    </span>
                  </div>

                </div>

                {/* =================================================
                    DEALS
                ================================================= */}

                <div className="pipeline-column-body">

                  {deals.length === 0 ? (
                    <div className="pipeline-stage-empty">

                      <div className="pipeline-stage-empty-text">
                        No deals in this stage
                      </div>

                      <button
                        type="button"
                        className="pipeline-add-deal-btn"
                        onClick={() =>
                          handleAddDeal(
                            stage
                          )
                        }
                      >
                        <span>+</span>
                        Add Deal
                      </button>

                    </div>
                  ) : (
                    <>
                      {deals.map((deal) => (
                        <PipelineDealCard
                          key={deal.deal_id}
                          deal={deal}
                          onDragStart={
                            handleDealDragStart
                          }
                          onDragEnd={
                            handleDealDragEnd
                          }
                          updating={
                            String(
                              updatingDealId
                            ) ===
                            String(
                              deal.deal_id
                            )
                          }
                        />
                      ))}

                      <button
                        type="button"
                        className="pipeline-add-deal-btn pipeline-add-deal-btn-bottom"
                        onClick={() =>
                          handleAddDeal(
                            stage
                          )
                        }
                      >
                        <span>+</span>
                        Add Deal
                      </button>
                    </>
                  )}

                </div>
              </div>
            );
          })}

          {/* =================================================
              ADD STAGE
          ================================================= */}

          {onAddStage && (
            <button
              type="button"
              className="pipeline-add-stage-btn"
              onClick={onAddStage}
            >
              <span>+</span>
              Add Stage
            </button>
          )}

        </div>
      )}
    </div>
  );
}

export default PipelineBoard;