import PipelineColumn from "./PipelineColumn";

import "../../styles/pipeline/pipeline-board.css";

function PipelineBoard({ pipeline }) {
  if (!pipeline) {
    return (
      <div className="pipeline-empty">
        <h3>No pipeline selected</h3>
        <p>Create a pipeline to get started.</p>
      </div>
    );
  }

  const sortedStages = [...pipeline.stages].sort(
    (a, b) => a.stage_order - b.stage_order
  );

  return (
    <div className="pipeline-board">
      {sortedStages.map((stage) => (
        <PipelineColumn
          key={stage.stage_id}
          stage={stage}
        />
      ))}
    </div>
  );
}

export default PipelineBoard;