import { Link } from "react-router-dom";
import "../../styles/contacts/contact-table.css";

function ContactTable({ contacts = [] }) {
  const getStatusClass = (status) => {
    const s = String(status || "Open").toLowerCase().replace(/\s+/g, "-");
    return `status-${s}`;
  };

  return (
    <div className="contact-table-wrapper">
      <table className="contact-table">
        <thead>
          <tr>
            <th>Contact / Name</th>
            <th>Company / Org</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Status</th>
            <th>Assigned User</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {contacts.map((contact) => {
            const rawStatus = contact.status || "Open";
            const statusClass = getStatusClass(rawStatus);
            const initial = (contact.name || "C").charAt(0).toUpperCase();

            return (
              <tr key={contact.id || contact.deal_id}>
                {/* Contact Name & Deal Link */}
                <td>
                  <div className="contact-user-cell">
                    <div className="contact-avatar-circle">{initial}</div>
                    <div className="contact-user-info">
                      <span className="contact-primary-name">{contact.name || "Unnamed Contact"}</span>
                      {contact.deal_id && (
                        <Link to={`/deal/${contact.deal_id}`} className="contact-deal-link" title="Open Deal">
                          💼 {contact.deal_name || "Deal Details"}
                        </Link>
                      )}
                    </div>
                  </div>
                </td>

                {/* Company */}
                <td>
                  {contact.company ? (
                    <div className="contact-company-badge">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                      </svg>
                      <span>{contact.company}</span>
                    </div>
                  ) : (
                    <span style={{ color: "#94a3b8" }}>—</span>
                  )}
                </td>

                {/* Email */}
                <td>
                  {contact.email ? (
                    <a href={`mailto:${contact.email}`} className="contact-link-email" title="Send Email">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                      <span>{contact.email}</span>
                    </a>
                  ) : (
                    <span style={{ color: "#94a3b8" }}>—</span>
                  )}
                </td>

                {/* Phone */}
                <td>
                  {contact.phone ? (
                    <a href={`tel:${contact.phone}`} className="contact-link-phone" title="Call Contact">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      <span>{contact.phone}</span>
                    </a>
                  ) : (
                    <span style={{ color: "#94a3b8" }}>—</span>
                  )}
                </td>

                {/* Status */}
                <td>
                  <span className={`contact-status-badge ${statusClass}`}>
                    <span className="status-indicator-dot" />
                    {rawStatus}
                  </span>
                </td>

                {/* Assigned User */}
                <td>
                  {contact.assigned_user_name ? (
                    <span style={{ fontWeight: 600, color: "#334155" }}>
                      {contact.assigned_user_name}
                    </span>
                  ) : (
                    <span style={{ color: "#94a3b8", fontSize: "12px", fontStyle: "italic" }}>
                      Not Assigned
                    </span>
                  )}
                </td>

                {/* Action */}
                <td>
                  <div className="contact-row-actions">
                    {contact.deal_id ? (
                      <Link to={`/deal/${contact.deal_id}`} className="btn-row-deal">
                        <span>View Deal</span>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </Link>
                    ) : (
                      <span style={{ color: "#94a3b8" }}>—</span>
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

export default ContactTable;