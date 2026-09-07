import "../../styles/companies/company-table.css";

function CompanyTable({
  companies,
  onDelete,
}) {
  return (
    <div className="company-table-wrapper">

      <table className="company-table">

        <thead>
          <tr>
            <th>Company</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Industry</th>
            <th>Owner</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {companies.map((company) => (
            <tr key={company.id}>

              <td>
                <div className="company-table-user">

                  <div className="company-logo small">
                    {company.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <span>
                    {company.name}
                  </span>

                </div>
              </td>

              <td>{company.email}</td>

              <td>{company.phone}</td>

              <td>{company.industry}</td>

              <td>{company.owner}</td>

              <td>
                <span
                  className={`company-status ${company.status.toLowerCase()}`}
                >
                  <span className="company-status-dot" />
                  {company.status}
                </span>
              </td>

              <td>
                <button
                  className="company-table-action delete"
                  onClick={() =>
                    onDelete(company.id)
                  }
                >
                  Delete
                </button>
              </td>

            </tr>
          ))}

        </tbody>

      </table>

    </div>
  );
}

export default CompanyTable;