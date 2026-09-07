import {
  useEffect,
  useMemo,
  useState,
} from "react";

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

  const [draggedDealId, setDraggedDealId] =
    useState(null);

  const [updatingDealId, setUpdatingDealId] =
    useState(null);

  const [draggedStageId, setDraggedStageId] =
    useState(null);

  const [reorderingStages, setReorderingStages] =
    useState(false);

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
      const value = Number(
        deal?.deal_value
      );

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

  const handleStageDragStart = (
    event,
    stage
  ) => {
    if (!stage?.stage_id) {
      return;
    }

    setDraggedStageId(stage.stage_id);
    setDraggedDealId(null);
    setError("");

    event.dataTransfer.effectAllowed =
      "move";

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

    event.dataTransfer.dropEffect =
      "move";
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

    const sourceIndex =
      stages.findIndex(
        (stage) =>
          String(stage.stage_id) ===
          String(sourceStageId)
      );

    const targetIndex =
      stages.findIndex(
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
      if (onReorderStages) {
        await onReorderStages(
          normalizedStages
        );
      }
    } catch (err) {
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
     * Optimistic UI update
     */

    setStages((previousStages) =>
      previousStages.map((stage) => {
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
       * Rollback
       */

      setStages((previousStages) =>
        previousStages.map((stage) => {
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
   * COMBINED DROP
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
      <div className="pipeline-board-wrapper pipeline-list-wrapper">

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
                          `/deal/${deal.deal_id}`
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
        /*
         * IMPORTANT:
         *
         * pipeline-board-wrapper = scroll container
         * pipeline-board         = wide track
         */

        <div className="pipeline-board">

          {stages.map((stage) => {
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

                  <div className="pipeline-stage-header-row">

                    {/* DRAG HANDLE */}

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
                      aria-label="Drag to reorder stage"
                    >
                      <span className="pipeline-drag-dots">
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                        <span />
                      </span>
                    </div>

                    {/* STAGE NAME */}

                    <h3 className="pipeline-column-title">
                      {stage.stage_name ||
                        "Unnamed Stage"}
                    </h3>

                    {/* DEAL COUNT */}

                    <span className="pipeline-stage-count">
                      {deals.length}
                    </span>

                    {/* ACTIONS */}

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
                          aria-label="Edit stage"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              d="M12 20h9"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />

                            <path
                              d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinejoin="round"
                            />
                          </svg>
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
                          aria-label="Delete stage"
                        >
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              d="M4 7h16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />

                            <path
                              d="M9 7V4h6v3"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            <path
                              d="M7 7l1 13h8l1-13"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinejoin="round"
                            />

                            <path
                              d="M10 11v5M14 11v5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                            />
                          </svg>
                        </button>
                      )}

                    </div>
                  </div>

                  {/* STAGE VALUE */}

                  <div className="pipeline-column-meta">
                    {formatCurrency(stageValue)}
                  </div>
                </div>

                {/* =================================================
                    DEALS
                ================================================= */}

                <div className="pipeline-column-body">

                  {deals.length === 0 ? (
                    <div className="pipeline-stage-empty">

                      <div className="pipeline-stage-empty-icon">
                        <svg
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <rect
                            x="5"
                            y="4"
                            width="14"
                            height="16"
                            rx="2"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                          />

                          <path
                            d="M9 9h6M9 13h6M9 17h3"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>

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
            <div className="pipeline-add-stage-column">

              <div className="pipeline-add-stage-header">

                <div className="pipeline-add-stage-title-row">

                  <span className="pipeline-stage-drag-placeholder">
                    <span className="pipeline-drag-dots">
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                      <span />
                    </span>
                  </span>

                  <span className="pipeline-add-stage-title">
                    Add Stage
                  </span>

                </div>
              </div>

              <button
                type="button"
                className="pipeline-add-stage-content"
                onClick={onAddStage}
                aria-label="Add new stage"
              >
                <span className="pipeline-add-stage-icon">
                  <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 5v14M5 12h14"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>

                <strong>
                  Add Stage
                </strong>

                <span>
                  Create a new stage to
                  track your deals.
                </span>

                <span className="pipeline-add-stage-action">
                  <span>+</span>
                  Add Stage
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PipelineBoard;