import PipelineSelector from "./PipelineSelector";
import "../../styles/pipeline/pipeline-header.css";

function PipelineHeader({
  pipelines,
  selectedPipeline,
  selectedPipelineId,
  onPipelineChange,
  onCreatePipeline,
  onEditPipeline,
  onDeletePipeline,
  onRefresh,
  refreshing,
  canManagePipelines = true,
}) {
  const stagesCount = selectedPipeline?.stages?.length || 0;
  const totalDeals = (selectedPipeline?.stages || []).reduce(
    (sum, stage) => sum + (Array.isArray(stage.deals) ? stage.deals.length : 0),
    0
  );

  return (
    <div className="pipeline-header-card">
      <div className="pipeline-header-info">
        <div className="pipeline-badge-pill">
          <span className="live-pulse-dot" />
          <span>Interactive Sales Board</span>
        </div>
        <h1 className="pipeline-main-title">
          {selectedPipeline?.pipeline_name || "Sales Pipeline"}
        </h1>
        <p className="pipeline-main-subtitle">
          {stagesCount} stages • {totalDeals} active deals in this pipeline. Drag and drop deals to advance their stage.
        </p>
      </div>

      <div className="pipeline-header-controls">
        <PipelineSelector
          pipelines={pipelines}
          selectedPipelineId={selectedPipelineId}
          onChange={onPipelineChange}
        />

        <div className="pipeline-btn-group">
          {/* Refresh */}
          <button
            type="button"
            className={`pipeline-btn pipeline-btn-icon ${refreshing ? "is-loading" : ""}`}
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh pipeline data"
          >
            <svg
              className={`pipeline-icon ${refreshing ? "spin-icon" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
          </button>

          {/* Edit (Admin / Manager only) */}
          {canManagePipelines && selectedPipeline && (
            <button
              type="button"
              className="pipeline-btn pipeline-btn-secondary"
              onClick={onEditPipeline}
              title="Edit pipeline name or description"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
          )}

          {/* Delete (Admin / Manager only) */}
          {canManagePipelines && selectedPipeline && (
            <button
              type="button"
              className="pipeline-btn pipeline-btn-danger"
              onClick={onDeletePipeline}
              title="Delete this pipeline"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              Delete
            </button>
          )}

          {/* Create Pipeline (Admin / Manager only) */}
          {canManagePipelines && (
            <button
              type="button"
              className="pipeline-btn pipeline-btn-primary"
              onClick={onCreatePipeline}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Create Pipeline
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default PipelineHeader;