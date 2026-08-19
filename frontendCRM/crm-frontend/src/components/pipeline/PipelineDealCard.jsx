import "../../styles/pipeline/pipeline-deal-card.css";

function PipelineDealCard({ deal }) {
  return (
    <div className="pipeline-deal-card">
      <div className="deal-card-top">
        <span className="deal-priority">
          {deal.priority}
        </span>

        <button className="deal-menu-btn">⋮</button>
      </div>

      <h4>{deal.deal_name}</h4>

      <p className="deal-company">
        {deal.company_name}
      </p>

      <div className="deal-card-info">
        <div>
          <span className="info-label">Value</span>
          <strong>
            ${deal.value.toLocaleString()}
          </strong>
        </div>

        <div>
          <span className="info-label">Owner</span>
          <span>{deal.owner}</span>
        </div>
      </div>
    </div>
  );
}

export default PipelineDealCard;