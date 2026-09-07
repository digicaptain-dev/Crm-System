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
}) {
  return (
    <div className="pipeline-header">
      <div className="pipeline-header-left">
        <div className="pipeline-header-title">
          <h1>Pipeline</h1>

          <p>
            Manage your deals and track their progress
            through the sales process.
          </p>
        </div>
      </div>

      <div className="pipeline-header-right">
        <PipelineSelector
          pipelines={pipelines}
          selectedPipelineId={selectedPipelineId}
          onChange={onPipelineChange}
        />

        <div className="pipeline-header-actions">
          {/* Refresh */}
          <button
            type="button"
            className={[
              "pipeline-header-icon-btn",
              refreshing
                ? "pipeline-header-icon-btn-loading"
                : "",
            ].join(" ")}
            onClick={onRefresh}
            disabled={refreshing}
            title="Refresh pipelines"
            aria-label="Refresh pipelines"
          >
            <span
              className={
                refreshing
                  ? "pipeline-refresh-icon spinning"
                  : "pipeline-refresh-icon"
              }
            >
              ↻
            </span>
          </button>

          {/* Edit */}
          {selectedPipeline && (
            <button
              type="button"
              className="pipeline-header-secondary-btn"
              onClick={onEditPipeline}
              title="Edit pipeline"
            >
              <span>✎</span>
              Edit
            </button>
          )}

          {/* Delete */}
          {selectedPipeline && (
            <button
              type="button"
              className="pipeline-header-delete-btn"
              onClick={onDeletePipeline}
              title="Delete pipeline"
            >
              <span>⌫</span>
              Delete
            </button>
          )}

          {/* Create */}
          <button
            type="button"
            className="create-pipeline-btn"
            onClick={onCreatePipeline}
          >
            <span className="create-pipeline-icon">
              +
            </span>

            Create Pipeline
          </button>
        </div>
      </div>
    </div>
  );
}

export default PipelineHeader;