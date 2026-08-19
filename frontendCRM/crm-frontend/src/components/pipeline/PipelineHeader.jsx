import PipelineSelector from "./PipelineSelector";

import "../../styles/pipeline/pipeline-header.css";

function PipelineHeader({
  pipelines,
  selectedPipeline,
  selectedPipelineId,
  onPipelineChange,
  onCreatePipeline,
}) {
  return (
    <div className="pipeline-header">
      <div className="pipeline-header-left">
        <div>
          <h1>Pipeline</h1>

          <p>
            Manage your deals and track their progress through the sales
            process.
          </p>
        </div>
      </div>

      <div className="pipeline-header-right">
        <PipelineSelector
          pipelines={pipelines}
          selectedPipelineId={selectedPipelineId}
          onChange={onPipelineChange}
        />

        <button
          className="create-pipeline-btn"
          onClick={onCreatePipeline}
        >
          <span>+</span>
          Create Pipeline
        </button>
      </div>
    </div>
  );
}

export default PipelineHeader;