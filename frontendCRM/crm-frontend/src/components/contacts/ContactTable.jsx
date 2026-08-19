import "../../styles/contacts/contact-table.css";

function ContactTable({
  contacts,
  onDelete,
}) {
  return (
    <div className="contact-table-wrapper">

      <table className="contact-table">

        <thead>
          <tr>
            <th>Contact</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Company</th>
            <th>Owner</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>

          {contacts.map((contact) => (
            <tr key={contact.id}>

              <td>
                <div className="contact-table-user">

                  <div className="contact-avatar small">
                    {contact.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <span>
                    {contact.name}
                  </span>

                </div>
              </td>

              <td>
                {contact.email}
              </td>

              <td>
                {contact.phone}
              </td>

              <td>
                {contact.company}
              </td>

              <td>
                {contact.owner}
              </td>

              <td>
                <span
                  className={`contact-status ${contact.status.toLowerCase()}`}
                >
                  <span className="contact-status-dot" />
                  {contact.status}
                </span>
              </td>

              <td>
                <button
                  className="contact-table-action delete"
                  onClick={() =>
                    onDelete(contact.id)
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

export default ContactTable;