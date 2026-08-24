import { useNavigate } from "react-router-dom";
import "../../styles/deals/deal-card.css";

function DealCard({ deal, onDragStart }) {
  const navigate = useNavigate();

  const handleOpenDeal = () => {
    navigate(`/deal/${deal.deal_id}`);
  };

  return (
    <div
      className="deal-card"
      draggable="true"
      onDragStart={(e) => onDragStart?.(e, deal)}
      onClick={handleOpenDeal}
    >
      <div className="deal-card-top">
        <div className="deal-name">
          {deal.deal_name || "Untitled Deal"}
        </div>

        <button
          className="deal-menu"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          ⋮
        </button>
      </div>

      <div className="deal-company">
        {deal.deal_organization || "No organization"}
      </div>

      <div className="deal-contact">
        {deal.customer_email || "No email"}
      </div>

      <div className="deal-card-footer">
        <div className="deal-value">
          {deal.deal_value
            ? `$${Number(deal.deal_value).toLocaleString()}`
            : "No value"}
        </div>

        <div
          className={`deal-priority ${
            (deal.deal_priority || "Medium").toLowerCase()
          }`}
        >
          {deal.deal_priority || "Medium"}
        </div>
      </div>

      <div className="deal-owner">
        Owner: {deal.deal_owner || "Unassigned"}
      </div>
    </div>
  );
}

export default DealCard;