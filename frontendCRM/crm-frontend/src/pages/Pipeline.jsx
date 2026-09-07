import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";

import PipelineHeader from "../components/pipeline/PipelineHeader";
import PipelineToolbar from "../components/pipeline/PipelineToolbar";
import PipelineStats from "../components/pipeline/PipelineStats";
import PipelineBoard from "../components/pipeline/PipelineBoard";

import CreatePipelineModal from "../components/pipeline/CreatePipelineModal";
import EditPipelineModal from "../components/pipeline/EditPipelineModal";
import AddStageModal from "../components/pipeline/AddStageModal";
import EditStageModal from "../components/pipeline/EditStageModal";

import "../styles/pipeline/pipeline.css";

const API_URL = "http://localhost:1000/api";

function Pipeline() {
  const [pipelines, setPipelines] = useState([]);
  const [selectedPipelineId, setSelectedPipelineId] =
    useState("");

  const [searchValue, setSearchValue] = useState("");

  const [filters, setFilters] = useState({
    owner: "",
    status: "",
    priority: "",
  });

  const [view, setView] = useState("board");

  const [showCreateModal, setShowCreateModal] =
    useState(false);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [showAddStageModal, setShowAddStageModal] =
    useState(false);

  const [showEditStageModal, setShowEditStageModal] =
    useState(false);

  const [selectedStage, setSelectedStage] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  /* =====================================================
     FETCH PIPELINES
  ===================================================== */

  const fetchPipelines = useCallback(
    async (showRefreshLoader = false) => {
      try {
        if (showRefreshLoader) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await axios.get(
          `${API_URL}/pipelines`
        );

        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.pipelines || [];

        setPipelines(data);

        setSelectedPipelineId((currentId) => {
          const exists = data.some(
            (pipeline) =>
              String(pipeline.pipeline_id) ===
              String(currentId)
          );

          if (exists) {
            return currentId;
          }

          return data.length > 0
            ? data[0].pipeline_id
            : "";
        });
      } catch (err) {
        console.error(
          "Fetch pipelines error:",
          err
        );

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
    },
    []
  );

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  /* =====================================================
     SELECTED PIPELINE
  ===================================================== */

  const selectedPipeline = useMemo(() => {
    return pipelines.find(
      (pipeline) =>
        String(pipeline.pipeline_id) ===
        String(selectedPipelineId)
    );
  }, [
    pipelines,
    selectedPipelineId,
  ]);

  /* =====================================================
     PIPELINE DEALS
  ===================================================== */

  const pipelineDeals = useMemo(() => {
    if (!selectedPipeline?.stages) {
      return [];
    }

    return selectedPipeline.stages.flatMap(
      (stage) =>
        Array.isArray(stage.deals)
          ? stage.deals
          : []
    );
  }, [selectedPipeline]);

  /* =====================================================
     OWNERS
  ===================================================== */

  const owners = useMemo(() => {
    const ownerSet = new Set();

    pipelineDeals.forEach((deal) => {
      if (deal?.deal_owner) {
        ownerSet.add(
          String(deal.deal_owner)
        );
      }
    });

    return Array.from(ownerSet).sort();
  }, [pipelineDeals]);

  /* =====================================================
     FILTER PIPELINE
  ===================================================== */

  const filteredPipeline = useMemo(() => {
    if (!selectedPipeline) {
      return null;
    }

    const search =
      searchValue.trim().toLowerCase();

    const filteredStages = (
      selectedPipeline.stages || []
    ).map((stage) => {
      const deals = Array.isArray(stage.deals)
        ? stage.deals
        : [];

      const filteredDeals = deals.filter(
        (deal) => {
          const dealName = String(
            deal?.deal_name || ""
          ).toLowerCase();

          const email = String(
            deal?.customer_email || ""
          ).toLowerCase();

          const owner = String(
            deal?.deal_owner || ""
          ).toLowerCase();

          const matchesSearch =
            !search ||
            dealName.includes(search) ||
            email.includes(search) ||
            owner.includes(search);

          const matchesOwner =
            !filters.owner ||
            String(deal?.deal_owner) ===
              String(filters.owner);

          const matchesStatus =
            !filters.status ||
            String(
              deal?.deal_status || ""
            ).toLowerCase() ===
              filters.status.toLowerCase();

          const matchesPriority =
            !filters.priority ||
            String(
              deal?.deal_priority || ""
            ).toLowerCase() ===
              filters.priority.toLowerCase();

          return (
            matchesSearch &&
            matchesOwner &&
            matchesStatus &&
            matchesPriority
          );
        }
      );

      return {
        ...stage,
        deals: filteredDeals,
      };
    });

    return {
      ...selectedPipeline,
      stages: filteredStages,
    };
  }, [
    selectedPipeline,
    searchValue,
    filters,
  ]);

  /* =====================================================
     CREATE PIPELINE
  ===================================================== */

  const handleCreatePipeline = async (
    pipeline
  ) => {
    try {
      setError("");

      const response = await axios.post(
        `${API_URL}/pipelines`,
        pipeline
      );

      const createdPipelineId =
        response.data?.pipeline_id;

      await fetchPipelines();

      if (createdPipelineId) {
        setSelectedPipelineId(
          createdPipelineId
        );
      }

      setShowCreateModal(false);
    } catch (err) {
      console.error(
        "Create pipeline error:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to create pipeline."
      );

      throw err;
    }
  };

  /* =====================================================
     UPDATE PIPELINE
  ===================================================== */

  const handleUpdatePipeline = async (
    pipeline
  ) => {
    if (!selectedPipelineId) {
      return;
    }

    try {
      setError("");

      await axios.put(
        `${API_URL}/pipelines/${selectedPipelineId}`,
        pipeline
      );

      await fetchPipelines();

      setShowEditModal(false);
    } catch (err) {
      console.error(
        "Update pipeline error:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to update pipeline."
      );

      throw err;
    }
  };

  /* =====================================================
     DELETE PIPELINE
  ===================================================== */

  const handleDeletePipeline = async () => {
    if (!selectedPipeline) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${selectedPipeline.pipeline_name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await axios.delete(
        `${API_URL}/pipelines/${selectedPipeline.pipeline_id}`
      );

      await fetchPipelines();
    } catch (err) {
      console.error(
        "Delete pipeline error:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to delete pipeline."
      );
    }
  };

  /* =====================================================
     CREATE STAGE
  ===================================================== */

  const handleCreateStage = async (stage) => {
    if (!selectedPipelineId) {
      throw new Error(
        "Please select a pipeline first."
      );
    }

    try {
      setError("");

      await axios.post(
        `${API_URL}/pipelines/${selectedPipelineId}/stages`,
        stage
      );

      await fetchPipelines();

      setShowAddStageModal(false);
    } catch (err) {
      console.error(
        "Create stage error:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to create stage."
      );

      throw err;
    }
  };

  /* =====================================================
     OPEN EDIT STAGE
  ===================================================== */

  const handleOpenEditStage = (stage) => {
    setSelectedStage(stage);
    setShowEditStageModal(true);
  };

  /* =====================================================
     EDIT STAGE
  ===================================================== */

  const handleEditStage = async (
    stageData
  ) => {
    if (
      !selectedPipelineId ||
      !selectedStage?.stage_id
    ) {
      return;
    }

    try {
      setError("");

      await axios.put(
        `${API_URL}/pipelines/${selectedPipelineId}/stages/${selectedStage.stage_id}`,
        {
          stage_name:
            stageData.stage_name,
          description:
            stageData.description || "",
        }
      );

      await fetchPipelines();

      setShowEditStageModal(false);
      setSelectedStage(null);
    } catch (err) {
      console.error(
        "Edit stage error:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to update stage."
      );

      throw err;
    }
  };

  /* =====================================================
     DELETE STAGE
  ===================================================== */

  const handleDeleteStage = async (
    stage
  ) => {
    if (
      !selectedPipelineId ||
      !stage?.stage_id
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${stage.stage_name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await axios.delete(
        `${API_URL}/pipelines/${selectedPipelineId}/stages/${stage.stage_id}`
      );

      await fetchPipelines();
    } catch (err) {
      console.error(
        "Delete stage error:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to delete stage."
      );
    }
  };

  /* =====================================================
     REORDER STAGES
  ===================================================== */

  const handleReorderStages = async (
    orderedStages
  ) => {
    if (
      !selectedPipelineId ||
      !Array.isArray(orderedStages)
    ) {
      return;
    }

    try {
      setError("");

      await axios.put(
        `${API_URL}/pipelines/${selectedPipelineId}/stages/reorder`,
        {
          stages: orderedStages.map(
            (stage, index) => ({
              stage_id:
                stage.stage_id,
              stage_order:
                index + 1,
            })
          ),
        }
      );

      await fetchPipelines();
    } catch (err) {
      console.error(
        "Reorder stages error:",
        err
      );

      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to reorder stages."
      );

      throw err;
    }
  };

  /* =====================================================
     CLEAR FILTERS
  ===================================================== */

  const handleClearFilters = () => {
    setSearchValue("");

    setFilters({
      owner: "",
      status: "",
      priority: "",
    });
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <div className="pipeline-page">
        <div className="pipeline-loading">
          <div className="pipeline-loading-spinner" />

          <div className="pipeline-loading-content">
            <strong>
              Loading pipelines
            </strong>

            <span>
              Please wait while we load
              your sales pipeline.
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="pipeline-page">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="pipeline-page-header">
        <div className="pipeline-page-heading">
          <div className="pipeline-page-icon">
            <span>⌁</span>
          </div>

          <div>
            <h1>Pipeline</h1>

            <p>
              Manage your sales pipeline
              and track deals through
              every stage.
            </p>
          </div>
        </div>

        <div className="pipeline-page-summary">
          {pipelines.length > 0 && (
            <>
              <span className="pipeline-summary-dot" />
              <span>
                {pipelines.length}{" "}
                {pipelines.length === 1
                  ? "pipeline"
                  : "pipelines"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="pipeline-error">
          <div className="pipeline-error-content">
            <div className="pipeline-error-icon">
              !
            </div>

            <div className="pipeline-error-message">
              <strong>
                Something went wrong
              </strong>

              <span>{error}</span>
            </div>

            <button
              type="button"
              className="pipeline-error-close"
              onClick={() =>
                setError("")
              }
              aria-label="Close error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* =================================================
          PIPELINE HEADER
      ================================================= */}

      <div className="pipeline-header-section">
        <PipelineHeader
          pipelines={pipelines}
          selectedPipeline={selectedPipeline}
          selectedPipelineId={
            selectedPipelineId
          }
          onPipelineChange={
            setSelectedPipelineId
          }
          onCreatePipeline={() =>
            setShowCreateModal(true)
          }
          onEditPipeline={() =>
            setShowEditModal(true)
          }
          onDeletePipeline={
            handleDeletePipeline
          }
          onRefresh={() =>
            fetchPipelines(true)
          }
          refreshing={refreshing}
        />
      </div>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      {selectedPipeline ? (
        <main className="pipeline-content">

          {/* STATS */}

          <section className="pipeline-stats-section">
            <PipelineStats
              pipeline={selectedPipeline}
            />
          </section>

          {/* TOOLBAR */}

          <section className="pipeline-toolbar-section">
            <PipelineToolbar
              searchValue={searchValue}
              onSearchChange={
                setSearchValue
              }
              filters={filters}
              onFiltersChange={
                setFilters
              }
              owners={owners}
              view={view}
              onViewChange={setView}
              onClearFilters={
                handleClearFilters
              }
            />
          </section>

          {/* BOARD */}

          <section className="pipeline-board-section">
            <PipelineBoard
              pipeline={filteredPipeline}
              view={view}
              onAddStage={() =>
                setShowAddStageModal(
                  true
                )
              }
              onEditStage={
                handleOpenEditStage
              }
              onDeleteStage={
                handleDeleteStage
              }
              onReorderStages={
                handleReorderStages
              }
            />
          </section>
        </main>
      ) : (
        /* =================================================
           NO PIPELINE
        ================================================= */

        <div className="pipeline-empty">
          <div className="pipeline-empty-icon">
            <span>+</span>
          </div>

          <h2>No pipelines found</h2>

          <p>
            Create your first sales
            pipeline to start managing
            your deals.
          </p>

          <button
            type="button"
            className="pipeline-empty-create-btn"
            onClick={() =>
              setShowCreateModal(true)
            }
          >
            <span>+</span>
            Create Pipeline
          </button>
        </div>
      )}

      {/* =================================================
          CREATE PIPELINE MODAL
      ================================================= */}

      {showCreateModal && (
        <CreatePipelineModal
          onClose={() =>
            setShowCreateModal(false)
          }
          onCreate={
            handleCreatePipeline
          }
        />
      )}

      {/* =================================================
          EDIT PIPELINE MODAL
      ================================================= */}

      {showEditModal &&
        selectedPipeline && (
          <EditPipelineModal
            pipeline={selectedPipeline}
            onClose={() =>
              setShowEditModal(false)
            }
            onUpdate={
              handleUpdatePipeline
            }
          />
        )}

      {/* =================================================
          ADD STAGE MODAL
      ================================================= */}

      {showAddStageModal &&
        selectedPipeline && (
          <AddStageModal
            pipeline={selectedPipeline}
            onClose={() =>
              setShowAddStageModal(
                false
              )
            }
            onCreate={
              handleCreateStage
            }
          />
        )}

      {/* =================================================
          EDIT STAGE MODAL
      ================================================= */}

      {showEditStageModal &&
        selectedStage && (
          <EditStageModal
            stage={selectedStage}
            onClose={() => {
              setShowEditStageModal(
                false
              );
              setSelectedStage(null);
            }}
            onUpdate={handleEditStage}
          />
        )}
    </div>
  );
}

export default Pipeline;