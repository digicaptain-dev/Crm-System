import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";

import api from "../services/api";

import "../styles/deals/deals.css";

import CreateDeal from "../components/deals/CreateDeal";
import DealTable from "../components/deals/DealTable";
import DealCard from "../components/deals/DealCard";
import DealImportPreview from "../components/deals/DealImportPreview";
import DealFilters from "../components/deals/DealFilters";
import AssignDealModal from "../components/deals/AssignDealModal";
import Modal from "../components/common/Modal";

function Deals() {
  const [deals, setDeals] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [users, setUsers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showCreateDeal, setShowCreateDeal] = useState(false);
  const [view, setView] = useState("table");

  const [importing, setImporting] = useState(false);
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [importPreview, setImportPreview] = useState(null);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDeals, setTotalDeals] = useState(0);
  const [limit, setLimit] = useState(15);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [pipelineFilter, setPipelineFilter] = useState("");
  const [assignedUserFilter, setAssignedUserFilter] = useState("");

  // KPI Metrics
  const [metrics, setMetrics] = useState({
    totalDeals: 0,
    totalPipelineValue: 0,
    openDeals: 0,
    wonValue: 0,
  });

  // Assignment
  const [selectedDeals, setSelectedDeals] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const fileInputRef = useRef(null);

  // Logged-in User
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("user"));
  } catch (error) {
    console.error("Failed to read logged-in user:", error);
  }
  const isAdmin = currentUser?.role === "admin";
  const canAddDeal = currentUser?.role === "admin" || currentUser?.role === "coworker";

  // =====================================================
  // FETCH DEALS
  // =====================================================
  const fetchDeals = useCallback(
    async (page = currentPage, currentLimit = limit) => {
      try {
        setLoading(true);

        const params = {
          page,
          limit: currentLimit,
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          pipeline_id: pipelineFilter || undefined,
          assign_to: isAdmin && assignedUserFilter ? assignedUserFilter : undefined,
        };

        const response = await api.get("/deals", { params });
        const fetchedDeals = response.data?.deals || [];
        const paginationInfo = response.data?.pagination || {};

        setDeals(Array.isArray(fetchedDeals) ? fetchedDeals : []);
        setTotalPages(paginationInfo.totalPages || 1);
        setTotalDeals(paginationInfo.totalDeals ?? fetchedDeals.length ?? 0);
        setCurrentPage(paginationInfo.currentPage || page);

        if (response.data?.metrics) {
          setMetrics(response.data.metrics);
        }

        return fetchedDeals;
      } catch (error) {
        console.error("Failed to fetch deals:", error);
        setDeals([]);
        setTotalPages(1);
        setTotalDeals(0);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [
      currentPage,
      limit,
      search,
      statusFilter,
      priorityFilter,
      pipelineFilter,
      assignedUserFilter,
      isAdmin,
    ]
  );

  // =====================================================
  // FETCH PIPELINES & USERS
  // =====================================================
  const fetchPipelines = async () => {
    try {
      const response = await api.get("/pipelines");
      const fetchedPipelines = Array.isArray(response.data)
        ? response.data
        : response.data?.pipelines || [];
      setPipelines(Array.isArray(fetchedPipelines) ? fetchedPipelines : []);
    } catch (error) {
      console.error("Failed to fetch pipelines:", error);
      setPipelines([]);
    }
  };

  const fetchUsers = async () => {
    if (!isAdmin) {
      setUsers([]);
      return;
    }
    try {
      const response = await api.get("/users");
      const fetchedUsers = response.data?.users || [];
      setUsers(Array.isArray(fetchedUsers) ? fetchedUsers : []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setUsers([]);
    }
  };

  useEffect(() => {
    fetchPipelines();
    fetchUsers();
  }, [isAdmin]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchDeals(currentPage, limit);
    }, 250);
    return () => clearTimeout(handler);
  }, [fetchDeals, currentPage, limit]);

  // =====================================================
  // SELECTION
  // =====================================================
  const handleSelectDeal = (dealId) => {
    setSelectedDeals((prev) =>
      prev.includes(dealId) ? prev.filter((id) => id !== dealId) : [...prev, dealId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDeals.length === deals.length) {
      setSelectedDeals([]);
    } else {
      setSelectedDeals(deals.map((d) => d.deal_id));
    }
  };

  // =====================================================
  // IMPORT CSV
  // =====================================================
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      setImporting(true);
      const response = await api.post("/deals/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.success) {
        setImportPreview(response.data);
        setShowImportPreview(true);
      } else {
        alert(response.data?.message || "Import failed.");
      }
    } catch (err) {
      console.error("Import error:", err);
      alert("Failed to upload deals file.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setPipelineFilter("");
    setAssignedUserFilter("");
    setCurrentPage(1);
  };

  // Pagination Window Generator
  const pageNumbers = useMemo(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
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
  }, [currentPage, totalPages]);

  const startIdx = totalDeals === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endIdx = Math.min(totalDeals, currentPage * limit);

  const formatCurrency = (val) => {
    if (!val || isNaN(val)) return "$0";
    return `$${Number(val).toLocaleString()}`;
  };

  // Single Deal Delete Handler
  const handleDeleteDeal = async (dealId) => {
    if (!window.confirm("Are you sure you want to delete this deal? This action cannot be undone.")) {
      return;
    }
    try {
      const res = await api.delete(`/deal/${dealId}`);
      if (res.data?.success) {
        alert("Deal deleted successfully.");
        setSelectedDeals((prev) => prev.filter((id) => id !== dealId));
        fetchDeals(currentPage, limit);
      }
    } catch (err) {
      console.error("Failed to delete deal:", err);
      alert(err.response?.data?.message || "Failed to delete deal.");
    }
  };

  // Bulk Deals Delete Handler
  const handleBulkDelete = async () => {
    if (selectedDeals.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to permanently delete ${selectedDeals.length} selected deal(s)? This action cannot be undone.`
      )
    ) {
      return;
    }
    try {
      const res = await api.delete("/deal", {
        data: { deal_ids: selectedDeals },
      });
      if (res.data?.success) {
        alert(`${selectedDeals.length} deal(s) deleted successfully.`);
        setSelectedDeals([]);
        fetchDeals(currentPage, limit);
      }
    } catch (err) {
      console.error("Failed to delete deals:", err);
      alert(err.response?.data?.message || "Failed to delete deals.");
    }
  };

  // Create Deal Handler
  const handleCreateDeal = async (dealData) => {
    try {
      const response = await api.post("/deal", dealData);
      if (response.data?.success) {
        setShowCreateDeal(false);
        fetchDeals(1, limit);
      } else {
        alert(response.data?.message || "Failed to create deal.");
      }
    } catch (err) {
      console.error("Create deal error:", err);
      alert(err.response?.data?.message || err.message || "Failed to create deal.");
    }
  };

  return (
    <div className="deals-page">
      {/* =================================================
          TOP HEADER CARD
      ================================================= */}
      <div className="deals-header-card">
        <div className="deals-header-top">
          <div className="deals-title-wrap">
            <h1>Deals & Sales Pipeline</h1>
            <p>Track, manage, assign, and advance opportunities across your active sales pipeline.</p>
          </div>

          <div className="deals-header-actions">
            {/* Refresh */}
            <button
              type="button"
              className="btn-refresh-deals"
              onClick={() => fetchDeals(currentPage, limit)}
              title="Refresh Deals"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>

            {/* Bulk Assign Button (if selected) */}
            {isAdmin && selectedDeals.length > 0 && (
              <button
                type="button"
                className="btn-bulk-assign"
                onClick={() => setShowAssignModal(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <line x1="20" y1="8" x2="20" y2="14" />
                  <line x1="23" y1="11" x2="17" y2="11" />
                </svg>
                <span>Assign Selected ({selectedDeals.length})</span>
              </button>
            )}

            {/* Bulk Delete Button (if selected) */}
            {isAdmin && selectedDeals.length > 0 && (
              <button
                type="button"
                className="btn-bulk-delete"
                onClick={handleBulkDelete}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                <span>Delete Selected ({selectedDeals.length})</span>
              </button>
            )}

            {/* Import CSV */}
            {canAddDeal && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".csv,.xlsx,.xls"
                  style={{ display: "none" }}
                />
                <button
                  type="button"
                  className="btn-import-deals"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={importing}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                  <span>{importing ? "Importing..." : "Import CSV"}</span>
                </button>
              </>
            )}

            {/* New Deal */}
            {canAddDeal && (
              <button
                type="button"
                className="btn-add-deal"
                onClick={() => setShowCreateDeal(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span>New Deal</span>
              </button>
            )}
          </div>
        </div>

        {/* TOOLBAR & FILTERS */}
        <DealFilters
          search={search}
          setSearch={(v) => {
            setSearch(v);
            setCurrentPage(1);
          }}
          status={statusFilter}
          setStatus={(v) => {
            setStatusFilter(v);
            setCurrentPage(1);
          }}
          priority={priorityFilter}
          setPriority={(v) => {
            setPriorityFilter(v);
            setCurrentPage(1);
          }}
          pipeline={pipelineFilter}
          setPipeline={(v) => {
            setPipelineFilter(v);
            setCurrentPage(1);
          }}
          pipelines={pipelines}
          assignedUser={assignedUserFilter}
          setAssignedUser={(v) => {
            setAssignedUserFilter(v);
            setCurrentPage(1);
          }}
          users={users}
          onReset={handleResetFilters}
          isAdmin={isAdmin}
          view={view}
          setView={setView}
        />
      </div>

      {/* =================================================
          KPI METRICS SUMMARY CARDS
      ================================================= */}
      <div className="deals-metrics-grid">
        <div className="deal-kpi-card">
          <div className="deal-kpi-info">
            <span className="deal-kpi-label">Total Deals in Pipeline</span>
            <span className="deal-kpi-val">{metrics.totalDeals}</span>
          </div>
          <div className="deal-kpi-icon icon-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
        </div>

        <div className="deal-kpi-card">
          <div className="deal-kpi-info">
            <span className="deal-kpi-label">Total Pipeline Value</span>
            <span className="deal-kpi-val">{formatCurrency(metrics.totalPipelineValue)}</span>
          </div>
          <div className="deal-kpi-icon icon-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </div>

        <div className="deal-kpi-card">
          <div className="deal-kpi-info">
            <span className="deal-kpi-label">Active Opportunities</span>
            <span className="deal-kpi-val">{metrics.openDeals}</span>
          </div>
          <div className="deal-kpi-icon icon-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </div>
        </div>

        <div className="deal-kpi-card">
          <div className="deal-kpi-info">
            <span className="deal-kpi-label">Won Revenue Realized</span>
            <span className="deal-kpi-val">{formatCurrency(metrics.wonValue)}</span>
          </div>
          <div className="deal-kpi-icon icon-amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
      </div>

      {/* =================================================
          MAIN CONTENT (TABLE OR CARDS WITH STICKY SCROLL)
      ================================================= */}
      <div className="deals-main-container">
        {loading && deals.length === 0 ? (
          <div className="deals-loading-card">
            <div className="deals-spinner" />
            <h3>Loading Deals Record...</h3>
            <p>Fetching opportunities from your pipeline database.</p>
          </div>
        ) : deals.length === 0 ? (
          <div className="deals-empty-card">
            <div className="deals-empty-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <h3>No Deals Found</h3>
            <p>No opportunities matched your active filter or search criteria.</p>
          </div>
        ) : view === "table" ? (
          <DealTable
            deals={deals}
            selectedDeals={selectedDeals}
            onSelectDeal={handleSelectDeal}
            onSelectAll={handleSelectAll}
            isAdmin={isAdmin}
            onDeleteDeal={handleDeleteDeal}
          />
        ) : (
          <div className="deal-cards-grid">
            {deals.map((deal) => (
              <DealCard key={deal.deal_id} deal={deal} />
            ))}
          </div>
        )}

        {/* =================================================
            PAGINATION BAR
        ================================================= */}
        {totalDeals > 0 && (
          <div className="deals-pagination-bar">
            <div className="pagination-left-info">
              <span className="pagination-total-text">
                Showing <strong>{startIdx}</strong> to <strong>{endIdx}</strong> of{" "}
                <strong>{totalDeals}</strong> deals
              </span>

              <div className="pagination-rows-selector">
                <span>Show:</span>
                <select
                  className="rows-dropdown"
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setCurrentPage(1);
                  }}
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
                onClick={() => setCurrentPage(1)}
                disabled={currentPage <= 1}
                title="First Page"
              >
                «
              </button>

              {/* Prev Page */}
              <button
                type="button"
                className="page-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
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
                    className={`page-btn ${currentPage === num ? "active" : ""}`}
                    onClick={() => setCurrentPage(num)}
                  >
                    {num}
                  </button>
                );
              })}

              {/* Next Page */}
              <button
                type="button"
                className="page-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                title="Next Page"
              >
                ›
              </button>

              {/* Last Page */}
              <button
                type="button"
                className="page-btn"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage >= totalPages}
                title="Last Page"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =================================================
          MODALS
      ================================================= */}
      {canAddDeal && showCreateDeal && (
        <Modal title="Create New Deal" onClose={() => setShowCreateDeal(false)}>
          <CreateDeal
            onClose={() => setShowCreateDeal(false)}
            onCreate={handleCreateDeal}
            pipelines={pipelines}
          />
        </Modal>
      )}

      {showImportPreview && importPreview && (
        <DealImportPreview
          previewData={importPreview}
          onClose={() => {
            setShowImportPreview(false);
            setImportPreview(null);
          }}
          onImportComplete={() => {
            setShowImportPreview(false);
            setImportPreview(null);
            fetchDeals(1, limit);
          }}
        />
      )}

      {showAssignModal && (
        <AssignDealModal
          selectedDealIds={selectedDeals}
          dealIds={selectedDeals}
          users={users}
          onClose={() => setShowAssignModal(false)}
          onAssigned={() => {
            setShowAssignModal(false);
            setSelectedDeals([]);
            fetchDeals(currentPage, limit);
          }}
        />
      )}
    </div>
  );
}

export default Deals;
