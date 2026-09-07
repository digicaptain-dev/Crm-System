import { useNavigate } from "react-router-dom";
import "../../styles/leads/lead-card.css";

function LeadCard({ lead }) {
  const navigate = useNavigate();

  return (
    <div
      className="lead-card"
      onClick={() => navigate(`/lead/${lead.id}`)}
    >
      <div className="lead-card-top">
        <div className="lead-name">
          {lead.name}
        </div>

        <button
          className="lead-menu"
          onClick={(e) => e.stopPropagation()}
        >
          ⋮
        </button>
      </div>

      <div className="lead-company">
        {lead.company}
      </div>

      <div className="lead-email">
        {lead.email}
      </div>

      <div className="lead-card-footer">
        <span>{lead.owner}</span>

        <span
          className={`lead-status ${lead.status.toLowerCase().replace(" ", "-")}`}
        >
          {lead.status}
        </span>
      </div>
    </div>
  );
}

export default LeadCard;