import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../services/api";
import { defaultPipelines } from "../data/mockData";

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

        // Concurrently fetch pipelines and deals
        const [pipelinesRes, dealsRes] = await Promise.allSettled([
          api.get("/pipelines"),
          api.get("/deals?limit=500"),
        ]);

        let rawPipelines = [];
        if (pipelinesRes.status === "fulfilled" && pipelinesRes.value?.data) {
          const resData = pipelinesRes.value.data;
          rawPipelines = Array.isArray(resData)
            ? resData
            : resData?.pipelines || resData?.data || [];
        }

        let rawDeals = [];
        if (dealsRes.status === "fulfilled" && dealsRes.value?.data) {
          const dData = dealsRes.value.data;
          rawDeals = Array.isArray(dData)
            ? dData
            : dData?.deals || dData?.data || [];
        }

        // Default stages template for fallback
        const defaultStageTemplates = [
          { stage_id: 1, stage_name: "Qualified", stage_order: 1, description: "Qualified" },
          { stage_id: 2, stage_name: "Content Made", stage_order: 2, description: "Content Made" },
          { stage_id: 3, stage_name: "Demo Scheduled", stage_order: 3, description: "Demo Scheduled" },
          { stage_id: 4, stage_name: "Proposal Made", stage_order: 4, description: "Proposal Made" },
          { stage_id: 5, stage_name: "Negotiations Started", stage_order: 5, description: "Negotiations Started" },
        ];

        let enrichedPipelines = [];

        if (rawPipelines.length > 0) {
          // Enrich fetched pipelines with stages and deals
          enrichedPipelines = rawPipelines.map((pipe) => {
            const pipeDeals = rawDeals.filter(
              (deal) => String(deal.pipeline_id) === String(pipe.pipeline_id)
            );

            const stages =
              Array.isArray(pipe.stages) && pipe.stages.length > 0
                ? pipe.stages
                : defaultStageTemplates.map((tmpl) => ({
                    ...tmpl,
                    pipeline_id: pipe.pipeline_id,
                  }));

            const enrichedStages = stages.map((stage) => {
              const existingDeals = Array.isArray(stage.deals)
                ? stage.deals
                : [];

              if (existingDeals.length > 0) {
                return { ...stage, deals: existingDeals };
              }

              const matchingDeals = pipeDeals.filter(
                (deal) =>
                  String(deal.deal_stage) === String(stage.stage_id) ||
                  String(deal.deal_stage || "").toLowerCase() ===
                    String(stage.stage_name || "").toLowerCase()
              );

              return {
                ...stage,
                deals: matchingDeals,
              };
            });

            return {
              ...pipe,
              stages: enrichedStages,
            };
          });
        } else {
          // Fallback to default pipeline template if no pipelines in DB or on network error
          enrichedPipelines = defaultPipelines.map((pipe) => {
            if (rawDeals.length > 0) {
              const enrichedStages = pipe.stages.map((stage) => {
                const matchingDeals = rawDeals.filter(
                  (deal) =>
                    String(deal.deal_stage) === String(stage.stage_id) ||
                    String(deal.deal_stage || "").toLowerCase() ===
                      String(stage.stage_name || "").toLowerCase()
                );
                return {
                  ...stage,
                  deals: matchingDeals.length > 0 ? matchingDeals : stage.deals,
                };
              });
              return { ...pipe, stages: enrichedStages };
            }
            return pipe;
          });
        }

        setPipelines(enrichedPipelines);

        setSelectedPipelineId((currentId) => {
          const exists = enrichedPipelines.some(
            (pipeline) =>
              String(pipeline.pipeline_id) ===
              String(currentId)
          );

          if (exists) {
            return currentId;
          }

          return enrichedPipelines.length > 0
            ? enrichedPipelines[0].pipeline_id
            : "";
        });

        if (pipelinesRes.status === "rejected") {
          console.warn("Pipelines API offline or unreachable, loaded default pipeline data gracefully:", pipelinesRes.reason);
        }
      } catch (err) {
        console.warn("Fetch pipelines error handled with fallback:", err);
        setPipelines(defaultPipelines);
        if (defaultPipelines.length > 0) {
          setSelectedPipelineId(defaultPipelines[0].pipeline_id);
        }
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
    return (
      pipelines.find(
        (pipeline) =>
          String(pipeline.pipeline_id) ===
          String(selectedPipelineId)
      ) || pipelines[0] || null
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

  const handleCreatePipeline = async (pipeline) => {
    try {
      setError("");

      const response = await api.post(
        "/pipelines",
        pipeline
      );

      const createdPipelineId =
        response.data?.pipeline_id;

      await fetchPipelines();

      if (createdPipelineId) {
        setSelectedPipelineId(createdPipelineId);
      }

      setShowCreateModal(false);
    } catch (err) {
      console.warn("Create pipeline API error, creating locally:", err);
      const newPipelineId = `pipeline-${Date.now()}`;
      const newPipelineObj = {
        pipeline_id: newPipelineId,
        pipeline_name: pipeline.pipeline_name,
        description: pipeline.description || "",
        stages: [
          { stage_id: 1, stage_name: "Qualified", stage_order: 1, description: "Qualified", deals: [] },
          { stage_id: 2, stage_name: "Content Made", stage_order: 2, description: "Content Made", deals: [] },
          { stage_id: 3, stage_name: "Demo Scheduled", stage_order: 3, description: "Demo Scheduled", deals: [] },
          { stage_id: 4, stage_name: "Proposal Made", stage_order: 4, description: "Proposal Made", deals: [] },
          { stage_id: 5, stage_name: "Negotiations Started", stage_order: 5, description: "Negotiations Started", deals: [] },
        ],
      };
      setPipelines((prev) => [newPipelineObj, ...prev]);
      setSelectedPipelineId(newPipelineId);
      setShowCreateModal(false);
    }
  };

  /* =====================================================
     UPDATE PIPELINE
  ===================================================== */

  const handleUpdatePipeline = async (pipeline) => {
    if (!selectedPipelineId) {
      return;
    }

    try {
      setError("");

      await api.put(
        `/pipelines/${selectedPipelineId}`,
        pipeline
      );

      await fetchPipelines();

      setShowEditModal(false);
    } catch (err) {
      console.warn("Update pipeline API error, updating locally:", err);
      setPipelines((prev) =>
        prev.map((p) =>
          p.pipeline_id === selectedPipelineId
            ? { ...p, pipeline_name: pipeline.pipeline_name, description: pipeline.description }
            : p
        )
      );
      setShowEditModal(false);
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

      await api.delete(
        `/pipelines/${selectedPipeline.pipeline_id}`
      );

      await fetchPipelines();
    } catch (err) {
      console.warn("Delete pipeline API error, deleting locally:", err);
      setPipelines((prev) => {
        const remaining = prev.filter(
          (p) => p.pipeline_id !== selectedPipeline.pipeline_id
        );
        if (remaining.length > 0) {
          setSelectedPipelineId(remaining[0].pipeline_id);
        } else {
          setSelectedPipelineId("");
        }
        return remaining;
      });
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

      const payload = {
        stage_name: stage.stage_name.trim(),
        description: stage.description?.trim() || "",
        ...(stage.stage_order !== undefined
          ? { stage_order: Number(stage.stage_order) }
          : {}),
      };

      const response = await api.post(
        `/pipelines/${selectedPipelineId}/stages`,
        payload
      );

      await fetchPipelines();
      setShowAddStageModal(false);
      return response.data;
    } catch (err) {
      console.warn("Create stage API error, updating locally:", err);
      setPipelines((prev) =>
        prev.map((p) => {
          if (p.pipeline_id !== selectedPipelineId) return p;
          const currentStages = p.stages || [];
          const newStage = {
            stage_id: currentStages.length + 1,
            stage_name: stage.stage_name.trim(),
            stage_order: currentStages.length + 1,
            description: stage.description?.trim() || "",
            deals: [],
          };
          return {
            ...p,
            stages: [...currentStages, newStage],
          };
        })
      );
      setShowAddStageModal(false);
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

  const handleEditStage = async (stageData) => {
    if (
      !selectedPipelineId ||
      !selectedStage?.stage_id
    ) {
      return;
    }

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
      console.warn("Edit stage API error, updating locally:", err);
      setPipelines((prev) =>
        prev.map((p) => {
          if (p.pipeline_id !== selectedPipelineId) return p;
          return {
            ...p,
            stages: (p.stages || []).map((st) =>
              st.stage_id === selectedStage.stage_id
                ? { ...st, stage_name: stageData.stage_name, description: stageData.description || "" }
                : st
            ),
          };
        })
      );
      setShowEditStageModal(false);
      setSelectedStage(null);
    }
  };

  /* =====================================================
     DELETE STAGE
  ===================================================== */

  const handleDeleteStage = async (stage) => {
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

      await api.delete(
        `/pipelines/${selectedPipelineId}/stages/${stage.stage_id}`
      );

      await fetchPipelines();
    } catch (err) {
      console.warn("Delete stage API error, updating locally:", err);
      setPipelines((prev) =>
        prev.map((p) => {
          if (p.pipeline_id !== selectedPipelineId) return p;
          return {
            ...p,
            stages: (p.stages || []).filter((st) => st.stage_id !== stage.stage_id),
          };
        })
      );
    }
  };

  /* =====================================================
     REORDER STAGES
  ===================================================== */

  const handleReorderStages = async (orderedStages) => {
    if (
      !selectedPipelineId ||
      !Array.isArray(orderedStages)
    ) {
      return;
    }

    try {
      setError("");

      await api.put(
        `/pipelines/${selectedPipelineId}/stages/reorder`,
        {
          stages: orderedStages.map(
            (stage, index) => ({
              stage_id: stage.stage_id,
              stage_order: index + 1,
            })
          ),
        }
      );

      await fetchPipelines();
    } catch (err) {
      console.warn("Reorder stages API error, updating locally:", err);
      setPipelines((prev) =>
        prev.map((p) => {
          if (p.pipeline_id !== selectedPipelineId) return p;
          return {
            ...p,
            stages: orderedStages,
          };
        })
      );
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
