import "../../styles/pipeline/pipeline-selector.css";

function PipelineSelector({
  pipelines,
  selectedPipelineId,
  onChange,
}) {
  return (
    <div className="pipeline-selector-wrapper">
      <div className="pipeline-selector-pill">
        <svg
          className="pipeline-selector-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        <span className="pipeline-selector-label">Pipeline:</span>
        <select
          id="pipeline-selector"
          value={selectedPipelineId}
          onChange={(event) => onChange(event.target.value)}
          className="pipeline-selector"
          disabled={pipelines.length === 0}
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
        <svg
          className="pipeline-selector-arrow"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}

export default PipelineSelector;