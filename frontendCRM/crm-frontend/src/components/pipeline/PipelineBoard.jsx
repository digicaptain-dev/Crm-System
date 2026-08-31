import { useEffect, useState } from "react";
import api from "../../services/api";

import PipelineDealCard from "./PipelineDealCard";

import "../../styles/pipeline/pipeline-board.css";

function PipelineBoard({ pipeline }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [draggedDeal, setDraggedDeal] = useState(null);
  const [updatingDealId, setUpdatingDealId] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // =====================================================
  // GET DEALS
  // =====================================================

  const fetchDeals = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/deals");

      console.log("Pipeline deals response:", response.data);

      const fetchedDeals =
        response.data?.deals ||
        response.data ||
        [];

      setDeals(
        Array.isArray(fetchedDeals)
          ? fetchedDeals
          : []
      );

    } catch (error) {
      console.error(
        "Failed to fetch pipeline deals:",
        error
      );

      setError(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to load deals."
      );

    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD DEALS
  // =====================================================

  useEffect(() => {
    if (!pipeline?.pipeline_id) {
      setDeals([]);
      return;
    }

    fetchDeals();
  }, [pipeline?.pipeline_id]);

  // =====================================================
  // CLEAR SUCCESS MESSAGE
  // =====================================================

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timer = setTimeout(() => {
      setSuccessMessage("");
    }, 2500);

    return () => clearTimeout(timer);
  }, [successMessage]);

  // =====================================================
  // DRAG START
  // =====================================================

  const handleDragStart = (deal) => {
    console.log("Drag started:", deal);

    setDraggedDeal(deal);
    setError("");
    setSuccessMessage("");
  };

  // =====================================================
  // DRAG END
  // =====================================================

  const handleDragEnd = () => {
    console.log("Drag ended");

    setDraggedDeal(null);
  };

  // =====================================================
  // DRAG OVER
  // =====================================================

  const handleDragOver = (event) => {
    event.preventDefault();

    event.dataTransfer.dropEffect = "move";
  };

  // =====================================================
  // DROP DEAL
  // =====================================================

  const handleDrop = async (event, targetStage) => {
    event.preventDefault();

    if (!draggedDeal) {
      return;
    }

    if (!targetStage?.stage_id) {
      console.error(
        "Target stage does not contain stage_id:",
        targetStage
      );

      return;
    }

    const dealId = draggedDeal.deal_id;

    const oldStage =
      draggedDeal.deal_stage;

    const newStage =
      targetStage.stage_id;

    // ---------------------------------------------
    // Prevent unnecessary API request
    // ---------------------------------------------

    if (
      String(oldStage) ===
      String(newStage)
    ) {
      setDraggedDeal(null);
      return;
    }

    console.log(
      "Moving deal:",
      dealId,
      "from:",
      oldStage,
      "to:",
      newStage
    );

    // ---------------------------------------------
    // Save original deals for rollback
    // ---------------------------------------------

    const previousDeals = [...deals];

    // ---------------------------------------------
    // Optimistic UI update
    // ---------------------------------------------

    setDeals((currentDeals) =>
      currentDeals.map((deal) =>
        deal.deal_id === dealId
          ? {
              ...deal,
              deal_stage: newStage,
            }
          : deal
      )
    );

    setDraggedDeal(null);
    setUpdatingDealId(dealId);
    setError("");

    try {
      // -------------------------------------------
      // UPDATE BACKEND
      // -------------------------------------------

      const response = await api.put(
        `/deals/${dealId}/stage`,
        {
          deal_stage: newStage,
        }
      );

      console.log(
        "Stage update response:",
        response.data
      );

      if (
        response.data &&
        response.data.success === false
      ) {
        throw new Error(
          response.data.message ||
          "Failed to update deal stage."
        );
      }

      // -------------------------------------------
      // Update frontend using backend response
      // -------------------------------------------

      if (response.data?.deal) {
        setDeals((currentDeals) =>
          currentDeals.map((deal) =>
            deal.deal_id === dealId
              ? {
                  ...deal,
                  ...response.data.deal,
                }
              : deal
          )
        );
      }

      setSuccessMessage(
        "Deal stage updated successfully."
      );

    } catch (error) {
      console.error(
        "Failed to update deal stage:",
        error
      );

      // -------------------------------------------
      // ROLLBACK UI
      // -------------------------------------------

      setDeals(previousDeals);

      setError(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to update deal stage."
      );

    } finally {
      setUpdatingDealId(null);
    }
  };

  // =====================================================
  // GET DEALS FOR STAGE
  // =====================================================

  const getDealsForStage = (stageId) => {
    return deals.filter(
      (deal) =>
        String(deal.deal_stage) ===
        String(stageId) &&
        String(deal.pipeline_id) ===
        String(pipeline?.pipeline_id)
    );
  };

  // =====================================================
  // NO PIPELINE
  // =====================================================

  if (!pipeline) {
    return (
      <div className="pipeline-board-empty">
        <h3>No pipeline selected</h3>

        <p>
          Select a pipeline to view its deals.
        </p>
      </div>
    );
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="pipeline-board-loading">
        Loading deals...
      </div>
    );
  }

  // =====================================================
  // GET STAGES
  // =====================================================

  const stages = Array.isArray(
    pipeline.stages
  )
    ? pipeline.stages
    : [];

  // =====================================================
  // NO STAGES
  // =====================================================

  if (stages.length === 0) {
    return (
      <div className="pipeline-board-empty">
        <h3>No stages found</h3>

        <p>
          This pipeline does not have any stages.
        </p>
      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="pipeline-board-wrapper">

      {/* =================================================
          MESSAGES
      ================================================= */}

      {error && (
        <div className="pipeline-board-error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="pipeline-board-success">
          {successMessage}
        </div>
      )}

      {/* =================================================
          BOARD
      ================================================= */}

      <div className="pipeline-board">

        {stages.map((stage) => {

          const stageDeals =
            getDealsForStage(
              stage.stage_id
            );

          return (
            <div
              className={[
                "pipeline-stage",
                draggedDeal
                  ? "pipeline-stage-drag-active"
                  : "",
              ].join(" ")}
              key={stage.stage_id}
              onDragOver={handleDragOver}
              onDrop={(event) =>
                handleDrop(
                  event,
                  stage
                )
              }
            >

              {/* =======================================
                  STAGE HEADER
              ======================================= */}

              <div className="pipeline-stage-header">

                <div className="pipeline-stage-title">
                  <h3>
                    {stage.stage_name ||
                      "Untitled Stage"}
                  </h3>

                  <span className="pipeline-stage-count">
                    {stageDeals.length}
                  </span>
                </div>

              </div>

              {/* =======================================
                  DEALS
              ======================================= */}

              <div className="pipeline-stage-deals">

                {stageDeals.length === 0 ? (

                  <div className="pipeline-stage-empty">

                    {draggedDeal ? (
                      <span>
                        Drop deal here
                      </span>
                    ) : (
                      <span>
                        No deals
                      </span>
                    )}

                  </div>

                ) : (

                  stageDeals.map((deal) => (

                    <PipelineDealCard
                      key={deal.deal_id}
                      deal={deal}
                      onDragStart={
                        handleDragStart
                      }
                      onDragEnd={
                        handleDragEnd
                      }
                      updating={
                        updatingDealId ===
                        deal.deal_id
                      }
                    />

                  ))

                )}

              </div>

            </div>
          );
        })}

      </div>

    </div>
  );
}

export default PipelineBoard;