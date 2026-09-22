import { useState, useMemo } from "react";
import api from "../../services/api";
import "../../styles/deals/deal-import-preview.css";

function DealImportPreview({
  preview,
  previewData,
  importing: propImporting,
  onClose,
  onImport,
  onImportComplete,
}) {
  const data = preview || previewData || {};
  const rows = data.rows || [];

  const [filterTab, setFilterTab] = useState("all"); // "all" | "new" | "existing" | "invalid"
  const [skipExisting, setSkipExisting] = useState(true); // Default to skipping existing leads
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [importProgress, setImportProgress] = useState("");

  const validRows = useMemo(() => rows.filter((r) => r.valid), [rows]);
  const invalidRows = useMemo(() => rows.filter((r) => !r.valid), [rows]);
  const newRows = useMemo(() => rows.filter((r) => r.valid && !r.is_existing), [rows]);
  const existingRows = useMemo(() => rows.filter((r) => r.valid && r.is_existing), [rows]);

  const hasNotes = useMemo(() => rows.some((r) => r.deal_notes && r.deal_notes.trim()), [rows]);
  const hasAssigned = useMemo(() => rows.some((r) => r.assigned_user || r.assigned_user_name), [rows]);

  // Determine which rows will actually be imported based on the user's choice
  const rowsToImport = useMemo(() => {
    if (skipExisting) {
      return newRows;
    }
    return validRows;
  }, [skipExisting, newRows, validRows]);

  // Filtered rows for displaying in the preview table
  const displayedRows = useMemo(() => {
    let list = rows;
    if (filterTab === "new") list = newRows;
    else if (filterTab === "existing") list = existingRows;
    else if (filterTab === "invalid") list = invalidRows;

    if (!searchTerm.trim()) return list;

    const term = searchTerm.toLowerCase().trim();
    return list.filter((r) => {
      const org = (r.deal_organization || r.deal_name || "").toLowerCase();
      const owner = (r.deal_owner || "").toLowerCase();
      const phone = (r.customer_number || "").toLowerCase();
      const email = (r.customer_email || "").toLowerCase();
      const website = (r.website || "").toLowerCase();
      const reason = (r.existing_reason || "").toLowerCase();
      return (
        org.includes(term) ||
        owner.includes(term) ||
        phone.includes(term) ||
        email.includes(term) ||
        website.includes(term) ||
        reason.includes(term)
      );
    });
  }, [rows, filterTab, newRows, existingRows, invalidRows, searchTerm]);

  const handleExecuteImport = async () => {
    if (rowsToImport.length === 0) {
      alert("No leads selected for import. All valid rows may already exist in CRM.");
      return;
    }

    if (onImport) {
      return onImport(rowsToImport);
    }

    try {
      setLoading(true);
      const CHUNK_SIZE = 1000;
      let totalImported = 0;

      for (let i = 0; i < rowsToImport.length; i += CHUNK_SIZE) {
        const chunk = rowsToImport.slice(i, i + CHUNK_SIZE);
        const currentCount = Math.min(i + CHUNK_SIZE, rowsToImport.length);
        setImportProgress(`Importing (${currentCount} / ${rowsToImport.length})...`);

        const res = await api.post("/deals/upload/commit", { rows: chunk });
        if (!res.data?.success && res.data?.success !== undefined) {
          throw new Error(res.data?.message || "Import batch failed.");
        }
        totalImported += res.data?.imported || chunk.length;
      }

      const skippedCount = rows.length - totalImported;
      const skippedMsg = skippedCount > 0 && skipExisting ? ` (${skippedCount} existing/invalid leads skipped)` : "";
      alert(`Successfully imported ${totalImported} leads!${skippedMsg}`);

      if (onImportComplete) {
        onImportComplete();
      } else if (onClose) {
        onClose();
      }
    } catch (err) {
      console.error("Import error:", err);
      const detail = err.response?.data?.error ? `\nDetails: ${err.response.data.error}` : "";
      alert((err.response?.data?.message || err.message || "Failed to commit imported leads.") + detail);
    } finally {
      setLoading(false);
      setImportProgress("");
    }
  };

  const isImporting = propImporting || loading;

  return (
    <div className="modal-overlay">
      <div className="import-preview-modal" style={{ maxWidth: "1080px" }}>
        {/* HEADER */}
        <div className="import-preview-header">
          <div>
            <h2>CSV / Excel Lead Import</h2>
            <p>Compare new leads against existing CRM records and choose your import strategy.</p>
          </div>

          <button
            className="modal-close"
            onClick={onClose}
            disabled={isImporting}
          >
            ×
          </button>
        </div>

        {/* SUMMARY STATS TILES */}
        <div className="import-summary-grid">
          <div
            className={`import-stat-card ${filterTab === "all" ? "active-stat" : ""}`}
            onClick={() => setFilterTab("all")}
          >
            <div className="stat-label">Total in File</div>
            <div className="stat-value">{rows.length}</div>
            <div className="stat-sub">100% rows</div>
          </div>

          <div
            className={`import-stat-card stat-new ${filterTab === "new" ? "active-stat" : ""}`}
            onClick={() => setFilterTab("new")}
          >
            <div className="stat-label">✨ New Leads</div>
            <div className="stat-value new-color">{newRows.length}</div>
            <div className="stat-sub">Ready to upload</div>
          </div>

          <div
            className={`import-stat-card stat-existing ${filterTab === "existing" ? "active-stat" : ""}`}
            onClick={() => setFilterTab("existing")}
          >
            <div className="stat-label">⚠️ Already in CRM</div>
            <div className="stat-value existing-color">{existingRows.length}</div>
            <div className="stat-sub">{skipExisting ? "Will be skipped" : "Can be re-imported"}</div>
          </div>

          {invalidRows.length > 0 && (
            <div
              className={`import-stat-card stat-invalid ${filterTab === "invalid" ? "active-stat" : ""}`}
              onClick={() => setFilterTab("invalid")}
            >
              <div className="stat-label">✕ Invalid / Incomplete</div>
              <div className="stat-value invalid-color">{invalidRows.length}</div>
              <div className="stat-sub">Missing required fields</div>
            </div>
          )}
        </div>

        {/* IMPORT STRATEGY BAR */}
        <div className="import-strategy-bar">
          <div className="strategy-option-box">
            <span className="strategy-title">Import Mode:</span>
            <label className={`strategy-radio-label ${skipExisting ? "selected" : ""}`}>
              <input
                type="radio"
                name="skipExistingToggle"
                checked={skipExisting}
                onChange={() => setSkipExisting(true)}
                disabled={isImporting}
              />
              <span className="radio-content">
                <strong>Upload Only NEW Leads ({newRows.length})</strong>
                <span className="strategy-sub">Skip {existingRows.length} existing duplicate records automatically</span>
              </span>
            </label>

            <label className={`strategy-radio-label ${!skipExisting ? "selected" : ""}`}>
              <input
                type="radio"
                name="skipExistingToggle"
                checked={!skipExisting}
                onChange={() => setSkipExisting(false)}
                disabled={isImporting}
              />
              <span className="radio-content">
                <strong>Upload ALL Leads ({validRows.length})</strong>
                <span className="strategy-sub">Include {existingRows.length} existing duplicate records</span>
              </span>
            </label>
          </div>

          {/* Quick Search */}
          <div className="import-search-box">
            <input
              type="text"
              placeholder="Search in preview..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="import-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="import-search-clear"
                onClick={() => setSearchTerm("")}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* FILTER TABS */}
        <div className="import-filter-tabs">
          <button
            type="button"
            className={`import-tab-btn ${filterTab === "all" ? "active" : ""}`}
            onClick={() => setFilterTab("all")}
          >
            All Rows ({rows.length})
          </button>
          <button
            type="button"
            className={`import-tab-btn ${filterTab === "new" ? "active" : ""}`}
            onClick={() => setFilterTab("new")}
          >
            ✨ New Leads Only ({newRows.length})
          </button>
          <button
            type="button"
            className={`import-tab-btn ${filterTab === "existing" ? "active" : ""}`}
            onClick={() => setFilterTab("existing")}
          >
            ⚠️ Already in CRM ({existingRows.length})
          </button>
          {invalidRows.length > 0 && (
            <button
              type="button"
              className={`import-tab-btn ${filterTab === "invalid" ? "active" : ""}`}
              onClick={() => setFilterTab("invalid")}
            >
              ✕ Invalid ({invalidRows.length})
            </button>
          )}
        </div>

        {/* TABLE */}
        <div className="import-preview-table-wrapper">
          <table className="import-preview-table">
            <thead>
              <tr>
                <th style={{ width: "50px" }}>#</th>
                <th>Status / CRM Match</th>
                <th>Company Name</th>
                <th>Contact Name</th>
                <th>Phone Number</th>
                <th>Email Address</th>
                <th>Website</th>
                <th>Location</th>
                {hasNotes && <th>Notes</th>}
                {hasAssigned && <th>Assigned To</th>}
              </tr>
            </thead>

            <tbody>
              {displayedRows.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                    No leads found matching current filter.
                  </td>
                </tr>
              ) : (
                displayedRows.map((row, index) => {
                  const isExisting = row.is_existing;
                  const isSkipped = isExisting && skipExisting;

                  return (
                    <tr
                      key={`${row.excel_row || index}-${index}`}
                      className={
                        !row.valid
                          ? "row-invalid"
                          : isExisting
                          ? isSkipped
                            ? "row-existing-skipped"
                            : "row-existing"
                          : "row-new"
                      }
                    >
                      <td style={{ color: "#94a3b8", fontSize: "12px" }}>
                        {row.excel_row || index + 1}
                      </td>

                      {/* Status / CRM Duplicate Detection Badge */}
                      <td>
                        {!row.valid ? (
                          <div className="status-badge-wrap">
                            <span className="import-badge badge-invalid">✕ Invalid</span>
                            {row.errors?.length > 0 && (
                              <span className="badge-detail error-text">{row.errors.join(", ")}</span>
                            )}
                          </div>
                        ) : isExisting ? (
                          <div className="status-badge-wrap">
                            <span className={`import-badge ${isSkipped ? "badge-skipped" : "badge-existing"}`}>
                              {isSkipped ? "⏭️ Skipped (In CRM)" : "⚠️ In CRM"}
                            </span>
                            {row.existing_reason && (
                              <span className="badge-detail" title={row.existing_reason}>
                                {row.existing_reason}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="status-badge-wrap">
                            <span className="import-badge badge-new">✨ New Lead</span>
                            <span className="badge-detail new-detail">Ready to add</span>
                          </div>
                        )}
                      </td>

                      <td>
                        <strong>{row.deal_organization || row.deal_name || "—"}</strong>
                      </td>

                      <td>{row.contact_person || row.deal_owner || "—"}</td>

                      <td>
                        <span style={{ whiteSpace: "nowrap" }}>{row.customer_number || "—"}</span>
                      </td>

                      <td>
                        <span style={{ fontSize: "12px", color: "#334155" }}>{row.customer_email || "—"}</span>
                      </td>

                      <td>
                        {row.website ? (
                          <span style={{ color: "#2563eb", wordBreak: "break-all", fontSize: "12px" }}>
                            {row.website}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td>
                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                          {row.customer_address || "—"}
                        </span>
                      </td>

                      {hasNotes && (
                        <td>
                          <span style={{ fontSize: "12px", color: "#0f172a" }}>
                            {row.deal_notes || "—"}
                          </span>
                        </td>
                      )}

                      {hasAssigned && (
                        <td>
                          {row.assigned_user_name || row.resolved?.assigned_user_name ? (
                            <span
                              style={{
                                fontSize: "12px",
                                fontWeight: 600,
                                color: row.auto_matched || row.resolved?.auto_matched ? "#1d4ed8" : "#166534",
                                background: row.auto_matched || row.resolved?.auto_matched ? "#dbeafe" : "#dcfce7",
                                padding: "2px 6px",
                                borderRadius: "4px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                              title={
                                row.auto_matched || row.resolved?.auto_matched
                                  ? "Auto-matched to employee based on existing Phone/Email/Website"
                                  : "Assigned employee"
                              }
                            >
                              👤 {row.assigned_user_name || row.resolved?.assigned_user_name}
                              {(row.auto_matched || row.resolved?.auto_matched) && (
                                <span style={{ fontSize: "10px", opacity: 0.85 }}>🔗 (Matched)</span>
                              )}
                            </span>
                          ) : row.assigned_user ? (
                            <span
                              style={{
                                fontSize: "12px",
                                color: "#b45309",
                                background: "#fef3c7",
                                padding: "2px 6px",
                                borderRadius: "4px",
                              }}
                              title="User not found in CRM"
                            >
                              ⚠️ {row.assigned_user} (Not found)
                            </span>
                          ) : (
                            <span style={{ fontSize: "12px", color: "#94a3b8" }}>Unassigned</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="import-preview-footer">
          <div className="import-footer-info">
            <span>
              Targeting: <strong>{rowsToImport.length}</strong> of {rows.length} leads
              {skipExisting && existingRows.length > 0 && (
                <span style={{ color: "#d97706", marginLeft: "6px" }}>
                  ({existingRows.length} existing duplicate leads will be skipped)
                </span>
              )}
            </span>
          </div>

          <div className="import-footer-btns">
            <button
              className="secondary-button"
              onClick={onClose}
              disabled={isImporting}
            >
              Cancel
            </button>

            <button
              className="primary-button"
              onClick={handleExecuteImport}
              disabled={isImporting || rowsToImport.length === 0}
              style={{ minWidth: "220px" }}
            >
              {isImporting
                ? (importProgress || "Importing...")
                : skipExisting
                ? `Import ${rowsToImport.length} New Leads`
                : `Import All ${rowsToImport.length} Leads`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DealImportPreview;