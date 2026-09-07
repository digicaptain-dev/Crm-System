import "../../styles/pipeline/pipeline-selector.css";

function PipelineSelector({
  pipelines,
  selectedPipelineId,
  onChange,
}) {
  return (
    <div className="pipeline-selector-wrapper">
      <label htmlFor="pipeline-selector">
        Pipeline
      </label>

      <select
        id="pipeline-selector"
        value={selectedPipelineId}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="pipeline-selector"
        disabled={pipelines.length === 0}
      >
        {pipelines.length === 0 ? (
          <option value="">
            No pipelines
          </option>
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
  );
}

export default PipelineSelector;