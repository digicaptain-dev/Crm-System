import { useEffect, useRef, useState } from "react";
import axios from "axios";

import "../styles/deals/deals.css";

import CreateDeal from "../components/deals/CreateDeal";
import DealTable from "../components/deals/DealTable";
import DealCard from "../components/deals/DealCard";

const API_URL = "http://localhost:1000/api";

function Deals() {
  const [deals, setDeals] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDeal, setShowCreateDeal] = useState(false);
  const [view, setView] = useState("table");
  const [importing, setImporting] = useState(false);

  const fileInputRef = useRef(null);

  // ================================
  // GET DEALS
  // ================================
  const fetchDeals = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/deals`
      );

      console.log("Deals API response:", response.data);

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

  // ================================
  // GET PIPELINES
  // ================================
  const fetchPipelines = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/pipelines`
      );

      console.log(
        "Deals page pipelines:",
        response.data
      );

      setPipelines(response.data || []);

    } catch (error) {
      console.error(
        "Failed to fetch pipelines:",
        error
      );

      setPipelines([]);
    }
  };

  // ================================
  // INITIAL LOAD
  // ================================
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

  // ================================
  // CREATE DEAL
  // ================================
  const handleCreateDeal = async (dealData) => {
    try {
      console.log(
        "Creating deal:",
        dealData
      );

      const response = await axios.post(
        `${API_URL}/deal`,
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

      /*
       * Backend returns newly created deal
       */
      const newDeal =
        response.data.deal;

      /*
       * Add immediately to frontend
       */
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

  // ================================
  // OPEN FILE SELECTOR
  // ================================
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // ================================
  // IMPORT EXCEL
  // ================================
  const handleFileImport = async (event) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedExtensions = [
      ".xlsx",
      ".xls",
    ];

    const fileName =
      file.name.toLowerCase();

    const isValidFile =
      allowedExtensions.some(
        (extension) =>
          fileName.endsWith(extension)
      );

    if (!isValidFile) {
      alert(
        "Please select an Excel file (.xlsx or .xls)."
      );

      event.target.value = "";
      return;
    }

    try {
      setImporting(true);

      const formData =
        new FormData();

      formData.append(
        "file",
        file
      );

      console.log(
        "Importing Excel:",
        file.name
      );

      const response =
        await axios.post(
          `${API_URL}/deals/import`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      console.log(
        "Import response:",
        response.data
      );

      alert(
        response.data?.message ||
        `Successfully imported ${
          response.data?.imported || 0
        } deals.`
      );

      await fetchDeals();

    } catch (error) {
      console.error(
        "Failed to import deals:",
        error
      );

      alert(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Failed to import Excel file."
      );

    } finally {
      setImporting(false);

      event.target.value = "";
    }
  };

  // ================================
  // LOADING
  // ================================
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

  // ================================
  // PAGE
  // ================================
  return (
    <div className="deals-page">

      {/* HEADER */}
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            style={{
              display: "none",
            }}
            onChange={
              handleFileImport
            }
          />

          {/* Import */}
          <button
            className="secondary-button"
            onClick={
              handleImportClick
            }
            disabled={importing}
          >
            {importing
              ? "Importing..."
              : "Import Excel"}
          </button>

          {/* Add Deal */}
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

      {/* TOOLBAR */}
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

      {/* DEALS */}
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

      {/* CREATE DEAL MODAL */}
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

    </div>
  );
}

export default Deals;