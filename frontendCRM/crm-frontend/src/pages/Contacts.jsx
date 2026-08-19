import { useMemo, useState } from "react";

import Modal from "../components/common/Modal";
import ContactCard from "../components/contacts/ContactCard";
import ContactTable from "../components/contacts/ContactTable";
import CreateContact from "../components/contacts/CreateContact";

import "../styles/contacts/contacts.css";

const initialContacts = [
  {
    id: 1,
    name: "John Smith",
    email: "john@example.com",
    phone: "+1 555 123 4567",
    company: "ABC Company",
    owner: "John",
    status: "Active",
  },
  {
    id: 2,
    name: "David Wilson",
    email: "david@example.com",
    phone: "+1 555 987 6543",
    company: "XYZ Corporation",
    owner: "David",
    status: "Active",
  },
  {
    id: 3,
    name: "Michael Brown",
    email: "michael@example.com",
    phone: "+1 555 444 2222",
    company: "Demo Company",
    owner: "Mike",
    status: "Inactive",
  },
];

function Contacts() {
  const [contacts, setContacts] =
    useState(initialContacts);

  const [search, setSearch] =
    useState("");

  const [view, setView] =
    useState("table");

  const [showCreate, setShowCreate] =
    useState(false);

  const filteredContacts = useMemo(() => {
    const value = search.toLowerCase();

    return contacts.filter((contact) =>
      `${contact.name} ${contact.email} ${contact.company} ${contact.phone}`
        .toLowerCase()
        .includes(value)
    );
  }, [contacts, search]);

  const handleCreateContact = (contact) => {
    setContacts((current) => [
      ...current,
      {
        ...contact,
        id: Date.now(),
      },
    ]);

    setShowCreate(false);
  };

  const handleDeleteContact = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this contact?"
    );

    if (!confirmed) {
      return;
    }

    setContacts((current) =>
      current.filter(
        (contact) => contact.id !== id
      )
    );
  };

  return (
    <div className="contacts-page">

      {/* Header */}

      <div className="contacts-header">

        <div>
          <h1>Contacts</h1>

          <p>
            Manage your customer contacts.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            setShowCreate(true)
          }
        >
          + Add Contact
        </button>

      </div>


      {/* Statistics */}

      <div className="contact-statistics">

        <div className="contact-stat-card">
          <div className="stat-label">
            Total Contacts
          </div>

          <div className="stat-value">
            {contacts.length}
          </div>
        </div>

        <div className="contact-stat-card">
          <div className="stat-label">
            Active
          </div>

          <div className="stat-value">
            {
              contacts.filter(
                (contact) =>
                  contact.status === "Active"
              ).length
            }
          </div>
        </div>

        <div className="contact-stat-card">
          <div className="stat-label">
            Companies
          </div>

          <div className="stat-value">
            {
              new Set(
                contacts.map(
                  (contact) =>
                    contact.company
                )
              ).size
            }
          </div>
        </div>

      </div>


      {/* Controls */}

      <div className="contacts-controls">

        <div className="contact-search">
          <input
            type="text"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>


        <div className="contact-view-toggle">

          <button
            className={
              view === "table"
                ? "contact-view-button active"
                : "contact-view-button"
            }
            onClick={() =>
              setView("table")
            }
          >
            Table
          </button>

          <button
            className={
              view === "cards"
                ? "contact-view-button active"
                : "contact-view-button"
            }
            onClick={() =>
              setView("cards")
            }
          >
            Cards
          </button>

        </div>

      </div>


      {/* Content */}

      {view === "table" ? (

        <ContactTable
          contacts={filteredContacts}
          onDelete={handleDeleteContact}
        />

      ) : (

        <div className="contacts-card-grid">

          {filteredContacts.map(
            (contact) => (
              <ContactCard
                key={contact.id}
                contact={contact}
                onDelete={
                  handleDeleteContact
                }
              />
            )
          )}

        </div>

      )}


      {filteredContacts.length === 0 && (
        <div className="empty-contacts">
          No contacts found.
        </div>
      )}


      {/* Create Contact */}

      {showCreate && (
        <Modal
          title="Create Contact"
          onClose={() =>
            setShowCreate(false)
          }
        >
          <CreateContact
            onClose={() =>
              setShowCreate(false)
            }
            onCreate={
              handleCreateContact
            }
          />
        </Modal>
      )}

    </div>
  );
}

export default Contacts;