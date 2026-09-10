import { useNavigate } from "react-router-dom";
import "../../styles/deals/deal-card.css";

function DealCard({ deal, onClick }) {
  const navigate = useNavigate();

  const handleOpenDeal = (e) => {
    e.stopPropagation();
    if (!deal?.deal_id) return;
    if (onClick) {
      onClick(deal);
      return;
    }
    navigate(`/deal/${deal.deal_id}`);
  };

  const priority = deal?.deal_priority || "Medium";
  const priorityClass = priority.toLowerCase().replace(/\s+/g, "-");

  const status = deal?.deal_status || "Open";
  const statusClass = status.toLowerCase().replace(/\s+/g, "-");

  const title = deal?.deal_name || deal?.deal_organization || "Untitled Deal";
  const organization =
    deal?.deal_organization && deal?.deal_organization !== deal?.deal_name
      ? deal.deal_organization
      : null;

  const contactPerson = deal?.contact_person || deal?.deal_owner || null;
  const initial = (title || "D").charAt(0).toUpperCase();

  const formattedCloseDate = deal?.close_date
    ? new Date(deal.close_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const stageName = deal?.stage_name || deal?.deal_stage_name || null;

  return (
    <div
      className="deal-grid-card"
      onClick={handleOpenDeal}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleOpenDeal(e);
        }
      }}
    >
      {/* Top Header */}
      <div className="deal-grid-card-top">
        <div className="deal-grid-profile">
          <div className="deal-grid-avatar">{initial}</div>
          <div className="deal-grid-headings">
            <h3 className="deal-grid-title" title={title}>
              {title}
            </h3>
            {organization && (
              <span className="deal-grid-suborg" title={organization}>
                {organization}
              </span>
            )}
          </div>
        </div>

        <div className="deal-grid-badges">
          <span className={`deal-priority-tag priority-${priorityClass}`}>
            {priority}
          </span>
          <span className={`deal-status-tag status-${statusClass}`}>
            <span className="status-dot" />
            {status}
          </span>
        </div>
      </div>

      {/* Body Details */}
      <div className="deal-grid-card-body">
        {stageName && (
          <div className="deal-grid-stage-pill">
            <span className="stage-pill-dot" />
            <span className="stage-pill-text">
              Stage: <strong>{stageName}</strong>
            </span>
          </div>
        )}

        {contactPerson && (
          <div className="deal-grid-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="deal-grid-text">
              Contact: <strong>{contactPerson}</strong>
            </span>
          </div>
        )}

        {deal?.customer_email && (
          <div className="deal-grid-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <a
              href={`mailto:${deal.customer_email}`}
              onClick={(e) => e.stopPropagation()}
              className="deal-grid-link"
              title={deal.customer_email}
            >
              {deal.customer_email}
            </a>
          </div>
        )}

        {deal?.customer_number && (
          <div className="deal-grid-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <a
              href={`tel:${deal.customer_number}`}
              onClick={(e) => e.stopPropagation()}
              className="deal-grid-link"
              title={deal.customer_number}
            >
              {deal.customer_number}
            </a>
          </div>
        )}

        {deal?.customer_address && (
          <div className="deal-grid-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="deal-grid-text" title={deal.customer_address}>
              {deal.customer_address}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="deal-grid-card-footer">
        <div className="deal-grid-footer-left">
          {deal?.assigned_user_name ? (
            <div
              className="deal-grid-user-pill"
              title={`Assigned to: ${deal.assigned_user_name}`}
            >
              <div className="deal-grid-user-avatar">
                {deal.assigned_user_name.charAt(0).toUpperCase()}
              </div>
              <span>{deal.assigned_user_name}</span>
            </div>
          ) : (
            <span className="deal-grid-unassigned">Not Assigned</span>
          )}

          {formattedCloseDate && (
            <span className="deal-grid-date-pill" title={`Close Date: ${formattedCloseDate}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{formattedCloseDate}</span>
            </span>
          )}
        </div>

        <button
          type="button"
          className="btn-card-open-deal"
          onClick={handleOpenDeal}
          title="Open deal details"
        >
          <span>View</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default DealCard;