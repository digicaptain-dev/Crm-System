import "../../styles/contacts/contact-card.css";

function ContactCard({
  contact,
  onDelete,
}) {
  return (
    <div className="contact-card">

      <div className="contact-card-header">

        <div className="contact-avatar">
          {contact.name
            .charAt(0)
            .toUpperCase()}
        </div>

        <div>
          <div className="contact-name">
            {contact.name}
          </div>

          <div className="contact-company">
            {contact.company}
          </div>
        </div>

      </div>


      <div className="contact-card-info">

        <div>
          <span>Email</span>
          <strong>
            {contact.email}
          </strong>
        </div>

        <div>
          <span>Phone</span>
          <strong>
            {contact.phone}
          </strong>
        </div>

        <div>
          <span>Owner</span>
          <strong>
            {contact.owner}
          </strong>
        </div>

      </div>


      <div className="contact-card-footer">

        <span
          className={`contact-status ${contact.status.toLowerCase()}`}
        >
          <span className="contact-status-dot" />
          {contact.status}
        </span>

        <button
          className="contact-delete-button"
          onClick={() =>
            onDelete(contact.id)
          }
        >
          Delete
        </button>

      </div>

    </div>
  );
}

export default ContactCard;