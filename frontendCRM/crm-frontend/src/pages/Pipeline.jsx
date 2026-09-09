import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import api from "../services/api";

import PipelineHeader from "../components/pipeline/PipelineHeader";
import PipelineToolbar from "../components/pipeline/PipelineToolbar";
import PipelineStats from "../components/pipeline/PipelineStats";
import PipelineBoard from "../components/pipeline/PipelineBoard";

import CreatePipelineModal from "../components/pipeline/CreatePipelineModal";
import EditPipelineModal from "../components/pipeline/EditPipelineModal";
import AddStageModal from "../components/pipeline/AddStageModal";
import EditStageModal from "../components/pipeline/EditStageModal";

import "../styles/pipeline/pipeline.css";

function Pipeline() {
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [filters, setFilters] = useState({
    owner: "",
    status: "",
    priority: "",
  });
  const [view, setView] = useState("board");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddStageModal, setShowAddStageModal] = useState(false);
  const [showEditStageModal, setShowEditStageModal] = useState(false);
  const [selectedStage, setSelectedStage] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Current Logged-in User permissions
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("user"));
  } catch (err) {
    console.error("Failed to read user from localStorage:", err);
  }
  const canManagePipelines = currentUser?.role === "admin" || currentUser?.role === "coworker";

  /* =====================================================
     FETCH PIPELINES
  ===================================================== */
  const fetchPipelines = useCallback(async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      const response = await api.get("/pipelines");
      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.pipelines || [];

      setPipelines(data);

      setSelectedPipelineId((currentId) => {
        const exists = data.some(
          (pipeline) => String(pipeline.pipeline_id) === String(currentId)
        );
        if (exists) return currentId;
        return data.length > 0 ? data[0].pipeline_id : "";
      });
    } catch (err) {
      console.error("Fetch pipelines error:", err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to load pipelines."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  /* =====================================================
     SELECTED PIPELINE
  ===================================================== */
  const selectedPipeline = useMemo(() => {
    return pipelines.find(
      (pipeline) => String(pipeline.pipeline_id) === String(selectedPipelineId)
    ) || pipelines[0] || null;
  }, [pipelines, selectedPipelineId]);

  /* =====================================================
     PIPELINE DEALS & OWNERS
  ===================================================== */
  const pipelineDeals = useMemo(() => {
    if (!selectedPipeline?.stages) return [];
    return selectedPipeline.stages.flatMap((stage) =>
      Array.isArray(stage.deals) ? stage.deals : []
    );
  }, [selectedPipeline]);

  const owners = useMemo(() => {
    const ownerSet = new Set();
    pipelineDeals.forEach((deal) => {
      if (deal?.deal_owner) {
        ownerSet.add(String(deal.deal_owner));
      }
    });
    return Array.from(ownerSet).sort();
  }, [pipelineDeals]);

  /* =====================================================
     FILTER PIPELINE DEALS
  ===================================================== */
  const filteredPipeline = useMemo(() => {
    if (!selectedPipeline) return null;

    const search = searchValue.trim().toLowerCase();

    const filteredStages = (selectedPipeline.stages || []).map((stage) => {
      const deals = Array.isArray(stage.deals) ? stage.deals : [];

      const filteredDeals = deals.filter((deal) => {
        const dealName = String(deal?.deal_name || "").toLowerCase();
        const email = String(deal?.customer_email || "").toLowerCase();
        const owner = String(deal?.deal_owner || "").toLowerCase();
        const org = String(deal?.deal_organization || "").toLowerCase();

        const matchesSearch =
          !search ||
          dealName.includes(search) ||
          email.includes(search) ||
          owner.includes(search) ||
          org.includes(search);

        const matchesOwner =
          !filters.owner ||
          String(deal?.deal_owner) === String(filters.owner);

        const matchesStatus =
          !filters.status ||
          String(deal?.deal_status || "").toLowerCase() === filters.status.toLowerCase();

        const matchesPriority =
          !filters.priority ||
          String(deal?.deal_priority || "").toLowerCase() === filters.priority.toLowerCase();

        return matchesSearch && matchesOwner && matchesStatus && matchesPriority;
      });

      return {
        ...stage,
        deals: filteredDeals,
      };
    });

    return {
      ...selectedPipeline,
      stages: filteredStages,
    };
  }, [selectedPipeline, searchValue, filters]);

  /* =====================================================
     PIPELINE CRUD
  ===================================================== */
  const handleCreatePipeline = async (pipelineData) => {
    try {
      setError("");
      const response = await api.post("/pipelines", pipelineData);
      const createdPipelineId = response.data?.pipeline_id;
      await fetchPipelines();
      if (createdPipelineId) {
        setSelectedPipelineId(createdPipelineId);
      }
      setShowCreateModal(false);
    } catch (err) {
      console.error("Create pipeline error:", err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to create pipeline."
      );
      throw err;
    }
  };

  const handleUpdatePipeline = async (pipelineData) => {
    if (!selectedPipelineId) return;
    try {
      setError("");
      await api.put(`/pipelines/${selectedPipelineId}`, pipelineData);
      await fetchPipelines();
      setShowEditModal(false);
    } catch (err) {
      console.error("Update pipeline error:", err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to update pipeline."
      );
      throw err;
    }
  };

  const handleDeletePipeline = async () => {
    if (!selectedPipeline) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete pipeline "${selectedPipeline.pipeline_name}"?`
    );
    if (!confirmed) return;

    try {
      setError("");
      await api.delete(`/pipelines/${selectedPipeline.pipeline_id}`);
      await fetchPipelines();
    } catch (err) {
      console.error("Delete pipeline error:", err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to delete pipeline."
      );
    }
  };

  /* =====================================================
     STAGE CRUD
  ===================================================== */
  const handleCreateStage = async (stageData) => {
    if (!selectedPipelineId) {
      throw new Error("Please select a pipeline first.");
    }
    try {
      setError("");
      await api.post(`/pipelines/${selectedPipelineId}/stages`, stageData);
      await fetchPipelines();
      setShowAddStageModal(false);
    } catch (err) {
      console.error("Create stage error:", err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to create stage."
      );
      throw err;
    }
  };

  const handleOpenEditStage = (stage) => {
    setSelectedStage(stage);
    setShowEditStageModal(true);
  };

  const handleEditStage = async (stageData) => {
    if (!selectedPipelineId || !selectedStage?.stage_id) return;
    try {
      setError("");
      await api.put(
        `/pipelines/${selectedPipelineId}/stages/${selectedStage.stage_id}`,
        {
          stage_name: stageData.stage_name,
          description: stageData.description || "",
        }
      );
      await fetchPipelines();
      setShowEditStageModal(false);
      setSelectedStage(null);
    } catch (err) {
      console.error("Edit stage error:", err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to update stage."
      );
      throw err;
    }
  };

  const handleDeleteStage = async (stage) => {
    if (!selectedPipelineId || !stage?.stage_id) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete stage "${stage.stage_name}"?`
    );
    if (!confirmed) return;

    try {
      setError("");
      await api.delete(`/pipelines/${selectedPipelineId}/stages/${stage.stage_id}`);
      await fetchPipelines();
    } catch (err) {
      console.error("Delete stage error:", err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to delete stage."
      );
    }
  };

  const handleReorderStages = async (orderedStages) => {
    if (!selectedPipelineId || !Array.isArray(orderedStages)) return;
    try {
      setError("");
      await api.put(`/pipelines/${selectedPipelineId}/stages/reorder`, {
        stages: orderedStages.map((stage, index) => ({
          stage_id: stage.stage_id,
          stage_order: index + 1,
        })),
      });
      await fetchPipelines();
    } catch (err) {
      console.error("Reorder stages error:", err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Failed to reorder stages."
      );
      throw err;
    }
  };

  const handleClearFilters = () => {
    setSearchValue("");
    setFilters({
      owner: "",
      status: "",
      priority: "",
    });
  };

  /* =====================================================
     LOADING STATE
  ===================================================== */
  if (loading) {
    return (
      <div className="pipeline-page-container">
        <div className="pipeline-loading-card">
          <div className="pipeline-spinner" />
          <h3>Loading Pipeline Board...</h3>
          <p>Fetching active pipeline stages, deal values, and owners.</p>
        </div>
      </div>
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */
  return (
    <div className="pipeline-page-container">
      {/* ERROR ALERT */}
      {error && (
        <div className="pipeline-global-alert">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
          <button type="button" onClick={() => setError("")}>×</button>
        </div>
      )}

      {/* HEADER SECTION */}
      <PipelineHeader
        pipelines={pipelines}
        selectedPipeline={selectedPipeline}
        selectedPipelineId={selectedPipelineId}
        onPipelineChange={setSelectedPipelineId}
        onCreatePipeline={() => setShowCreateModal(true)}
        onEditPipeline={() => setShowEditModal(true)}
        onDeletePipeline={handleDeletePipeline}
        onRefresh={() => fetchPipelines(true)}
        refreshing={refreshing}
        canManagePipelines={canManagePipelines}
      />

      {/* MAIN PIPELINE CONTENT */}
      {selectedPipeline ? (
        <div className="pipeline-main-stack">
          {/* STATS SECTION */}
          <PipelineStats pipeline={selectedPipeline} />

          {/* TOOLBAR SECTION */}
          <PipelineToolbar
            searchValue={searchValue}
            onSearchChange={setSearchValue}
            filters={filters}
            onFiltersChange={setFilters}
            owners={owners}
            view={view}
            onViewChange={setView}
            onClearFilters={handleClearFilters}
          />

          {/* BOARD / TABLE SECTION */}
          <PipelineBoard
            pipeline={filteredPipeline}
            view={view}
            onAddStage={() => setShowAddStageModal(true)}
            onEditStage={handleOpenEditStage}
            onDeleteStage={handleDeleteStage}
            onReorderStages={handleReorderStages}
            canManagePipelines={canManagePipelines}
          />
        </div>
      ) : (
        <div className="pipeline-empty-card">
          <div className="empty-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <h2>No Pipelines Found</h2>
          <p>Create your first sales pipeline to begin organizing deals and managing your revenue pipeline.</p>
          {canManagePipelines && (
            <button
              type="button"
              className="pipeline-btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              + Create Pipeline
            </button>
          )}
        </div>
      )}

      {/* MODALS */}
      {showCreateModal && (
        <CreatePipelineModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreatePipeline}
        />
      )}

      {showEditModal && selectedPipeline && (
        <EditPipelineModal
          pipeline={selectedPipeline}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleUpdatePipeline}
        />
      )}

      {showAddStageModal && selectedPipeline && (
        <AddStageModal
          pipeline={selectedPipeline}
          onClose={() => setShowAddStageModal(false)}
          onCreate={handleCreateStage}
        />
      )}

      {showEditStageModal && selectedStage && (
        <EditStageModal
          stage={selectedStage}
          onClose={() => {
            setShowEditStageModal(false);
            setSelectedStage(null);
          }}
          onUpdate={handleEditStage}
        />
      )}
    </div>
  );
}

export default Pipeline;