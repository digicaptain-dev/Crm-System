import { useMemo, useState } from "react";

import LeadCard from "../components/leads/LeadCard";
import LeadTable from "../components/leads/LeadTable";
import CreateLead from "../components/leads/CreateLead";
import Modal from "../components/common/Modal";

import "../styles/leads/leads.css";

const initialLeads = [
  {
    id: 1,
    name: "John Smith",
    company: "ABC Company",
    email: "john@example.com",
    phone: "+1 555 111 2222",
    owner: "John",
    status: "New",
  },
  {
    id: 2,
    name: "David Wilson",
    company: "XYZ Corporation",
    email: "david@example.com",
    phone: "+1 555 333 4444",
    owner: "David",
    status: "Contacted",
  },
  {
    id: 3,
    name: "Michael Brown",
    company: "Demo Company",
    email: "michael@example.com",
    phone: "+1 555 555 6666",
    owner: "Michael",
    status: "Qualified",
  },
  {
    id: 4,
    name: "Sarah Johnson",
    company: "Global Solutions",
    email: "sarah@example.com",
    phone: "+1 555 777 8888",
    owner: "Sarah",
    status: "Converted",
  },
];

const statuses = [
  "New",
  "Contacted",
  "Qualified",
  "Converted",
  "Lost",
];

function Leads() {
  const [leads, setLeads] = useState(initialLeads);

  const [activeStatus, setActiveStatus] = useState("All");

  const [search, setSearch] = useState("");

  const [view, setView] = useState("cards");

  const [showCreate, setShowCreate] = useState(false);

  const filteredLeads = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return leads.filter((lead) => {

      const matchesStatus =
        activeStatus === "All" ||
        lead.status === activeStatus;

      const matchesSearch =
        `${lead.name}
          ${lead.company}
          ${lead.email}
          ${lead.phone}
          ${lead.owner}`
          .toLowerCase()
          .includes(searchValue);

      return (
        matchesStatus &&
        matchesSearch
      );
    });
  }, [
    leads,
    activeStatus,
    search,
  ]);

  const handleCreateLead = (lead) => {
    setLeads((current) => [
      ...current,
      lead,
    ]);
  };

  return (
    <div className="leads-page">

      {/* =====================================
          HEADER
      ===================================== */}

      <div className="leads-header">

        <div>
          <h1>Leads</h1>

          <p>
            Manage and track your sales leads.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            setShowCreate(true)
          }
        >
          + Add Lead
        </button>

      </div>


      {/* =====================================
          STATISTICS
      ===================================== */}

      <div className="lead-statistics">

        <div className="lead-stat-card">

          <div className="stat-label">
            Total Leads
          </div>

          <div className="stat-value">
            {leads.length}
          </div>

        </div>

        <div className="lead-stat-card">

          <div className="stat-label">
            New
          </div>

          <div className="stat-value">
            {
              leads.filter(
                (lead) =>
                  lead.status === "New"
              ).length
            }
          </div>

        </div>

        <div className="lead-stat-card">

          <div className="stat-label">
            Qualified
          </div>

          <div className="stat-value">
            {
              leads.filter(
                (lead) =>
                  lead.status === "Qualified"
              ).length
            }
          </div>

        </div>

        <div className="lead-stat-card">

          <div className="stat-label">
            Converted
          </div>

          <div className="stat-value">
            {
              leads.filter(
                (lead) =>
                  lead.status === "Converted"
              ).length
            }
          </div>

        </div>

      </div>


      {/* =====================================
          CONTROLS
      ===================================== */}

      <div className="leads-controls">

        <div className="lead-tabs">

          <button
            className={
              activeStatus === "All"
                ? "lead-tab active"
                : "lead-tab"
            }
            onClick={() =>
              setActiveStatus("All")
            }
          >
            All
          </button>

          {statuses.map((status) => (
            <button
              key={status}
              className={
                activeStatus === status
                  ? "lead-tab active"
                  : "lead-tab"
              }
              onClick={() =>
                setActiveStatus(status)
              }
            >
              {status}
            </button>
          ))}

        </div>


        <div className="leads-control-right">

          <div className="lead-search">

            <input
              type="text"
              placeholder="Search leads..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>


          <div className="lead-view-toggle">

            <button
              className={
                view === "cards"
                  ? "lead-view-button active"
                  : "lead-view-button"
              }
              onClick={() =>
                setView("cards")
              }
            >
              Cards
            </button>

            <button
              className={
                view === "table"
                  ? "lead-view-button active"
                  : "lead-view-button"
              }
              onClick={() =>
                setView("table")
              }
            >
              Table
            </button>

          </div>

        </div>

      </div>


      {/* =====================================
          CONTENT
      ===================================== */}

      {view === "cards" ? (

        <div className="leads-grid">

          {filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
            />
          ))}

        </div>

      ) : (

        <LeadTable
          leads={filteredLeads}
        />

      )}


      {filteredLeads.length === 0 && (
        <div className="leads-empty-state">
          No leads found.
        </div>
      )}


      {/* =====================================
          CREATE LEAD MODAL
      ===================================== */}

      {showCreate && (
        <Modal
          title="Create Lead"
          onClose={() =>
            setShowCreate(false)
          }
        >

          <CreateLead
            onClose={() =>
              setShowCreate(false)
            }
            onCreate={handleCreateLead}
          />

        </Modal>
      )}

    </div>
  );
}

export default Leads;