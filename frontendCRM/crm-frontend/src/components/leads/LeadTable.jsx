import { useNavigate } from "react-router-dom";
import "../../styles/leads/lead-table.css";

function LeadTable({ leads }) {
  const navigate = useNavigate();

  return (
    <div className="leads-table-wrapper">

      <table className="leads-table">

        <thead>
          <tr>
            <th>Lead</th>
            <th>Company</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Owner</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {leads.map((lead) => (
            <tr
              key={lead.id}
              onClick={() =>
                navigate(`/lead/${lead.id}`)
              }
            >
              <td className="lead-table-name">
                {lead.name}
              </td>

              <td>{lead.company}</td>

              <td>{lead.email}</td>

              <td>{lead.phone}</td>

              <td>{lead.owner}</td>

              <td>
                <span
                  className={`lead-status ${lead.status
                    .toLowerCase()
                    .replace(" ", "-")}`}
                >
                  {lead.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
}

export default LeadTable;