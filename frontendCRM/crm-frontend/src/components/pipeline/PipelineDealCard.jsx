import "../../styles/pipeline/pipeline-deal-card.css";

function PipelineDealCard({ deal }) {
  console.log("PipelineDealCard deal:", deal);

  const dealValue = Number(deal.deal_value ?? 0);

  return (
    <div className="pipeline-deal-card">
      <div className="deal-card-top">
        <span className="deal-priority">
          {deal.deal_priority || "Medium"}
        </span>

        <button className="deal-menu-btn">⋮</button>
      </div>

      <h4>{deal.deal_name}</h4>

      <p className="deal-company">
        {deal.company_name || "No company"}
      </p>

      <div className="deal-card-info">
        <div>
          <span className="info-label">Value</span>

          <strong>
            ${dealValue.toLocaleString()}
          </strong>
        </div>

        <div>
          <span className="info-label">Owner</span>

          <span>
            {deal.deal_owner || "Unassigned"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PipelineDealCard;