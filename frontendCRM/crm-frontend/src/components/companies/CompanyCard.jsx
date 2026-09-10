import "../../styles/companies/company-card.css";

function CompanyCard({ company }) {
  const initial = (company.name || "C").charAt(0).toUpperCase();
  const rawStatus = company.status || "Active";
  const statusClass = String(rawStatus).toLowerCase();

  return (
    <div className="company-card">
      <div className="company-card-top">
        <div className="company-profile-header">
          <div className="company-card-avatar">{initial}</div>
          <div className="company-card-names">
            <h3 className="company-card-name">{company.name}</h3>
            {company.primary_contact && (
              <span className="company-card-contact">Contact: {company.primary_contact}</span>
            )}
          </div>
        </div>

        <span className={`company-status-badge status-${statusClass}`}>
          <span className="status-dot" />
          {rawStatus}
        </span>
      </div>

      <div className="company-card-body">
        {company.email && (
          <div className="company-card-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <a href={`mailto:${company.email}`}>{company.email}</a>
          </div>
        )}

        {company.phone && (
          <div className="company-card-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <a href={`tel:${company.phone}`}>{company.phone}</a>
          </div>
        )}

        {company.address && (
          <div className="company-card-row">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{company.address}</span>
          </div>
        )}

        <div className="company-card-row">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Account Owner: {company.owner_name || company.owner || "Suyash"}</span>
        </div>
      </div>

      <div className="company-card-footer">
        <span className="company-deals-badge">
          💼 {company.deals_count || 1} {Number(company.deals_count) === 1 ? "Deal" : "Deals"}
        </span>
      </div>
    </div>
  );
}

export default CompanyCard;