import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

import DealCard from "../components/deals/DealCard";
import DealTable from "../components/deals/DealTable";
import CreateDeal from "../components/deals/CreateDeal";
import Modal from "../components/common/Modal";

import "../styles/dashboard/dashboard.css";

// Dynamic stage color palette
const STAGE_THEMES = [
  { accent: "#3b82f6", bg: "rgba(59, 130, 246, 0.08)", text: "#1d4ed8", border: "#bfdbfe" },
  { accent: "#8b5cf6", bg: "rgba(139, 92, 246, 0.08)", text: "#6d28d9", border: "#ddd6fe" },
  { accent: "#06b6d4", bg: "rgba(6, 182, 212, 0.08)", text: "#0e7490", border: "#a5f3fc" },
  { accent: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)", text: "#b45309", border: "#fde68a" },
  { accent: "#ec4899", bg: "rgba(236, 72, 153, 0.08)", text: "#be185d", border: "#fbcfe8" },
  { accent: "#10b981", bg: "rgba(16, 185, 129, 0.08)", text: "#047857", border: "#a7f3d0" },
];

function Dashboard() {
  const navigate = useNavigate();

  // =====================================================
  // STATE
  // =====================================================

  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState("");
  const [deals, setDeals] = useState([]);
  const [view, setView] = useState("kanban"); // "kanban" | "table"
  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [createStageId, setCreateStageId] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [dragOverStageId, setDragOverStageId] = useState(null);

  // =====================================================
  // FETCH PIPELINES
  // =====================================================

  const fetchPipelines = useCallback(async () => {
    try {
      const response = await api.get("/pipelines");
      const pipelineData = Array.isArray(response.data)
        ? response.data
        : response.data?.pipelines || [];

      setPipelines(pipelineData);

      if (pipelineData.length > 0) {
        setSelectedPipelineId((currentId) => {
          const exists = pipelineData.some(
            (p) => String(p.pipeline_id) === String(currentId)
          );
          return exists ? currentId : pipelineData[0].pipeline_id;
        });
      }
      return pipelineData;
    } catch (err) {
      console.error("Dashboard pipeline error:", err);
      throw err;
    }
  }, []);

  // =====================================================
  // FETCH DEALS
  // =====================================================

  const fetchDeals = useCallback(async () => {
    try {
      // Request larger limit to have full pipeline data on board
      const response = await api.get("/deals?limit=1000&page=1");
      const dealData = Array.isArray(response.data)
        ? response.data
        : response.data?.deals || [];

      setDeals(dealData);
      return dealData;
    } catch (err) {
      console.error("Dashboard deals error:", err);
      throw err;
    }
  }, []);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");
        await Promise.all([fetchPipelines(), fetchDeals()]);
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
  }, [fetchPipelines, fetchDeals]);

  // =====================================================
  // REFRESH DASHBOARD
  // =====================================================

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError("");
      await Promise.all([fetchPipelines(), fetchDeals()]);
    } catch (err) {
      console.error("Dashboard refresh error:", err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to refresh dashboard"
      );
    } finally {
      setRefreshing(false);
    }
  };

  // =====================================================
  // SELECTED PIPELINE & STAGES
  // =====================================================

  const selectedPipeline = useMemo(() => {
    return (
      pipelines.find(
        (p) => String(p.pipeline_id) === String(selectedPipelineId)
      ) || pipelines[0] || null
    );
  }, [pipelines, selectedPipelineId]);

  // Sorted stages for selected pipeline
  const pipelineStages = useMemo(() => {
    if (!selectedPipeline?.stages) return [];
    return [...selectedPipeline.stages].sort(
      (a, b) => (a.stage_order || 0) - (b.stage_order || 0)
    );
  }, [selectedPipeline]);

  // =====================================================
  // PIPELINE DEALS
  // =====================================================

  const pipelineDeals = useMemo(() => {
    if (!selectedPipelineId) return deals;

    return deals.filter(
      (deal) => String(deal.pipeline_id) === String(selectedPipelineId)
    );
  }, [deals, selectedPipelineId]);

  // =====================================================
  // SEARCH FILTER
  // =====================================================

  const filteredDeals = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return pipelineDeals;

    return pipelineDeals.filter((deal) => {
      return (
        (deal.deal_name || "").toLowerCase().includes(query) ||
        (deal.deal_organization || "").toLowerCase().includes(query) ||
        (deal.customer_email || "").toLowerCase().includes(query) ||
        (deal.deal_owner || "").toLowerCase().includes(query) ||
        (deal.deal_status || "").toLowerCase().includes(query) ||
        (deal.deal_priority || "").toLowerCase().includes(query)
      );
    });
  }, [pipelineDeals, search]);

  // =====================================================
  // SUMMARY METRICS
  // =====================================================

  const stats = useMemo(() => {
    const total = pipelineDeals.length;
    const openDeals = pipelineDeals.filter(
      (d) => !d.deal_status || d.deal_status.toLowerCase() === "open"
    );
    const wonDeals = pipelineDeals.filter(
      (d) => d.deal_status && d.deal_status.toLowerCase() === "won"
    );
    const lostDeals = pipelineDeals.filter(
      (d) => d.deal_status && d.deal_status.toLowerCase() === "lost"
    );

    const totalValue = pipelineDeals.reduce(
      (sum, d) => sum + Number(d.deal_value || 0),
      0
    );

    const openValue = openDeals.reduce(
      (sum, d) => sum + Number(d.deal_value || 0),
      0
    );

    const wonValue = wonDeals.reduce(
      (sum, d) => sum + Number(d.deal_value || 0),
      0
    );

    const winRate = total > 0 ? Math.round((wonDeals.length / total) * 100) : 0;
    const avgDeal = total > 0 ? Math.round(totalValue / total) : 0;

    return {
      total,
      openCount: openDeals.length,
      openValue,
      wonCount: wonDeals.length,
      wonValue,
      lostCount: lostDeals.length,
      totalValue,
      avgDeal,
      winRate,
    };
  }, [pipelineDeals]);

  // =====================================================
  // DEAL DRAG & DROP (KANBAN)
  // =====================================================

  const handleDragStart = (e, deal) => {
    e.dataTransfer.setData("text/plain", String(deal.deal_id));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverStageId !== stageId) {
      setDragOverStageId(stageId);
    }
  };

  const handleDragLeave = (e, stageId) => {
    if (dragOverStageId === stageId) {
      setDragOverStageId(null);
    }
  };

  const handleDrop = async (e, targetStageId) => {
    e.preventDefault();
    setDragOverStageId(null);

    const dealId = e.dataTransfer.getData("text/plain");
    if (!dealId) return;

    const currentDeal = deals.find((d) => String(d.deal_id) === String(dealId));
    if (!currentDeal || String(currentDeal.deal_stage) === String(targetStageId)) {
      return;
    }

    // Optimistic UI update
    setDeals((prevDeals) =>
      prevDeals.map((d) =>
        String(d.deal_id) === String(dealId)
          ? { ...d, deal_stage: targetStageId }
          : d
      )
    );

    try {
      await api.put(`/deal/${dealId}`, {
        deal_stage: Number(targetStageId),
      });
    } catch (err) {
      console.error("Failed to update deal stage:", err);
      // Revert on failure
      fetchDeals();
      setError("Failed to move deal stage. Changes reverted.");
    }
  };

  // =====================================================
  // ACTIONS
  // =====================================================

  const handleDealClick = (deal) => {
    if (deal?.deal_id) {
      navigate(`/deal/${deal.deal_id}`);
    }
  };

  const openCreateModal = (stageId = "") => {
    setCreateStageId(stageId);
    setShowCreate(true);
  };

  const handleCreateDeal = async (dealData) => {
    try {
      await api.post("/deal", dealData);
      await fetchDeals();
      await fetchPipelines();
      setShowCreate(false);
    } catch (err) {
      console.error("Deal creation error:", err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to create deal."
      );
    }
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading-state">
          <div className="dashboard-spinner" />
          <h3>Loading your CRM Dashboard...</h3>
          <p>Fetching pipelines, active deals, and sales metrics.</p>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="dashboard-container">
      {/* =================================================
          TOP HERO / TOOLBAR
      ================================================= */}
      <div className="dashboard-header-card">
        <div className="dashboard-title-area">
          <div className="dashboard-badge-pill">
            <span className="live-dot" /> Live Pipeline Overview
          </div>
          <h1 className="dashboard-title">Deals Dashboard</h1>
          <p className="dashboard-subtitle">
            Track revenue, prioritize high-value leads, and advance deals through your pipeline stages.
          </p>
        </div>

        <div className="dashboard-header-actions">
          {/* Pipeline Selector */}
          <div className="pipeline-selector-pill">
            <svg
              className="selector-icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <span className="selector-label">Pipeline:</span>
            <select
              id="pipeline-select"
              className="pipeline-select-input"
              value={selectedPipelineId}
              onChange={(e) => setSelectedPipelineId(e.target.value)}
            >
              {pipelines.length === 0 ? (
                <option value="">No pipelines</option>
              ) : (
                pipelines.map((pipeline) => (
                  <option
                    key={pipeline.pipeline_id}
                    value={pipeline.pipeline_id}
                  >
                    {pipeline.pipeline_name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="action-button-group">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/deals")}
              title="View deal records in full database"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
              </svg>
              View All Deals
            </button>

            <button
              type="button"
              className={`btn-secondary ${refreshing ? "is-refreshing" : ""}`}
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh deals data"
            >
              <svg
                className={`refresh-icon ${refreshing ? "spin-animation" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              Refresh
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate("/deals")}
              title="Import deals from CSV"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Upload Deals
            </button>

            <button
              type="button"
              className="btn-primary"
              onClick={() => openCreateModal()}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              + Add Deal
            </button>
          </div>
        </div>
      </div>

      {/* =================================================
          ERROR ALERT
      ================================================= */}
      {error && (
        <div className="dashboard-alert-banner">
          <div className="alert-content">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            type="button"
            className="alert-close"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* =================================================
          KPI STATS CARDS (5 Cards Grid)
      ================================================= */}
      <div className="kpi-grid">
        {/* 1. Active Pipeline */}
        <div className="kpi-card card-pipeline">
          <div className="kpi-top">
            <span className="kpi-label">Current Pipeline</span>
            <div className="kpi-icon-pill icon-indigo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
          </div>
          <div className="kpi-value-title">
            {selectedPipeline?.pipeline_name || "No Pipeline"}
          </div>
          <div className="kpi-meta">
            <span className="kpi-sub-badge">
              {pipelineStages.length} Active Stages
            </span>
          </div>
        </div>

        {/* 2. Total Deals */}
        <div className="kpi-card card-total">
          <div className="kpi-top">
            <span className="kpi-label">Total Deals</span>
            <div className="kpi-icon-pill icon-blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
          </div>
          <div className="kpi-value">{stats.total}</div>
          <div className="kpi-meta">
            <span className="kpi-sub-text">In this sales pipeline</span>
          </div>
        </div>

        {/* 3. Open Deals */}
        <div className="kpi-card card-open">
          <div className="kpi-top">
            <span className="kpi-label">Open Deals</span>
            <div className="kpi-icon-pill icon-amber">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
          </div>
          <div className="kpi-value">{stats.openCount}</div>
          <div className="kpi-meta">
            <span className="kpi-sub-text">
              Value: ${stats.openValue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 4. Won Deals */}
        <div className="kpi-card card-won">
          <div className="kpi-top">
            <span className="kpi-label">Won Deals</span>
            <div className="kpi-icon-pill icon-emerald">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
          </div>
          <div className="kpi-value">{stats.wonCount}</div>
          <div className="kpi-meta">
            <span className="kpi-sub-pill win-rate-pill">
              {stats.winRate}% Win Rate
            </span>
          </div>
        </div>

        {/* 5. Pipeline Value */}
        <div className="kpi-card card-value">
          <div className="kpi-top">
            <span className="kpi-label">Pipeline Value</span>
            <div className="kpi-icon-pill icon-violet">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
          </div>
          <div className="kpi-value value-highlight">
            ${stats.totalValue.toLocaleString()}
          </div>
          <div className="kpi-meta">
            <span className="kpi-sub-text">
              Avg: ${stats.avgDeal.toLocaleString()} / deal
            </span>
          </div>
        </div>
      </div>

      {/* =================================================
          FILTER BAR & VIEW TOGGLE
      ================================================= */}
      <div className="dashboard-filter-bar">
        <div className="search-box-wrapper">
          <svg
            className="search-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search deals by name, company, contact or owner..."
          />
          {search && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className="filter-bar-right">
          <div className="deals-counter-pill">
            <span>
              Showing <strong>{filteredDeals.length}</strong> of{" "}
              <strong>{pipelineDeals.length}</strong> deals
            </span>
          </div>

          <div className="view-switcher-pill">
            <button
              type="button"
              className={`switcher-btn ${view === "kanban" ? "active" : ""}`}
              onClick={() => setView("kanban")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="5" height="18" rx="1" />
                <rect x="10" y="3" width="5" height="12" rx="1" />
                <rect x="17" y="3" width="5" height="15" rx="1" />
              </svg>
              Kanban
            </button>

            <button
              type="button"
              className={`switcher-btn ${view === "table" ? "active" : ""}`}
              onClick={() => setView("table")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              Table
            </button>
          </div>
        </div>
      </div>

      {/* =================================================
          MAIN CONTENT AREA (KANBAN OR TABLE)
      ================================================= */}
      {!selectedPipeline ? (
        <div className="dashboard-empty-card">
          <div className="empty-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="9" y1="21" x2="9" y2="9" />
            </svg>
          </div>
          <h3>No Pipelines Found</h3>
          <p>
            Create or configure your sales pipeline first to start organizing and managing your deals.
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate("/pipeline")}
          >
            Go to Pipeline Settings
          </button>
        </div>
      ) : view === "kanban" ? (
        /* =================================================
           KANBAN BOARD
        ================================================= */
        <div className="kanban-board-container">
          <div className="kanban-columns-track">
            {pipelineStages.map((stage, index) => {
              const stageTheme = STAGE_THEMES[index % STAGE_THEMES.length];
              const stageDeals = filteredDeals.filter(
                (deal) => String(deal.deal_stage) === String(stage.stage_id)
              );

              const stageTotalValue = stageDeals.reduce(
                (sum, d) => sum + Number(d.deal_value || 0),
                0
              );

              const isDragOver = String(dragOverStageId) === String(stage.stage_id);

              return (
                <div
                  className={`kanban-column ${isDragOver ? "drag-over-active" : ""}`}
                  key={stage.stage_id}
                  onDragOver={(e) => handleDragOver(e, stage.stage_id)}
                  onDragLeave={(e) => handleDragLeave(e, stage.stage_id)}
                  onDrop={(e) => handleDrop(e, stage.stage_id)}
                >
                  {/* Column Header */}
                  <div
                    className="kanban-column-header"
                    style={{ borderTopColor: stageTheme.accent }}
                  >
                    <div className="column-title-row">
                      <div className="column-name-group">
                        <span
                          className="stage-color-dot"
                          style={{ backgroundColor: stageTheme.accent }}
                        />
                        <h4 className="stage-title" title={stage.stage_name}>
                          {stage.stage_name}
                        </h4>
                      </div>

                      <div className="column-header-actions">
                        <span className="stage-deal-count-badge">
                          {stageDeals.length}
                        </span>
                        <button
                          type="button"
                          className="stage-add-quick-btn"
                          onClick={() => openCreateModal(stage.stage_id)}
                          title={`Add deal to ${stage.stage_name}`}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="column-sub-row">
                      <span className="stage-value-chip">
                        ${stageTotalValue.toLocaleString()}
                      </span>
                      {stageDeals.length > 0 && (
                        <span className="stage-deal-plural">
                          {stageDeals.length === 1 ? "1 deal" : `${stageDeals.length} deals`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Deals List */}
                  <div className="kanban-cards-list">
                    {stageDeals.length === 0 ? (
                      <div
                        className="kanban-empty-dropzone"
                        onClick={() => openCreateModal(stage.stage_id)}
                      >
                        <div className="empty-dropzone-icon">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </div>
                        <span className="empty-dropzone-text">No deals in this stage</span>
                        <span className="empty-dropzone-sub">
                          Click + to add or drag deal here
                        </span>
                      </div>
                    ) : (
                      stageDeals.map((deal) => (
                        <DealCard
                          key={deal.deal_id}
                          deal={deal}
                          onClick={handleDealClick}
                          onDragStart={handleDragStart}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* =================================================
           TABLE VIEW
        ================================================= */
        <div className="dashboard-table-view-wrapper">
          <DealTable
            deals={filteredDeals}
            onDealClick={handleDealClick}
          />
        </div>
      )}

      {/* =================================================
          CREATE DEAL MODAL
      ================================================= */}
      {showCreate && (
        <Modal
          title="Create New Deal"
          onClose={() => setShowCreate(false)}
        >
          <CreateDeal
            onClose={() => setShowCreate(false)}
            onCreate={handleCreateDeal}
            pipelines={pipelines}
            initialPipelineId={selectedPipelineId}
            initialStageId={createStageId}
          />
        </Modal>
      )}
    </div>
  );
}

export default Dashboard;