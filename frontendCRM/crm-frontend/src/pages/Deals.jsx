import { useEffect, useRef, useState } from "react";
import api from "../services/api";

import "../styles/deals/deals.css";

import CreateDeal from "../components/deals/CreateDeal";
import DealTable from "../components/deals/DealTable";
import DealCard from "../components/deals/DealCard";
import DealImportPreview from "../components/deals/DealImportPreview";

// const API_URL = "http://localhost:1000/api";

function Deals() {
  const [deals, setDeals] = useState([]);
  const [pipelines, setPipelines] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showCreateDeal, setShowCreateDeal] = useState(false);

  const [view, setView] = useState("table");

  const [importing, setImporting] = useState(false);

  const [showImportPreview, setShowImportPreview] =
    useState(false);

  const [importPreview, setImportPreview] =
    useState(null);

  const fileInputRef = useRef(null);

  // =====================================================
  // GET DEALS
  // =====================================================
  const fetchDeals = async () => {
    try {
      const response = await api.get("/deals");

      console.log(
        "Deals API response:",
        response.data
      );

      const fetchedDeals =
        response.data?.deals ||
        response.data ||
        [];

      console.log(
        "Fetched deals:",
        fetchedDeals
      );

      setDeals(fetchedDeals);

    } catch (error) {
      console.error(
        "Failed to fetch deals:",
        error
      );

      setDeals([]);
    }
  };

  // =====================================================
  // GET PIPELINES
  // =====================================================
  const fetchPipelines = async () => {
    try {
      const response = await api.get("/pipelines");

      console.log(
        "Deals page pipelines:",
        response.data
      );

      setPipelines(
        Array.isArray(response.data)
          ? response.data
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
  // INITIAL LOAD
  // =====================================================
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      await Promise.all([
        fetchDeals(),
        fetchPipelines(),
      ]);

      setLoading(false);
    };

    loadData();
  }, []);

  // =====================================================
  // CREATE DEAL
  // =====================================================
  const handleCreateDeal = async (dealData) => {
    try {
      console.log(
        "Creating deal:",
        dealData
      );

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

      const newDeal =
        response.data?.deal;

      // -----------------------------------------------
      // If backend doesn't return created deal
      // -----------------------------------------------
      if (!newDeal) {
        await fetchDeals();

        setShowCreateDeal(false);

        return;
      }

      // -----------------------------------------------
      // Put newly created deal at TOP
      // -----------------------------------------------
      setDeals((currentDeals) => [
        newDeal,
        ...currentDeals,
      ]);

      // -----------------------------------------------
      // Close modal
      // -----------------------------------------------
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
  // OPEN EXCEL FILE SELECTOR
  // =====================================================
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // =====================================================
  // READ EXCEL + GET PREVIEW
  // =====================================================
  const handleFileImport = async (event) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    // ---------------------------------------------------
    // Only XLSX
    // ---------------------------------------------------
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

      // IMPORTANT:
      // This matches your existing multer:
      // upload.single("dealsFile")
      formData.append(
        "dealsFile",
        file
      );

      console.log(
        "Preparing Excel preview:",
        file.name
      );

      // -------------------------------------------------
      // Existing mount stays:
      //
      // /api/deals/upload
      //
      // We will add /preview inside the router.
      // -------------------------------------------------
      const response = await api.post(
        "/deals/upload/preview",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
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

      // -------------------------------------------------
      // Store preview data
      // -------------------------------------------------
      setImportPreview(
        response.data
      );

      // -------------------------------------------------
      // Open preview modal
      // -------------------------------------------------
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

      // Reset input so same file can
      // be selected again
      event.target.value = "";
    }
  };

  // =====================================================
  // CLOSE IMPORT PREVIEW
  // =====================================================
  const handleCloseImportPreview = () => {
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

      // -------------------------------------------------
      // IMPORTANT
      //
      // We send the validated rows as JSON.
      // Backend will perform the actual DB insertion.
      // -------------------------------------------------
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

      // -------------------------------------------------
      // Close preview
      // -------------------------------------------------
      setShowImportPreview(false);

      setImportPreview(null);

      // -------------------------------------------------
      // Refresh from database
      //
      // Backend GET /deals uses:
      // ORDER BY creation_date DESC
      //
      // So latest imported deals will appear at TOP.
      // -------------------------------------------------
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
              Manage your deals and
              opportunities.
            </p>
          </div>

        </div>

        <div className="deals-content">
          <p>Loading deals...</p>
        </div>

      </div>
    );
  }

  // =====================================================
  // PAGE
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

          {/* ---------------------------------------------
              Hidden Excel input
          --------------------------------------------- */}

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

          {/* ---------------------------------------------
              Import Excel
          --------------------------------------------- */}

          <button
            className="secondary-button"
            onClick={
              handleImportClick
            }
            disabled={importing}
          >
            {importing
              ? "Processing..."
              : "Import Excel"}
          </button>

          {/* ---------------------------------------------
              Add Deal
          --------------------------------------------- */}

          <button
            className="primary-button"
            onClick={() =>
              setShowCreateDeal(true)
            }
          >
            + Add Deal
          </button>

        </div>

      </div>

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="deals-toolbar">

        <div className="deals-count">

          <strong>
            {deals.length}
          </strong>{" "}

          {deals.length === 1
            ? "Deal"
            : "Deals"}

        </div>

        <div className="view-buttons">

          <button
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
          DEALS CONTENT
      ================================================= */}

      <div className="deals-content">

        {deals.length === 0 ? (

          <div className="empty-deals">

            <h3>
              No deals available
            </h3>

            <p>
              Add a deal manually or
              import deals from Excel.
            </p>

            <button
              className="primary-button"
              onClick={() =>
                setShowCreateDeal(true)
              }
            >
              + Add Deal
            </button>

          </div>

        ) : view === "table" ? (

          <DealTable
            deals={deals}
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

      </div>

      {/* =================================================
          CREATE DEAL MODAL
      ================================================= */}

      {showCreateDeal && (

        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <h2>
                Create Deal
              </h2>

              <button
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
              onCreate={
                handleCreateDeal
              }
            />

          </div>

        </div>

      )}

      {/* =================================================
          IMPORT PREVIEW MODAL
      ================================================= */}

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

    </div>
  );
}

export default Deals;