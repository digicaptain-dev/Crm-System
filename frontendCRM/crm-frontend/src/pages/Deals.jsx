import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

import api from "../services/api";

import "../styles/deals/deals.css";

import CreateDeal from "../components/deals/CreateDeal";
import DealTable from "../components/deals/DealTable";
import DealCard from "../components/deals/DealCard";
import DealImportPreview from "../components/deals/DealImportPreview";
import DealFilters from "../components/deals/DealFilters";
import AssignDealModal from "../components/deals/AssignDealModal";

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

  // =====================================================
  // PAGINATION STATES
  // =====================================================

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDeals, setTotalDeals] = useState(0);
  const [limit] = useState(10);

  // =====================================================
  // FILTERS
  // =====================================================

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [pipelineFilter, setPipelineFilter] = useState("");
  const [assignedUserFilter, setAssignedUserFilter] = useState("");

  // =====================================================
  // ASSIGNMENT
  // =====================================================

  const [selectedDeals, setSelectedDeals] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);

  const fileInputRef = useRef(null);

  // =====================================================
  // LOGGED-IN USER / ROLE
  // =====================================================

  let currentUser = null;

  try {
    currentUser = JSON.parse(
      localStorage.getItem("user")
    );
  } catch (error) {
    console.error(
      "Failed to read logged-in user:",
      error
    );
  }

  const isAdmin = currentUser?.role === "admin";

  // =====================================================
  // GET DEALS
  // =====================================================

  const fetchDeals = useCallback(
    async (page = currentPage) => {
      try {
        const params = {
          page,
          limit,

          search:
            search.trim() || undefined,

          status:
            statusFilter || undefined,

          priority:
            priorityFilter || undefined,

          pipeline_id:
            pipelineFilter || undefined,

          /*
           * Only send assigned-user filter for admin.
           *
           * Normal users should not be able to
           * request another user's deals.
           */
          assign_to:
            isAdmin && assignedUserFilter
              ? assignedUserFilter
              : undefined,
        };

        const response =
          await api.get("/deals", {
            params,
          });

        console.log(
          "Deals API response:",
          response.data
        );

        const fetchedDeals =
          response.data?.deals || [];

        const paginationInfo =
          response.data?.pagination || {};

        setDeals(
          Array.isArray(fetchedDeals)
            ? fetchedDeals
            : []
        );

        setTotalPages(
          paginationInfo.totalPages || 1
        );

        setTotalDeals(
          paginationInfo.totalDeals ||
            fetchedDeals.length ||
            0
        );

        setCurrentPage(
          paginationInfo.currentPage || page
        );

        return fetchedDeals;
      } catch (error) {
        console.error(
          "Failed to fetch deals:",
          error
        );

        setDeals([]);
        setTotalPages(1);
        setTotalDeals(0);

        return [];
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
  // GET PIPELINES
  // =====================================================

  const fetchPipelines = async () => {
    try {
      const response =
        await api.get("/pipelines");

      const fetchedPipelines =
        Array.isArray(response.data)
          ? response.data
          : response.data?.pipelines || [];

      setPipelines(
        Array.isArray(fetchedPipelines)
          ? fetchedPipelines
          : []
      );
    } catch (error) {
      console.error(
        "Failed to fetch pipelines:",
        error
      );

      setPipelines([]);
    }
  };

  // =====================================================
  // GET USERS
  // =====================================================

  const fetchUsers = async () => {
    /*
     * Normal users don't need the users list.
     * They cannot assign deals or manage users.
     */
    if (!isAdmin) {
      setUsers([]);
      return;
    }

    try {
      const response =
        await api.get("/users");

      const fetchedUsers =
        response.data?.users || [];

      setUsers(
        Array.isArray(fetchedUsers)
          ? fetchedUsers
          : []
      );
    } catch (error) {
      console.error(
        "Failed to fetch users:",
        error
      );

      setUsers([]);
    }
  };

  // =====================================================
  // PAGE CHANGE HANDLER
  // =====================================================

  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= totalPages
    ) {
      setCurrentPage(newPage);
    }
  };

  // =====================================================
  // RESET PAGE WHEN FILTER CHANGES
  // =====================================================

  useEffect(() => {
    setCurrentPage(1);
  }, [
    search,
    statusFilter,
    priorityFilter,
    pipelineFilter,
    assignedUserFilter,
  ]);

  // =====================================================
  // FETCH DEALS WHEN PAGE / FILTERS CHANGE
  // =====================================================

  useEffect(() => {
    fetchDeals(currentPage);
  }, [
    currentPage,
    search,
    statusFilter,
    priorityFilter,
    pipelineFilter,
    assignedUserFilter,
  ]);

  // =====================================================
  // INITIAL LOOKUP DATA
  // =====================================================

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);

      await Promise.all([
        fetchPipelines(),
        fetchUsers(),
      ]);

      setLoading(false);
    };

    loadInitialData();
  }, []);

  // =====================================================
  // SELECT SINGLE DEAL
  // =====================================================

  const handleSelectDeal = (dealId) => {
    /*
     * Selection is only useful for admin assignment.
     */
    if (!isAdmin) {
      return;
    }

    setSelectedDeals((current) =>
      current.includes(dealId)
        ? current.filter(
            (id) => id !== dealId
          )
        : [...current, dealId]
    );
  };

  // =====================================================
  // SELECT ALL DEALS ON CURRENT PAGE
  // =====================================================

  const handleSelectAll = (checked) => {
    if (!isAdmin) {
      return;
    }

    const currentPageIds =
      deals.map(
        (deal) => deal.deal_id
      );

    if (checked) {
      setSelectedDeals((current) => [
        ...new Set([
          ...current,
          ...currentPageIds,
        ]),
      ]);
    } else {
      setSelectedDeals((current) =>
        current.filter(
          (id) =>
            !currentPageIds.includes(id)
        )
      );
    }
  };

  // =====================================================
  // ASSIGN SINGLE DEAL
  // =====================================================

  const handleAssignDeal = (dealId) => {
    if (!isAdmin) {
      alert(
        "You do not have permission to assign deals."
      );
      return;
    }

    setSelectedDeals([dealId]);
    setShowAssignModal(true);
  };

  // =====================================================
  // RESET FILTERS
  // =====================================================

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setPipelineFilter("");
    setAssignedUserFilter("");
    setCurrentPage(1);
  };

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      await Promise.all([
        fetchDeals(currentPage),
        fetchPipelines(),
        fetchUsers(),
      ]);

      setSelectedDeals([]);
    } catch (error) {
      console.error(
        "Refresh deals error:",
        error
      );
    } finally {
      setRefreshing(false);
    }
  };

  // =====================================================
  // REMOVE STALE SELECTED DEAL IDS
  // =====================================================

  useEffect(() => {
    setSelectedDeals((current) =>
      current.filter((dealId) =>
        deals.some(
          (deal) =>
            deal.deal_id === dealId
        )
      )
    );
  }, [deals]);

  // =====================================================
  // CREATE DEAL
  // =====================================================

  const handleCreateDeal = async (
    dealData
  ) => {
    /*
     * Frontend permission guard.
     */
    if (!isAdmin) {
      alert(
        "You do not have permission to create deals."
      );
      return;
    }

    try {
      const response =
        await api.post(
          "/deal",
          dealData
        );

      if (!response.data?.success) {
        alert(
          response.data?.message ||
            response.data?.error ||
            "Failed to create deal."
        );

        return;
      }

      await fetchDeals(1);

      setShowCreateDeal(false);
    } catch (error) {
      console.error(
        "Failed to create deal:",
        error
      );

      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to create deal."
      );
    }
  };

  // =====================================================
  // OPEN IMPORT FILE SELECTOR
  // =====================================================

  const handleImportClick = () => {
    if (!isAdmin) {
      alert(
        "You do not have permission to import deals."
      );
      return;
    }

    if (!importing) {
      fileInputRef.current?.click();
    }
  };

  // =====================================================
  // EXCEL IMPORT PREVIEW
  // =====================================================

  const handleFileImport = async (
    event
  ) => {
    /*
     * Permission guard.
     */
    if (!isAdmin) {
      event.target.value = "";
      return;
    }

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.name
        .toLowerCase()
        .endsWith(".xlsx")
    ) {
      alert(
        "Please select an Excel .xlsx file."
      );

      event.target.value = "";
      return;
    }

    try {
      setImporting(true);

      const formData =
        new FormData();

      formData.append(
        "dealsFile",
        file
      );

      const response =
        await api.post(
          "/deals/upload/preview",
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      if (!response.data?.success) {
        alert(
          response.data?.message ||
            "Unable to preview Excel file."
        );

        return;
      }

      setImportPreview(
        response.data
      );

      setShowImportPreview(true);
    } catch (error) {
      console.error(
        "Failed to preview Excel:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to read Excel file."
      );
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  // =====================================================
  // CLOSE IMPORT PREVIEW
  // =====================================================

  const handleCloseImportPreview =
    () => {
      if (!importing) {
        setShowImportPreview(false);
        setImportPreview(null);
      }
    };

  // =====================================================
  // CONFIRM IMPORT
  // =====================================================

  const handleConfirmImport =
    async () => {
      /*
       * Permission guard.
       */
      if (!isAdmin) {
        alert(
          "You do not have permission to import deals."
        );
        return;
      }

      if (!importPreview) {
        return;
      }

      try {
        setImporting(true);

        const validRows =
          importPreview.rows?.filter(
            (row) => row.valid
          ) || [];

        if (validRows.length === 0) {
          alert(
            "There are no valid deals to import."
          );

          return;
        }

        const response =
          await api.post(
            "/deals/upload",
            {
              rows: validRows,
            }
          );

        if (!response.data?.success) {
          alert(
            response.data?.message ||
              "Failed to import deals."
          );

          return;
        }

        setShowImportPreview(false);
        setImportPreview(null);
        setSelectedDeals([]);

        await fetchDeals(1);

        alert(
          response.data?.message ||
            `Successfully imported ${
              response.data?.imported || 0
            } deals.`
        );
      } catch (error) {
        console.error(
          "Failed to import deals:",
          error
        );

        alert(
          error.response?.data?.message ||
            "Failed to import deals."
        );
      } finally {
        setImporting(false);
      }
    };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (loading) {
    return (
      <div className="deals-page">
        <div className="page-header">
          <div>
            <h1>Deals</h1>

            <p>
              Manage your deals and
              opportunities.
            </p>
          </div>
        </div>

        <div className="deals-content">
          <div className="deals-loading">
            Loading deals...
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN RENDER
  // =====================================================

  return (
    <div className="deals-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="page-header">
        <div>
          <h1>Deals</h1>

          <p>
            Manage your deals and
            opportunities.
          </p>
        </div>

        <div className="deals-header-actions">

          {/* Hidden Excel input */}

          {isAdmin && (
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              style={{
                display: "none",
              }}
              onChange={
                handleFileImport
              }
            />
          )}

          {/* REFRESH */}

          <button
            type="button"
            className="secondary-button"
            onClick={handleRefresh}
            disabled={
              refreshing ||
              importing
            }
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>

          {/* IMPORT EXCEL - ADMIN ONLY */}

          {isAdmin && (
            <button
              type="button"
              className="secondary-button"
              onClick={
                handleImportClick
              }
              disabled={
                importing ||
                refreshing
              }
            >
              {importing
                ? "Processing..."
                : "Import Excel"}
            </button>
          )}

          {/* ADD DEAL - ADMIN ONLY */}

          {isAdmin && (
            <button
              type="button"
              className="primary-button"
              onClick={() =>
                setShowCreateDeal(true)
              }
              disabled={importing}
            >
              + Add Deal
            </button>
          )}

        </div>
      </div>

      {/* =================================================
          FILTERS
      ================================================= */}

      <DealFilters
        search={search}
        setSearch={setSearch}
        status={statusFilter}
        setStatus={setStatusFilter}
        priority={priorityFilter}
        setPriority={setPriorityFilter}
        pipeline={pipelineFilter}
        setPipeline={setPipelineFilter}
        pipelines={pipelines}
        assignedUser={
          assignedUserFilter
        }
        setAssignedUser={
          setAssignedUserFilter
        }
        users={users}
        onReset={
          handleResetFilters
        }
        isAdmin={isAdmin}
      />

      {/* =================================================
          BULK ACTIONS - ADMIN ONLY
      ================================================= */}

      {isAdmin &&
        selectedDeals.length > 0 && (
          <div className="bulk-actions-bar">

            <div className="bulk-selection-info">
              <strong>
                {selectedDeals.length}
              </strong>{" "}
              {selectedDeals.length ===
              1
                ? "deal"
                : "deals"}{" "}
              selected
            </div>

            <div className="bulk-actions">

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  setShowAssignModal(
                    true
                  )
                }
              >
                Assign Deals
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setSelectedDeals([])
                }
              >
                Clear Selection
              </button>

            </div>
          </div>
        )}

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="deals-toolbar">

        <div className="deals-count">
          <strong>
            {totalDeals}
          </strong>{" "}
          {totalDeals === 1
            ? "Deal"
            : "Deals"}{" "}
          Total
        </div>

        <div className="view-buttons">

          <button
            type="button"
            className={
              view === "table"
                ? "active"
                : ""
            }
            onClick={() =>
              setView("table")
            }
          >
            Table
          </button>

          <button
            type="button"
            className={
              view === "cards"
                ? "active"
                : ""
            }
            onClick={() =>
              setView("cards")
            }
          >
            Cards
          </button>

        </div>
      </div>

      {/* =================================================
          DEALS DISPLAY
      ================================================= */}

      <div className="deals-content">

        {deals.length === 0 ? (
          <div className="empty-deals">

            <h3>
              No deals available
            </h3>

            <p>
              Try changing your
              filter settings, or add
              a new deal.
            </p>

            <button
              type="button"
              className="secondary-button"
              onClick={
                handleResetFilters
              }
            >
              Clear Filters
            </button>

          </div>
        ) : view === "table" ? (

          <DealTable
            deals={deals}
            selectedDeals={
              selectedDeals
            }
            onSelectDeal={
              handleSelectDeal
            }
            onSelectAll={
              handleSelectAll
            }
            onAssignDeal={
              handleAssignDeal
            }
            canAssign={isAdmin}
            currentPage={
              currentPage
            }
            totalPages={
              totalPages
            }
            onPageChange={
              handlePageChange
            }
          />

        ) : (

          <div className="deal-card-grid">

            {deals.map((deal) => (
              <DealCard
                key={deal.deal_id}
                deal={deal}
              />
            ))}

          </div>
        )}

        {/* =================================================
            PAGINATION
        ================================================= */}

        {totalPages > 1 && (
          <div
            className="pagination-controls"
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
              marginTop: "20px",
              padding: "12px 16px",
              background:
                "#ffffff",
              border:
                "1px solid #e5e7eb",
              borderRadius: "8px",
            }}
          >

            <button
              type="button"
              className="secondary-button"
              disabled={
                currentPage === 1
              }
              onClick={() =>
                handlePageChange(
                  currentPage - 1
                )
              }
            >
              ← Previous
            </button>

            <span
              style={{
                fontSize: "14px",
                color: "#374151",
              }}
            >
              Page{" "}
              <strong>
                {currentPage}
              </strong>{" "}
              of{" "}
              <strong>
                {totalPages}
              </strong>
            </span>

            <button
              type="button"
              className="secondary-button"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                handlePageChange(
                  currentPage + 1
                )
              }
            >
              Next →
            </button>

          </div>
        )}

      </div>

      {/* =================================================
          CREATE DEAL MODAL - ADMIN ONLY
      ================================================= */}

      {isAdmin &&
        showCreateDeal && (
          <div className="modal-overlay">

            <div className="modal">

              <div className="modal-header">

                <h2>
                  Create Deal
                </h2>

                <button
                  type="button"
                  className="modal-close"
                  onClick={() =>
                    setShowCreateDeal(
                      false
                    )
                  }
                >
                  ×
                </button>

              </div>

              <CreateDeal
                pipelines={
                  pipelines
                }
                onClose={() =>
                  setShowCreateDeal(
                    false
                  )
                }
                onCreate={
                  handleCreateDeal
                }
              />

            </div>
          </div>
        )}

      {/* =================================================
          IMPORT PREVIEW - ADMIN ONLY
      ================================================= */}

      {isAdmin &&
        showImportPreview &&
        importPreview && (
          <DealImportPreview
            preview={
              importPreview
            }
            importing={
              importing
            }
            onClose={
              handleCloseImportPreview
            }
            onImport={
              handleConfirmImport
            }
          />
        )}

      {/* =================================================
          ASSIGN MODAL - ADMIN ONLY
      ================================================= */}

      {isAdmin &&
        showAssignModal && (
          <AssignDealModal
            selectedDealIds={
              selectedDeals
            }
            onClose={() =>
              setShowAssignModal(
                false
              )
            }
            onAssigned={async () => {
              await fetchDeals(
                currentPage
              );

              setSelectedDeals(
                []
              );
            }}
          />
        )}

    </div>
  );
}

export default Deals;