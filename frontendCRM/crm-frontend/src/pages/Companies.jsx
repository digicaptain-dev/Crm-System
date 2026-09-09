import { useEffect, useMemo, useState } from "react";
import Modal from "../components/common/Modal";
import CompanyCard from "../components/companies/CompanyCard";
import CompanyTable from "../components/companies/CompanyTable";
import CreateCompany from "../components/companies/CreateCompany";
import api from "../services/api";

import "../styles/companies/companies.css";

function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filters
  const [search, setSearch] = useState("");
  const [view, setView] = useState("table");
  const [showCreate, setShowCreate] = useState(false);

  // Current user permissions
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("user"));
  } catch (err) {
    console.error("Failed to read user from localStorage:", err);
  }
  const canAddCompany = currentUser?.role === "admin" || currentUser?.role === "coworker";

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Global KPIs State
  const [metrics, setMetrics] = useState({
    totalCompanies: 0,
    totalPipelineValue: 0,
    totalDeals: 0,
    wonValue: 0,
  });

  // =====================================================
  // FETCH COMPANIES FROM DATABASE WITH PAGINATION
  // =====================================================
  const fetchCompanies = async (currentPage = page, currentLimit = limit, currentSearch = search) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/companies", {
        params: {
          page: currentPage,
          limit: currentLimit,
          search: currentSearch,
        },
      });

      const data = response.data;
      if (data?.success) {
        setCompanies(data.companies || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      } else {
        setCompanies([]);
      }
    } catch (err) {
      console.error("Fetch companies error:", err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to load companies."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCompanies(page, limit, search);
    }, 250);

    return () => clearTimeout(handler);
  }, [page, limit, search]);

  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(Number(newLimit));
    setPage(1);
  };

  // =====================================================
  // PAGINATION PAGE GENERATOR
  // =====================================================
  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
        range.push(i);
      }
    }

    let l;
    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  }, [page, totalPages]);

  const startIdx = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIdx = Math.min(total, page * limit);

  const formatCurrency = (val) => {
    if (!val || isNaN(val)) return "$0";
    return `$${Number(val).toLocaleString()}`;
  };

  const handleCreateCompany = (newCompany) => {
    setShowCreate(false);
    fetchCompanies(1, limit, search);
  };

  return (
    <div className="companies-page">
      {/* =================================================
          TOP HEADER CARD
      ================================================= */}
      <div className="companies-header-card">
        <div className="companies-header-top">
          <div className="companies-title-wrap">
            <h1>Companies & Organizations</h1>
            <p>Corporate account directory, business profiles, and revenue lifetime tracking.</p>
          </div>

          <div className="companies-header-actions">
            <button
              type="button"
              className="btn-refresh-companies"
              onClick={() => fetchCompanies(page, limit, search)}
              title="Refresh Directory"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>

            {canAddCompany && (
              <button
                type="button"
                className="btn-add-company"
                onClick={() => setShowCreate(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>+ Add Company</span>
              </button>
            )}
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="companies-toolbar">
          <div className="companies-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="companies-search-input"
              placeholder="Search by company name, email, location..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          {/* VIEW SWITCHER */}
          <div className="companies-view-switcher">
            <button
              type="button"
              className={`view-btn ${view === "table" ? "active" : ""}`}
              onClick={() => setView("table")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
              <span>Table</span>
            </button>
            <button
              type="button"
              className={`view-btn ${view === "cards" ? "active" : ""}`}
              onClick={() => setView("cards")}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Cards</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "12px 18px", borderRadius: "10px", fontSize: "13.5px", fontWeight: 500, border: "1px solid #fecaca" }}>
          ⚠️ {error}
        </div>
      )}

      {/* =================================================
          KPI METRICS SUMMARY CARDS
      ================================================= */}
      <div className="companies-metrics-grid">
        <div className="company-kpi-card">
          <div className="company-kpi-info">
            <span className="company-kpi-label">Total Organizations</span>
            <span className="company-kpi-val">{metrics.totalCompanies}</span>
          </div>
          <div className="company-kpi-icon icon-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
        </div>

        <div className="company-kpi-card">
          <div className="company-kpi-info">
            <span className="company-kpi-label">Total Pipeline Value</span>
            <span className="company-kpi-val">{formatCurrency(metrics.totalPipelineValue)}</span>
          </div>
          <div className="company-kpi-icon icon-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </div>

        <div className="company-kpi-card">
          <div className="company-kpi-info">
            <span className="company-kpi-label">Associated Deals</span>
            <span className="company-kpi-val">{metrics.totalDeals}</span>
          </div>
          <div className="company-kpi-icon icon-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </div>
        </div>

        <div className="company-kpi-card">
          <div className="company-kpi-info">
            <span className="company-kpi-label">Closed Won Revenue</span>
            <span className="company-kpi-val">{formatCurrency(metrics.wonValue)}</span>
          </div>
          <div className="company-kpi-icon icon-amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
      </div>

      {/* =================================================
          MAIN CONTENT (TABLE OR CARDS WITH STICKY SCROLL)
      ================================================= */}
      <div className="companies-main-container">
        {loading && companies.length === 0 ? (
          <div className="companies-loading-card">
            <div className="companies-spinner" />
            <h3>Loading Companies...</h3>
            <p>Fetching aggregated corporate accounts from CRM database.</p>
          </div>
        ) : companies.length === 0 ? (
          <div className="companies-empty-card">
            <div className="companies-empty-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <h3>No Companies Found</h3>
            <p>No organizations matched your search query.</p>
          </div>
        ) : view === "table" ? (
          <CompanyTable companies={companies} />
        ) : (
          <div className="companies-cards-grid">
            {companies.map((comp) => (
              <CompanyCard key={comp.id || comp.name} company={comp} />
            ))}
          </div>
        )}

        {/* =================================================
            PAGINATION BAR
        ================================================= */}
        {total > 0 && (
          <div className="companies-pagination-bar">
            <div className="pagination-left-info">
              <span className="pagination-total-text">
                Showing <strong>{startIdx}</strong> to <strong>{endIdx}</strong> of{" "}
                <strong>{total}</strong> companies
              </span>

              <div className="pagination-rows-selector">
                <span>Show:</span>
                <select
                  className="rows-dropdown"
                  value={limit}
                  onChange={(e) => handleLimitChange(e.target.value)}
                >
                  <option value={10}>10 / page</option>
                  <option value={15}>15 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>

            <div className="pagination-controls">
              {/* First Page */}
              <button
                type="button"
                className="page-btn"
                onClick={() => setPage(1)}
                disabled={page <= 1}
                title="First Page"
              >
                «
              </button>

              {/* Prev Page */}
              <button
                type="button"
                className="page-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                title="Previous Page"
              >
                ‹
              </button>

              {/* Page Numbers */}
              {pageNumbers.map((num, idx) => {
                if (num === "...") {
                  return (
                    <span key={`dots-${idx}`} className="pagination-ellipsis">
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={num}
                    type="button"
                    className={`page-btn ${page === num ? "active" : ""}`}
                    onClick={() => setPage(num)}
                  >
                    {num}
                  </button>
                );
              })}

              {/* Next Page */}
              <button
                type="button"
                className="page-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                title="Next Page"
              >
                ›
              </button>

              {/* Last Page */}
              <button
                type="button"
                className="page-btn"
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                title="Last Page"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =================================================
          CREATE COMPANY MODAL
      ================================================= */}
      {canAddCompany && showCreate && (
        <Modal title="Add New Company" onClose={() => setShowCreate(false)}>
          <CreateCompany
            onClose={() => setShowCreate(false)}
            onCreate={handleCreateCompany}
          />
        </Modal>
      )}
    </div>
  );
}

export default Companies;