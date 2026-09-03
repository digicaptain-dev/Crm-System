import { useEffect, useMemo, useRef, useState } from "react";
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
  // GET DEALS
  // =====================================================

  const fetchDeals = async () => {
    try {
      const response = await api.get("/deals");

      console.log("Deals API response:", response.data);

      const fetchedDeals =
        response.data?.deals ||
        response.data ||
        [];

      const normalizedDeals = Array.isArray(fetchedDeals)
        ? fetchedDeals
        : [];

      console.log("Fetched deals:", normalizedDeals);

      setDeals(normalizedDeals);

      return normalizedDeals;
    } catch (error) {
      console.error("Failed to fetch deals:", error);

      setDeals([]);

      return [];
    }
  };

  // =====================================================
  // GET PIPELINES
  // =====================================================

  const fetchPipelines = async () => {
    try {
      const response = await api.get("/pipelines");

      console.log("Deals page pipelines:", response.data);

      const fetchedPipelines = Array.isArray(response.data)
        ? response.data
        : response.data?.pipelines || [];

      setPipelines(
        Array.isArray(fetchedPipelines)
          ? fetchedPipelines
          : []
      );
    } catch (error) {
      console.error("Failed to fetch pipelines:", error);

      setPipelines([]);
    }
  };

  // =====================================================
  // GET USERS
  // =====================================================

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");

      console.log("Deals page users:", response.data);

      const fetchedUsers =
        response.data?.users || [];

      setUsers(
        Array.isArray(fetchedUsers)
          ? fetchedUsers
          : []
      );
    } catch (error) {
      console.error("Failed to fetch users:", error);

      setUsers([]);
    }
  };

  // =====================================================
  // FILTER DEALS
  // =====================================================

  const filteredDeals = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return deals.filter((deal) => {
      const dealName =
        deal.deal_name?.toLowerCase() || "";

      const organization =
        deal.deal_organization?.toLowerCase() || "";

      const email =
        deal.customer_email?.toLowerCase() || "";

      const customerName =
        deal.contact_person?.toLowerCase() || "";

      const customerNumber =
        deal.customer_number?.toLowerCase() || "";

      const assignedUserName =
        deal.assigned_user_name?.toLowerCase() || "";

      const assignedUserEmail =
        deal.assigned_user_email?.toLowerCase() || "";

      const matchesSearch =
        !searchValue ||
        dealName.includes(searchValue) ||
        organization.includes(searchValue) ||
        email.includes(searchValue) ||
        customerName.includes(searchValue) ||
        customerNumber.includes(searchValue) ||
        assignedUserName.includes(searchValue) ||
        assignedUserEmail.includes(searchValue);

      const matchesStatus =
        !statusFilter ||
        deal.deal_status === statusFilter;

      const matchesPriority =
        !priorityFilter ||
        deal.deal_priority === priorityFilter;

      const matchesPipeline =
        !pipelineFilter ||
        String(deal.pipeline_id) ===
        String(pipelineFilter);

      // ---------------------------------------------------
      // ASSIGNED USER FILTER
      // ---------------------------------------------------

      const matchesAssignedUser =
        !assignedUserFilter ||
        (assignedUserFilter === "unassigned"
          ? !deal.assign_to
          : String(deal.assign_to) ===
          String(assignedUserFilter));

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesPipeline &&
        matchesAssignedUser
      );
    });
  }, [
    deals,
    search,
    statusFilter,
    priorityFilter,
    pipelineFilter,
    assignedUserFilter,
  ]);

  // =====================================================
  // SELECT SINGLE DEAL
  // =====================================================

  const handleSelectDeal = (dealId) => {
    setSelectedDeals((current) => {
      if (current.includes(dealId)) {
        return current.filter(
          (id) => id !== dealId
        );
      }

      return [...current, dealId];
    });
  };

  // =====================================================
  // SELECT ALL FILTERED DEALS
  // =====================================================

  const handleSelectAll = (checked) => {
    const filteredIds = filteredDeals.map(
      (deal) => deal.deal_id
    );

    if (checked) {
      setSelectedDeals((current) => [
        ...new Set([
          ...current,
          ...filteredIds,
        ]),
      ]);
    } else {
      setSelectedDeals((current) =>
        current.filter(
          (id) => !filteredIds.includes(id)
        )
      );
    }
  };

  // =====================================================
  // ASSIGN SINGLE DEAL
  // =====================================================

  const handleAssignDeal = (dealId) => {
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
  };

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      await Promise.all([
        fetchDeals(),
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
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      await Promise.all([
        fetchDeals(),
        fetchPipelines(),
        fetchUsers(),
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

  // =====================================================
  // REMOVE STALE SELECTED DEALS
  // =====================================================

  useEffect(() => {
    setSelectedDeals((current) =>
      current.filter((dealId) =>
        deals.some(
          (deal) => deal.deal_id === dealId
        )
      )
    );
  }, [deals]);

  // =====================================================
  // CREATE DEAL
  // =====================================================

  const handleCreateDeal = async (dealData) => {
    try {
      console.log("Creating deal:", dealData);

      const response = await api.post(
        "/deal",
        dealData
      );

      console.log(
        "Create deal response:",
        response.data
      );

      if (!response.data?.success) {
        alert(
          response.data?.message ||
          response.data?.error ||
          "Failed to create deal."
        );

        return;
      }

      const newDeal = response.data?.deal;

      if (!newDeal) {
        await fetchDeals();

        setShowCreateDeal(false);

        return;
      }

      setDeals((currentDeals) => [
        newDeal,
        ...currentDeals,
      ]);

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
  // OPEN EXCEL SELECTOR
  // =====================================================

  const handleImportClick = () => {
    if (importing) {
      return;
    }

    fileInputRef.current?.click();
  };

  // =====================================================
  // EXCEL PREVIEW
  // =====================================================

  const handleFileImport = async (event) => {
    const file = event.target.files?.[0];

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

      const formData = new FormData();

      formData.append(
        "dealsFile",
        file
      );

      console.log(
        "Preparing Excel preview:",
        file.name
      );

      const response = await api.post(
        "/deals/upload/preview",
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      console.log(
        "Excel preview response:",
        response.data
      );

      if (!response.data?.success) {
        alert(
          response.data?.message ||
          "Unable to preview Excel file."
        );

        return;
      }

      setImportPreview(response.data);
      setShowImportPreview(true);
    } catch (error) {
      console.error(
        "Failed to preview Excel:",
        error
      );

      alert(
        error.response?.data?.message ||
        error.response?.data?.error ||
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

  const handleCloseImportPreview = () => {
    if (importing) {
      return;
    }

    setShowImportPreview(false);
    setImportPreview(null);
  };

  // =====================================================
  // CONFIRM BULK IMPORT
  // =====================================================

  const handleConfirmImport = async () => {
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

      console.log(
        "Importing valid deals:",
        validRows.length
      );

      const response = await api.post(
        "/deals/upload",
        {
          rows: validRows,
        }
      );

      console.log(
        "Bulk import response:",
        response.data
      );

      if (!response.data?.success) {
        alert(
          response.data?.message ||
          response.data?.error ||
          "Failed to import deals."
        );

        return;
      }

      setShowImportPreview(false);
      setImportPreview(null);
      setSelectedDeals([]);

      await fetchDeals();

      alert(
        response.data?.message ||
        `Successfully imported ${response.data?.imported || 0
        } deals.`
      );
    } catch (error) {
      console.error(
        "Failed to import deals:",
        error
      );

      alert(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to import deals."
      );
    } finally {
      setImporting(false);
    }
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="deals-page">

        <div className="page-header">

          <div>
            <h1>Deals</h1>

            <p>
              Manage your deals and opportunities.
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
  // PAGE
  // =====================================================

  return (
    <div className="deals-page">

      {/* HEADER */}

      <div className="page-header">

        <div>

          <h1>Deals</h1>

          <p>
            Manage your deals and opportunities.
          </p>

        </div>

        <div className="deals-header-actions">

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            style={{ display: "none" }}
            onChange={handleFileImport}
          />

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

          <button
            type="button"
            className="secondary-button"
            onClick={handleImportClick}
            disabled={
              importing ||
              refreshing
            }
          >
            {importing
              ? "Processing..."
              : "Import Excel"}
          </button>

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

        </div>

      </div>

      {/* FILTERS */}

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
        assignedUser={assignedUserFilter}
        setAssignedUser={setAssignedUserFilter}
        users={users}
        onReset={handleResetFilters}
      />

      {/* BULK ACTIONS */}

      {selectedDeals.length > 0 && (
        <div className="bulk-actions-bar">

          <div className="bulk-selection-info">

            <strong>
              {selectedDeals.length}
            </strong>{" "}

            {selectedDeals.length === 1
              ? "deal"
              : "deals"}{" "}
            selected

          </div>

          <div className="bulk-actions">

            <button
              type="button"
              className="primary-button"
              onClick={() =>
                setShowAssignModal(true)
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

      {/* TOOLBAR */}

      <div className="deals-toolbar">

        <div className="deals-count">

          <strong>
            {filteredDeals.length}
          </strong>{" "}

          {filteredDeals.length === 1
            ? "Deal"
            : "Deals"}

          {filteredDeals.length !==
            deals.length && (
              <span>
                {" "}
                of {deals.length}
              </span>
            )}

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

      {/* DEALS */}

      <div className="deals-content">

        {deals.length === 0 ? (

          <div className="empty-deals">

            <h3>
              No deals available
            </h3>

            <p>
              Add a deal manually or import
              deals from Excel.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={() =>
                setShowCreateDeal(true)
              }
            >
              + Add Deal
            </button>

          </div>

        ) : filteredDeals.length === 0 ? (

          <div className="empty-deals">

            <h3>
              No matching deals
            </h3>

            <p>
              Try changing your search or
              filter settings.
            </p>

            <button
              type="button"
              className="secondary-button"
              onClick={handleResetFilters}
            >
              Clear Filters
            </button>

          </div>

        ) : view === "table" ? (

          <DealTable
            deals={filteredDeals}
            selectedDeals={selectedDeals}
            onSelectDeal={handleSelectDeal}
            onSelectAll={handleSelectAll}
            onAssignDeal={handleAssignDeal}
          />

        ) : (

          <div className="deal-card-grid">

            {filteredDeals.map((deal) => (
              <DealCard
                key={deal.deal_id}
                deal={deal}
              />
            ))}

          </div>

        )}

      </div>

      {/* CREATE DEAL MODAL */}

      {showCreateDeal && (
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
                  setShowCreateDeal(false)
                }
              >
                ×
              </button>

            </div>

            <CreateDeal
              pipelines={pipelines}
              onClose={() =>
                setShowCreateDeal(false)
              }
              onCreate={handleCreateDeal}
            />

          </div>

        </div>
      )}

      {/* IMPORT PREVIEW */}

      {showImportPreview &&
        importPreview && (
          <DealImportPreview
            preview={importPreview}
            importing={importing}
            onClose={
              handleCloseImportPreview
            }
            onImport={
              handleConfirmImport
            }
          />
        )}

      {/* ASSIGN MODAL */}

      {showAssignModal && (
        <AssignDealModal
          selectedDealIds={selectedDeals}
          onClose={() =>
            setShowAssignModal(false)
          }
          onAssigned={async () => {
            await fetchDeals();

            setSelectedDeals([]);
          }}
        />
      )}

    </div>
  );
}

export default Deals;