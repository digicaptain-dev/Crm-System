import "../../styles/companies/company-table.css";

function CompanyTable({ companies = [] }) {
  const getStatusClass = (status) => {
    const s = String(status || "Active").toLowerCase();
    return `status-${s}`;
  };

  return (
    <div className="company-table-wrapper">
      <table className="company-table">
        <thead>
          <tr>
            <th>Company / Organization</th>
            <th>Primary Contact</th>
            <th>Deals Count</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Location / City</th>
            <th>Status</th>
            <th>Assigned User</th>
          </tr>
        </thead>

        <tbody>
          {companies.map((company) => {
            const rawStatus = company.status || "Active";
            const statusClass = getStatusClass(rawStatus);
            const initial = (company.name || "C").charAt(0).toUpperCase();

            return (
              <tr key={company.id || company.name}>
                {/* Company Name & Avatar */}
                <td>
                  <div className="company-brand-cell">
                    <div className="company-logo-avatar">{initial}</div>
                    <div className="company-brand-info">
                      <span className="company-name-text">{company.name}</span>
                    </div>
                  </div>
                </td>

                {/* Primary Contact */}
                <td>
                  <span style={{ fontWeight: 600, color: "#334155" }}>
                    {company.primary_contact || "—"}
                  </span>
                </td>

                {/* Deals Count */}
                <td>
                  <span className="company-deals-badge">
                    💼 {company.deals_count || 1} {Number(company.deals_count) === 1 ? "Deal" : "Deals"}
                  </span>
                </td>

                {/* Email */}
                <td>
                  {company.email ? (
                    <a href={`mailto:${company.email}`} style={{ color: "#2563eb", textDecoration: "none", fontSize: "13px" }}>
                      {company.email}
                    </a>
                  ) : (
                    <span style={{ color: "#94a3b8" }}>—</span>
                  )}
                </td>

                {/* Phone */}
                <td>
                  {company.phone ? (
                    <a href={`tel:${company.phone}`} style={{ color: "#475569", textDecoration: "none", fontSize: "13px" }}>
                      {company.phone}
                    </a>
                  ) : (
                    <span style={{ color: "#94a3b8" }}>—</span>
                  )}
                </td>

                {/* Address */}
                <td>
                  <span style={{ color: "#64748b", fontSize: "12.5px" }}>
                    {company.address || "—"}
                  </span>
                </td>

                {/* Status */}
                <td>
                  <span className={`company-status-badge ${statusClass}`}>
                    <span className="status-dot" />
                    {rawStatus}
                  </span>
                </td>

                {/* Assigned User */}
                <td>
                  {company.assigned_user_name ? (
                    <span style={{ fontWeight: 600, color: "#334155" }}>
                      {company.assigned_user_name}
                    </span>
                  ) : (
                    <span style={{ color: "#94a3b8", fontSize: "12px", fontStyle: "italic" }}>
                      Not Assigned
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default CompanyTable;