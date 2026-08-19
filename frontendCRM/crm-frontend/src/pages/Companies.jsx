import { useMemo, useState } from "react";

import Modal from "../components/common/Modal";
import CompanyCard from "../components/companies/CompanyCard";
import CompanyTable from "../components/companies/CompanyTable";
import CreateCompany from "../components/companies/CreateCompany";

import "../styles/companies/companies.css";

const initialCompanies = [
  {
    id: 1,
    name: "ABC Company",
    email: "contact@abc.com",
    phone: "+1 555 123 4567",
    website: "www.abc.com",
    industry: "Technology",
    owner: "John",
    status: "Active",
  },
  {
    id: 2,
    name: "XYZ Corporation",
    email: "info@xyz.com",
    phone: "+1 555 987 6543",
    website: "www.xyz.com",
    industry: "Finance",
    owner: "David",
    status: "Active",
  },
  {
    id: 3,
    name: "Demo Company",
    email: "hello@demo.com",
    phone: "+1 555 444 2222",
    website: "www.demo.com",
    industry: "Marketing",
    owner: "Mike",
    status: "Inactive",
  },
];

function Companies() {
  const [companies, setCompanies] =
    useState(initialCompanies);

  const [search, setSearch] =
    useState("");

  const [view, setView] =
    useState("table");

  const [showCreate, setShowCreate] =
    useState(false);

  const filteredCompanies = useMemo(() => {
    const value = search.toLowerCase();

    return companies.filter((company) =>
      `${company.name}
       ${company.email}
       ${company.industry}
       ${company.owner}`
        .toLowerCase()
        .includes(value)
    );
  }, [companies, search]);

  const handleCreateCompany = (company) => {
    setCompanies((current) => [
      ...current,
      {
        ...company,
        id: Date.now(),
      },
    ]);

    setShowCreate(false);
  };

  const handleDeleteCompany = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this company?"
    );

    if (!confirmed) {
      return;
    }

    setCompanies((current) =>
      current.filter(
        (company) => company.id !== id
      )
    );
  };

  return (
    <div className="companies-page">

      {/* Header */}

      <div className="companies-header">

        <div>
          <h1>Companies</h1>

          <p>
            Manage your customer companies.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={() =>
            setShowCreate(true)
          }
        >
          + Add Company
        </button>

      </div>


      {/* Statistics */}

      <div className="company-statistics">

        <div className="company-stat-card">
          <div className="stat-label">
            Total Companies
          </div>

          <div className="stat-value">
            {companies.length}
          </div>
        </div>

        <div className="company-stat-card">
          <div className="stat-label">
            Active
          </div>

          <div className="stat-value">
            {
              companies.filter(
                (company) =>
                  company.status === "Active"
              ).length
            }
          </div>
        </div>

        <div className="company-stat-card">
          <div className="stat-label">
            Industries
          </div>

          <div className="stat-value">
            {
              new Set(
                companies.map(
                  (company) =>
                    company.industry
                )
              ).size
            }
          </div>
        </div>

      </div>


      {/* Controls */}

      <div className="companies-controls">

        <div className="company-search">
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>

        <div className="company-view-toggle">

          <button
            className={
              view === "table"
                ? "company-view-button active"
                : "company-view-button"
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
                ? "company-view-button active"
                : "company-view-button"
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

        <CompanyTable
          companies={filteredCompanies}
          onDelete={handleDeleteCompany}
        />

      ) : (

        <div className="companies-card-grid">

          {filteredCompanies.map(
            (company) => (
              <CompanyCard
                key={company.id}
                company={company}
                onDelete={
                  handleDeleteCompany
                }
              />
            )
          )}

        </div>

      )}


      {filteredCompanies.length === 0 && (
        <div className="empty-companies">
          No companies found.
        </div>
      )}


      {/* Create Company */}

      {showCreate && (
        <Modal
          title="Create Company"
          onClose={() =>
            setShowCreate(false)
          }
        >
          <CreateCompany
            onClose={() =>
              setShowCreate(false)
            }
            onCreate={
              handleCreateCompany
            }
          />
        </Modal>
      )}

    </div>
  );
}

export default Companies;