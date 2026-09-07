import PipelineDealCard from "./PipelineDealCard";
import AddDealButton from "./AddDealButton";

import "../../styles/pipeline/pipeline-column.css";

function PipelineColumn({ stage }) {
  return (
    <div className="pipeline-column">
      <div className="pipeline-column-header">
        <div className="pipeline-column-title">
          <h3>{stage.stage_name}</h3>

          <span className="deal-count">
            {stage.deals.length}
          </span>
        </div>

        <button className="column-menu-btn">⋮</button>
      </div>

      <div className="pipeline-column-body">
        {stage.deals.length > 0 ? (
          stage.deals.map((deal) => (
            <PipelineDealCard
              key={deal.deal_id}
              deal={deal}
            />
          ))
        ) : (
          <div className="empty-stage">
            <span>No deals</span>
          </div>
        )}

        <AddDealButton />
      </div>
    </div>
  );
}

export default PipelineColumn;