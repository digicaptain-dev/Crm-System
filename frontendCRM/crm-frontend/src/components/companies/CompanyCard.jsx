import "../../styles/companies/company-card.css";

function CompanyCard({
  company,
  onDelete,
}) {
  return (
    <div className="company-card">

      <div className="company-card-header">

        <div className="company-logo">
          {company.name
            .charAt(0)
            .toUpperCase()}
        </div>

        <div>
          <div className="company-name">
            {company.name}
          </div>

          <div className="company-industry">
            {company.industry}
          </div>
        </div>

      </div>


      <div className="company-card-info">

        <div>
          <span>Email</span>
          <strong>{company.email}</strong>
        </div>

        <div>
          <span>Phone</span>
          <strong>{company.phone}</strong>
        </div>

        <div>
          <span>Owner</span>
          <strong>{company.owner}</strong>
        </div>

        <div>
          <span>Website</span>
          <strong>{company.website}</strong>
        </div>

      </div>


      <div className="company-card-footer">

        <span
          className={`company-status ${company.status.toLowerCase()}`}
        >
          <span className="company-status-dot" />
          {company.status}
        </span>

        <button
          className="company-delete-button"
          onClick={() =>
            onDelete(company.id)
          }
        >
          Delete
        </button>

      </div>

    </div>
  );
}

export default CompanyCard;