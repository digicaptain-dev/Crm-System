import { useEffect, useMemo, useState } from "react";
import Modal from "../components/common/Modal";
import ContactCard from "../components/contacts/ContactCard";
import ContactTable from "../components/contacts/ContactTable";
import CreateContact from "../components/contacts/CreateContact";
import api from "../services/api";

import "../styles/contacts/contacts.css";

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Search & Filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view, setView] = useState("table");
  const [showCreate, setShowCreate] = useState(false);

  // Current user permissions
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("user"));
  } catch (err) {
    console.error("Failed to read user from localStorage:", err);
  }
  const canAddContact = currentUser?.role === "admin" || currentUser?.role === "coworker";

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Global KPIs State
  const [metrics, setMetrics] = useState({
    total: 0,
    open: 0,
    won: 0,
    companies: 0,
  });

  // =====================================================
  // FETCH CONTACTS FROM DATABASE WITH PAGINATION
  // =====================================================
  const fetchContacts = async (currentPage = page, currentLimit = limit, currentStatus = statusFilter, currentSearch = search) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/contacts", {
        params: {
          page: currentPage,
          limit: currentLimit,
          status: currentStatus,
          search: currentSearch,
        },
      });

      const data = response.data;
      if (data?.success) {
        setContacts(data.contacts || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      } else {
        setContacts([]);
      }
    } catch (err) {
      console.error("Fetch contacts error:", err);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to load contacts."
      );
    } finally {
      setLoading(false);
    }
  };

  // On page, limit, status, search change
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchContacts(page, limit, statusFilter, search);
    }, 250);

    return () => clearTimeout(handler);
  }, [page, limit, statusFilter, search]);

  // Reset page to 1 when search or status changes
  const handleSearchChange = (val) => {
    setSearch(val);
    setPage(1);
  };

  const handleStatusFilterChange = (st) => {
    setStatusFilter(st);
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

  // Calculate start & end record index
  const startIdx = total === 0 ? 0 : (page - 1) * limit + 1;
  const endIdx = Math.min(total, page * limit);

  // =====================================================
  // CREATE CONTACT HANDLER
  // =====================================================
  const handleCreateContact = (newContact) => {
    setShowCreate(false);
    fetchContacts(1, limit, statusFilter, search);
  };

  return (
    <div className="contacts-page">
      {/* =================================================
          TOP HEADER CARD
      ================================================= */}
      <div className="contacts-header-card">
        <div className="contacts-header-top">
          <div className="contacts-title-wrap">
            <h1>Contacts & Leads Directory</h1>
            <p>Centralized address book and customer profiles across all active pipeline deals.</p>
          </div>

          <div className="contacts-header-actions">
            <button
              type="button"
              className="btn-refresh-contacts"
              onClick={() => fetchContacts(page, limit, statusFilter, search)}
              title="Refresh Directory"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>

            {canAddContact && (
              <button
                type="button"
                className="btn-add-contact"
                onClick={() => setShowCreate(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>+ Add Contact</span>
              </button>
            )}
          </div>
        </div>

        {/* TOOLBAR: SEARCH, STATUS PILLS, VIEW SWITCHER */}
        <div className="contacts-toolbar">
          <div className="contacts-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              className="contacts-search-input"
              placeholder="Search by name, company, email, phone..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <div className="contacts-filter-group">
            <button
              type="button"
              className={`contact-pill-btn ${statusFilter === "all" ? "pill-active" : ""}`}
              onClick={() => handleStatusFilterChange("all")}
            >
              All ({metrics.total})
            </button>
            <button
              type="button"
              className={`contact-pill-btn ${statusFilter === "open" ? "pill-active" : ""}`}
              onClick={() => handleStatusFilterChange("open")}
            >
              ● Open ({metrics.open})
            </button>
            <button
              type="button"
              className={`contact-pill-btn ${statusFilter === "won" ? "pill-active" : ""}`}
              onClick={() => handleStatusFilterChange("won")}
            >
              ✓ Won ({metrics.won})
            </button>
          </div>

          {/* VIEW SWITCHER */}
          <div className="contacts-view-switcher">
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
      <div className="contacts-metrics-grid">
        <div className="contact-kpi-card">
          <div className="contact-kpi-info">
            <span className="contact-kpi-label">Total Contacts</span>
            <span className="contact-kpi-val">{metrics.total}</span>
          </div>
          <div className="contact-kpi-icon icon-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        </div>

        <div className="contact-kpi-card">
          <div className="contact-kpi-info">
            <span className="contact-kpi-label">Active Open Leads</span>
            <span className="contact-kpi-val">{metrics.open}</span>
          </div>
          <div className="contact-kpi-icon icon-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </div>
        </div>

        <div className="contact-kpi-card">
          <div className="contact-kpi-info">
            <span className="contact-kpi-label">Won Clients</span>
            <span className="contact-kpi-val">{metrics.won}</span>
          </div>
          <div className="contact-kpi-icon icon-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <div className="contact-kpi-card">
          <div className="contact-kpi-info">
            <span className="contact-kpi-label">Organizations</span>
            <span className="contact-kpi-val">{metrics.companies}</span>
          </div>
          <div className="contact-kpi-icon icon-amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
        </div>
      </div>

      {/* =================================================
          MAIN CONTENT (TABLE OR CARDS WITH STICKY SCROLL)
      ================================================= */}
      <div className="contacts-main-container">
        {loading && contacts.length === 0 ? (
          <div className="contacts-loading-card">
            <div className="contacts-spinner" />
            <h3>Loading Contacts...</h3>
            <p>Fetching paginated records from CRM database.</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="contacts-empty-card">
            <div className="contacts-empty-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <h3>No Contacts Found</h3>
            <p>No contacts matched your search query or filter criteria.</p>
          </div>
        ) : view === "table" ? (
          <ContactTable contacts={contacts} />
        ) : (
          <div className="contacts-cards-grid">
            {contacts.map((c) => (
              <ContactCard key={c.id || c.deal_id} contact={c} />
            ))}
          </div>
        )}

        {/* =================================================
            PAGINATION BAR
        ================================================= */}
        {total > 0 && (
          <div className="contacts-pagination-bar">
            <div className="pagination-left-info">
              <span className="pagination-total-text">
                Showing <strong>{startIdx}</strong> to <strong>{endIdx}</strong> of{" "}
                <strong>{total}</strong> contacts
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

              {/* Page Number Buttons */}
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
          CREATE CONTACT MODAL
      ================================================= */}
      {canAddContact && showCreate && (
        <Modal title="Add New Contact" onClose={() => setShowCreate(false)}>
          <CreateContact
            onClose={() => setShowCreate(false)}
            onCreate={handleCreateContact}
          />
        </Modal>
      )}
    </div>
  );
}

export default Contacts;