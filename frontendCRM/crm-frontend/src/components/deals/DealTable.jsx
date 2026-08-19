import { useNavigate } from "react-router-dom";
import "../../styles/deals/deal-table.css";

function DealTable({ deals }) {
  const navigate = useNavigate();

  const openDeal = (deal) => {
    navigate(`/deal/${deal.id}`);
  };

  return (
    <div className="deal-table-wrapper">
      <table className="deal-table">
        <thead>
          <tr>
            <th>
              <input type="checkbox" />
            </th>

            <th>Deal</th>
            <th>Company</th>
            <th>Email</th>
            <th>Owner</th>
            <th>Value</th>
            <th>Priority</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {deals.map((deal) => (
            <tr
              key={deal.id}
              onClick={() => openDeal(deal)}
            >
              <td>
                <input
                  type="checkbox"
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                />
              </td>

              <td className="deal-table-name">
                {deal.name}
              </td>

              <td>{deal.company}</td>

              <td>{deal.email}</td>

              <td>{deal.owner}</td>

              <td>{deal.value}</td>

              <td>
                <span
                  className={`table-priority ${deal.priority.toLowerCase()}`}
                >
                  {deal.priority}
                </span>
              </td>

              <td>
                <button
                  className="table-action"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  ⋮
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DealTable;