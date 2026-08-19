import { useNavigate } from "react-router-dom";
import "../../styles/deals/deal-card.css";

function DealCard({ deal, onDragStart }) {
  const navigate = useNavigate();

  const handleOpenDeal = () => {
    navigate(`/deal/${deal.id}`);
  };

  return (
    <div
      className="deal-card"
      draggable="true"
      onDragStart={(e) =>
        onDragStart(e, deal)
      }
      onClick={handleOpenDeal}
    >
      <div className="deal-card-top">
        <div className="deal-name">
          {deal.name}
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
        {deal.company}
      </div>

      <div className="deal-contact">
        {deal.email}
      </div>

      <div className="deal-card-footer">
        <div className="deal-value">
          {deal.value}
        </div>

        <div
          className={`deal-priority ${deal.priority.toLowerCase()}`}
        >
          {deal.priority}
        </div>
      </div>

      <div className="deal-owner">
        Owner: {deal.owner}
      </div>
    </div>
  );
}

export default DealCard;