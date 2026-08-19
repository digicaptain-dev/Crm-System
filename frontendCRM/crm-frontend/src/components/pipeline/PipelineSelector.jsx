import "../../styles/pipeline/pipeline-selector.css";

function PipelineSelector({
  pipelines,
  selectedPipelineId,
  onChange,
}) {
  return (
    <div className="pipeline-selector-wrapper">
      <label>Pipeline</label>

      <select
        value={selectedPipelineId}
        onChange={(e) => onChange(e.target.value)}
        className="pipeline-selector"
      >
        {pipelines.map((pipeline) => (
          <option
            key={pipeline.pipeline_id}
            value={pipeline.pipeline_id}
          >
            {pipeline.pipeline_name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default PipelineSelector;