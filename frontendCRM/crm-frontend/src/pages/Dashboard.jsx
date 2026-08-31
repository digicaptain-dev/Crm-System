import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

import DealCard from "../components/deals/DealCard";
import DealTable from "../components/deals/DealTable";
import CreateDeal from "../components/deals/CreateDeal";
import Modal from "../components/common/Modal";

import "../styles/dashboard/dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] =
    useState("");

  const [deals, setDeals] = useState([]);

  const [view, setView] = useState("kanban");

  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] =
    useState(false);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // =====================================================
  // FETCH PIPELINES
  // =====================================================

  const fetchPipelines = async () => {
    try {
      const response = await api.get("/pipelines");

      console.log(
        "Dashboard pipelines:",
        response.data
      );

      const pipelineData =
        Array.isArray(response.data)
          ? response.data
          : [];

      setPipelines(pipelineData);

      /*
       * Select first pipeline automatically
       */
      if (
        pipelineData.length > 0 &&
        !selectedPipelineId
      ) {
        setSelectedPipelineId(
          pipelineData[0].pipeline_id
        );
      }
    } catch (err) {
      console.error(
        "Dashboard pipeline error:",
        err
      );

      throw err;
    }
  };

  // =====================================================
  // FETCH DEALS
  // =====================================================

  const fetchDeals = async () => {
    try {
      const response = await api.get("/deals");

      console.log(
        "Dashboard deals:",
        response.data
      );

      const dealData =
        Array.isArray(response.data)
          ? response.data
          : [];

      setDeals(dealData);
    } catch (err) {
      console.error(
        "Dashboard deals error:",
        err
      );

      throw err;
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        await Promise.all([
          fetchPipelines(),
          fetchDeals(),
        ]);
      } catch (err) {
        setError(
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // =====================================================
  // SELECTED PIPELINE
  // =====================================================

  const selectedPipeline = useMemo(() => {
    return pipelines.find(
      (pipeline) =>
        pipeline.pipeline_id ===
        selectedPipelineId
    );
  }, [
    pipelines,
    selectedPipelineId,
  ]);

  // =====================================================
  // PIPELINE DEALS
  // =====================================================

  /*
   * /pipelines already returns:
   *
   * pipeline
   *   └── stages
   *        └── deals
   *
   * We use /deals as the main source because it
   * contains the complete deal records.
   *
   * Then filter them by selected pipeline.
   */

  const pipelineDeals = useMemo(() => {
    if (!selectedPipelineId) {
      return [];
    }

    return deals.filter(
      (deal) =>
        String(deal.pipeline_id) ===
        String(selectedPipelineId)
    );
  }, [
    deals,
    selectedPipelineId,
  ]);

  // =====================================================
  // SEARCH
  // =====================================================

  const filteredDeals = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    if (!searchValue) {
      return pipelineDeals;
    }

    return pipelineDeals.filter((deal) => {
      return `
        ${deal.deal_name || ""}
        ${deal.customer_email || ""}
        ${deal.deal_owner || ""}
        ${deal.deal_status || ""}
        ${deal.deal_priority || ""}
      `
        .toLowerCase()
        .includes(searchValue);
    });
  }, [
    pipelineDeals,
    search,
  ]);

  // =====================================================
  // DEAL CLICK
  // =====================================================

  const handleDealClick = (deal) => {
    if (!deal?.deal_id) {
      return;
    }

    navigate(
      `/deals/${deal.deal_id}`
    );
  };

  // =====================================================
  // CREATE DEAL
  // =====================================================

  const handleCreateDeal = async () => {
    /*
     * CreateDeal is responsible for creating the deal.
     *
     * After successful creation we fetch fresh data
     * from backend so Dashboard stays synchronized
     * with MySQL.
     */

    try {
      await fetchDeals();
      await fetchPipelines();

      setShowCreate(false);
    } catch (err) {
      console.error(
        "Refresh after deal creation failed:",
        err
      );

      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Deal created but dashboard refresh failed."
      );
    }
  };

  // =====================================================
  // REFRESH DASHBOARD
  // =====================================================

  const handleRefresh = async () => {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        fetchPipelines(),
        fetchDeals(),
      ]);
    } catch (err) {
      console.error(
        "Dashboard refresh error:",
        err
      );

      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to refresh dashboard"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="dashboard">

        <div className="dashboard-loading">
          <div className="loading-spinner" />
          <p>
            Loading dashboard...
          </p>
        </div>

      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="dashboard">

      {/* =================================================
          HEADER / TOOLBAR
      ================================================= */}

      <div className="dashboard-toolbar">

        <div className="pipeline-selector">

          <label htmlFor="pipeline-select">
            Pipeline:
          </label>

          <select
            id="pipeline-select"
            value={selectedPipelineId}
            onChange={(e) =>
              setSelectedPipelineId(
                e.target.value
              )
            }
          >

            {pipelines.length === 0 ? (
              <option value="">
                No pipelines
              </option>
            ) : (
              pipelines.map(
                (pipeline) => (
                  <option
                    key={
                      pipeline.pipeline_id
                    }
                    value={
                      pipeline.pipeline_id
                    }
                  >
                    {pipeline.pipeline_name}
                  </option>
                )
              )
            )}

          </select>

        </div>

        <div className="quick-actions">

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate("/deals")
            }
          >
            View All Deals
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={handleRefresh}
            disabled={loading}
          >
            ↻ Refresh
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() =>
              navigate("/deals")
            }
          >
            Upload Deals
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={() =>
              setShowCreate(true)
            }
          >
            + Add Deal
          </button>

        </div>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="dashboard-error">

          <span>
            {error}
          </span>

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

      {/* =================================================
          PIPELINE SUMMARY
      ================================================= */}

      <div className="dashboard-summary">

        <div className="summary-card">

          <span className="summary-label">
            Pipeline
          </span>

          <strong>
            {selectedPipeline?.pipeline_name ||
              "No Pipeline"}
          </strong>

        </div>

        <div className="summary-card">

          <span className="summary-label">
            Total Deals
          </span>

          <strong>
            {pipelineDeals.length}
          </strong>

        </div>

        <div className="summary-card">

          <span className="summary-label">
            Open Deals
          </span>

          <strong>
            {
              pipelineDeals.filter(
                (deal) =>
                  deal.deal_status ===
                  "Open"
              ).length
            }
          </strong>

        </div>

        <div className="summary-card">

          <span className="summary-label">
            Won Deals
          </span>

          <strong>
            {
              pipelineDeals.filter(
                (deal) =>
                  deal.deal_status ===
                  "Won"
              ).length
            }
          </strong>

        </div>

        <div className="summary-card">

          <span className="summary-label">
            Pipeline Value
          </span>

          <strong>
            $
            {pipelineDeals
              .reduce(
                (total, deal) =>
                  total +
                  Number(
                    deal.deal_value || 0
                  ),
                0
              )
              .toLocaleString()}
          </strong>

        </div>

      </div>

      {/* =================================================
          SEARCH + VIEW CONTROLS
      ================================================= */}

      <div className="deals-controls">

        <div className="dashboard-search">

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search deals..."
          />

        </div>

        <div className="view-toggle">

          <button
            type="button"
            className={
              view === "kanban"
                ? "view-button active"
                : "view-button"
            }
            onClick={() =>
              setView("kanban")
            }
          >
            Kanban
          </button>

          <button
            type="button"
            className={
              view === "table"
                ? "view-button active"
                : "view-button"
            }
            onClick={() =>
              setView("table")
            }
          >
            Table
          </button>

        </div>

      </div>

      {/* =================================================
          NO PIPELINE
      ================================================= */}

      {!selectedPipeline ? (

        <div className="dashboard-empty">

          <div className="dashboard-empty-icon">
            📊
          </div>

          <h2>
            No pipeline available
          </h2>

          <p>
            Create a pipeline first to
            start managing your deals.
          </p>

        </div>

      ) : view === "kanban" ? (

        /* =================================================
           KANBAN
        ================================================= */

        <div className="pipeline-board">

          {selectedPipeline.stages?.map(
            (stage) => {

              const stageDeals =
                filteredDeals.filter(
                  (deal) =>
                    String(
                      deal.deal_stage
                    ) ===
                    String(
                      stage.stage_id
                    )
                );

              return (
                <div
                  className="stage"
                  key={stage.stage_id}
                >

                  {/* Stage Header */}

                  <div className="stage-header">

                    <div className="stage-name">
                      {stage.stage_name}
                    </div>

                    <span className="stage-count">
                      {stageDeals.length}
                    </span>

                  </div>

                  {/* Stage Deals */}

                  <div className="stage-deals">

                    {stageDeals.length ===
                      0 ? (

                      <div className="stage-empty">
                        No deals
                      </div>

                    ) : (

                      stageDeals.map(
                        (deal) => (
                          <DealCard
                            key={deal.deal_id}
                            deal={deal}
                          />
                        )
                      )

                    )}

                  </div>

                </div>
              );
            }
          )}

        </div>

      ) : (

        /* =================================================
           TABLE
        ================================================= */

        <DealTable
          deals={filteredDeals}
          onDealClick={handleDealClick}
        />

      )}

      {/* =================================================
          CREATE DEAL MODAL
      ================================================= */}

      {showCreate && (

        <Modal
          title="Create Deal"
          onClose={() =>
            setShowCreate(false)
          }
        >

          <CreateDeal
            onClose={() =>
              setShowCreate(false)
            }
            onCreate={
              handleCreateDeal
            }
          />

        </Modal>

      )}

    </div>
  );
}

export default Dashboard;