import { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/deals/deal-table.css";

function DealTable({
  deals = [],
  selectedDeals = [],
  onSelectDeal,
  onSelectAll,
  isAdmin = false,
  onDeleteDeal,
}) {
  const navigate = useNavigate();
  const selectAllRef = useRef(null);

  const allSelected =
    deals.length > 0 && deals.every((deal) => selectedDeals.includes(deal.deal_id));

  const someSelected =
    deals.some((deal) => selectedDeals.includes(deal.deal_id)) && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  const getPriorityClass = (priority) => {
    const p = String(priority || "Medium").toLowerCase();
    return `priority-${p}`;
  };

  const getStatusClass = (status) => {
    const s = String(status || "Open").toLowerCase().replace(/\s+/g, "-");
    return `status-${s}`;
  };

  return (
    <div className="deal-table-wrapper">
      <table className="deal-table">
        <thead>
          <tr>
            {onSelectAll && (
              <th className="deal-checkbox-cell">
                <input
                  type="checkbox"
                  ref={selectAllRef}
                  checked={allSelected}
                  onChange={onSelectAll}
                  aria-label="Select all deals"
                />
              </th>
            )}
            <th>Deal Title</th>
            <th>Organization</th>
            <th>Stage</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Assigned User</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {deals.map((deal) => {
            const isSelected = selectedDeals.includes(deal.deal_id);
            const priorityClass = getPriorityClass(deal.deal_priority);
            const statusClass = getStatusClass(deal.deal_status);
            const ownerInitial = (deal.assigned_user_name || deal.deal_owner || "U").charAt(0).toUpperCase();

            return (
              <tr
                key={deal.deal_id}
                className={isSelected ? "deal-row-selected" : ""}
                onClick={() => navigate(`/deal/${deal.deal_id}`)}
                style={{ cursor: "pointer" }}
              >
                {/* Checkbox */}
                {onSelectDeal && (
                  <td
                    className="deal-checkbox-cell"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onSelectDeal(deal.deal_id)}
                      aria-label={`Select deal ${deal.deal_name}`}
                    />
                  </td>
                )}

                {/* Deal Title */}
                <td>
                  <div className="deal-title-cell">
                    <Link
                      to={`/deal/${deal.deal_id}`}
                      className="deal-title-link"
                      onClick={(e) => e.stopPropagation()}
                      title={deal.deal_name || "Untitled Deal"}
                    >
                      {deal.deal_name || "Untitled Deal"}
                    </Link>
                  </div>
                </td>

                {/* Organization */}
                <td>
                  {deal.deal_organization ? (
                    <div className="deal-org-badge">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                      <span>{deal.deal_organization}</span>
                    </div>
                  ) : (
                    <span style={{ color: "#94a3b8" }}>—</span>
                  )}
                </td>

                {/* Stage */}
                <td>
                  <span className="deal-stage-pill">
                    {deal.stage_name || `Stage ${deal.deal_stage || 1}`}
                  </span>
                </td>

                {/* Priority */}
                <td>
                  <span className={`deal-priority-pill ${priorityClass}`}>
                    {deal.deal_priority || "Medium"}
                  </span>
                </td>

                {/* Status */}
                <td>
                  <span className={`deal-status-badge ${statusClass}`}>
                    <span className="status-dot" />
                    {deal.deal_status || "Open"}
                  </span>
                </td>

                {/* Assigned Owner */}
                <td>
                  <div className="deal-owner-cell">
                    <div className="owner-tiny-avatar">{ownerInitial}</div>
                    <span>{deal.assigned_user_name || deal.deal_owner || "Suyash"}</span>
                  </div>
                </td>

                {/* Actions */}
                <td onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Link to={`/deal/${deal.deal_id}`} className="btn-table-view-deal">
                      <span>View Deal</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>

                    {isAdmin && onDeleteDeal && (
                      <button
                        type="button"
                        className="btn-table-delete-deal"
                        onClick={() => onDeleteDeal(deal.deal_id)}
                        title="Delete Deal"
                        style={{
                          background: "#fee2e2",
                          color: "#dc2626",
                          border: "1px solid #fecaca",
                          borderRadius: "7px",
                          padding: "6px 8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default DealTable;
