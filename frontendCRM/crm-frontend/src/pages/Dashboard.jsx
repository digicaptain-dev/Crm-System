import { useMemo, useState } from "react";

import DealCard from "../components/deals/DealCard";
import DealTable from "../components/deals/DealTable";
import CreateDeal from "../components/deals/CreateDeal";
import Modal from "../components/common/Modal";

import "../styles/dashboard/dashboard.css";

const initialDeals = [
  {
    id: 1,
    name: "ABC Website",
    company: "ABC Company",
    email: "john@example.com",
    owner: "John",
    value: "$10,000",
    priority: "High",
    stage: "New Leads",
  },
  {
    id: 2,
    name: "XYZ Project",
    company: "XYZ Corporation",
    email: "david@example.com",
    owner: "David",
    value: "$20,000",
    priority: "Medium",
    stage: "Contacted",
  },
  {
    id: 3,
    name: "Website Redesign",
    company: "Demo Company",
    email: "mike@example.com",
    owner: "Mike",
    value: "$15,000",
    priority: "Low",
    stage: "Proposal",
  },
];

const stages = [
  "New Leads",
  "Contacted",
  "Proposal",
  "Won",
];

function Dashboard() {
  const [deals, setDeals] = useState(initialDeals);

  const [view, setView] = useState("kanban");

  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);

  const filteredDeals = useMemo(() => {
    const value = search.toLowerCase();

    return deals.filter((deal) =>
      `${deal.name} ${deal.company} ${deal.email}`
        .toLowerCase()
        .includes(value)
    );
  }, [deals, search]);

  // Drag Start
  const handleDragStart = (e, deal) => {
    e.dataTransfer.setData(
      "dealId",
      String(deal.id)
    );
  };

  // Drop Deal Into Stage
  const handleDrop = (e, stage) => {
    e.preventDefault();

    const dealId = Number(
      e.dataTransfer.getData("dealId")
    );

    setDeals((current) =>
      current.map((deal) =>
        deal.id === dealId
          ? {
              ...deal,
              stage: stage,
            }
          : deal
      )
    );
  };

  const handleCreateDeal = (deal) => {
    setDeals((current) => [
      ...current,
      deal,
    ]);
  };

  const handleDealClick = (deal) => {
    console.log("Selected deal:", deal);
  };

  return (
    <div className="dashboard">

      {/* Toolbar */}
      <div className="dashboard-toolbar">

        <div className="pipeline-selector">
          <label>Pipeline:</label>

          <select defaultValue="sales">
            <option value="sales">
              Sales
            </option>

            <option value="marketing">
              Marketing
            </option>
          </select>
        </div>

        <div className="quick-actions">

          <button
            className="secondary-button"
            onClick={() => { }}
          >
            Upload Deals
          </button>

          <button
            className="secondary-button"
            onClick={() => { }}
          >
            Assign Deals
          </button>

          <button
            className="primary-button"
            onClick={() => setShowCreate(true)}
          >
            + Add Deal
          </button>

        </div>
      </div>

      {/* Search + View */}
      <div className="deals-controls">

        <div className="dashboard-search">
          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search deals..."
          />
        </div>

        <div className="view-toggle">

          <button
            className={
              view === "kanban"
                ? "view-button active"
                : "view-button"
            }
            onClick={() => setView("kanban")}
          >
            Kanban
          </button>

          <button
            className={
              view === "table"
                ? "view-button active"
                : "view-button"
            }
            onClick={() => setView("table")}
          >
            Table
          </button>

        </div>

      </div>

      {/* Content */}
      {view === "kanban" ? (

        <div className="pipeline-board">

          {stages.map((stage) => {

            const stageDeals =
              filteredDeals.filter(
                (deal) =>
                  deal.stage === stage
              );

            return (
              <div
                className="stage"
                key={stage}
                onDragOver={(e) =>
                  e.preventDefault()
                }
                onDrop={(e) =>
                  handleDrop(e, stage)
                }
              >

                <div className="stage-header">

                  <div className="stage-name">
                    {stage}
                  </div>

                  <span className="stage-count">
                    {stageDeals.length}
                  </span>

                </div>

                {stageDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onDragStart={handleDragStart}
                  />
                ))}

              </div>
            );
          })}

        </div>

      ) : (

        <DealTable
          deals={filteredDeals}
        />

      )}

      {/* Create Deal */}
      {showCreate && (
        <Modal
          title="Create Deal"
          onClose={() =>
            setShowCreate(false)
          }
        >
          <CreateDeal
            onClose={() =>
              setShowCreate(false)
            }
            onCreate={handleCreateDeal}
          />
        </Modal>
      )}

    </div>
  );
}

export default Dashboard;