import { useNavigate } from "react-router-dom";
import "../../styles/deals/deal-table.css";

function DealTable({ deals }) {
  const navigate = useNavigate();
  console.log("Rendering DealTable with deals:", deals);
  const openDeal = (deal) => {
    navigate(`/deal/${deal.deal_id}`);
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
            <th>Organization</th>
            <th>Email</th>
            <th>Owner</th>
            <th>Value</th>
            <th>Priority</th>
            <th>Stage</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {deals.map((deal) => (
            <tr
              key={deal.deal_id}
              onClick={() => openDeal(deal)}
            >
              <td>
                <input
                  type="checkbox"
                  onClick={(e) => e.stopPropagation()}
                />
              </td>

              <td className="deal-table-name">
                {deal.deal_name || "Untitled Deal"}
              </td>

              <td>
                {deal.deal_organization || "-"}
              </td>

              <td>
                {deal.customer_email || "-"}
              </td>

              <td>
                {deal.deal_owner || "Unassigned"}
              </td>

              <td>
                {deal.deal_value
                  ? `$${Number(deal.deal_value).toLocaleString()}`
                  : "-"}
              </td>

              <td>
                <span
                  className={`table-priority ${
                    (deal.deal_priority || "Medium").toLowerCase()
                  }`}
                >
                  {deal.deal_priority || "Medium"}
                </span>
              </td>

              <td>
                {deal.deal_stage}
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