import { useState } from "react";
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

  const validRows = rows.filter((row) => row.valid);
  const invalidRows = rows.filter((row) => !row.valid);
  const hasNotes = rows.some((r) => r.deal_notes && r.deal_notes.trim());
  const hasAssigned = rows.some((r) => r.assigned_user || r.assigned_user_name);

  const [loading, setLoading] = useState(false);
  const [importProgress, setImportProgress] = useState("");

  const handleExecuteImport = async () => {
    if (validRows.length === 0) return;

    if (onImport) {
      return onImport(validRows);
    }

    try {
      setLoading(true);
      const CHUNK_SIZE = 1000;
      let totalImported = 0;

      for (let i = 0; i < validRows.length; i += CHUNK_SIZE) {
        const chunk = validRows.slice(i, i + CHUNK_SIZE);
        const currentCount = Math.min(i + CHUNK_SIZE, validRows.length);
        setImportProgress(`Importing (${currentCount} / ${validRows.length})...`);

        const res = await api.post("/deals/upload/commit", { rows: chunk });
        if (!res.data?.success && res.data?.success !== undefined) {
          throw new Error(res.data?.message || "Import batch failed.");
        }
        totalImported += res.data?.imported || chunk.length;
      }

      alert(`Successfully imported all ${totalImported} leads!`);
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
      <div className="import-preview-modal" style={{ maxWidth: "980px" }}>
        {/* HEADER */}
        <div className="import-preview-header">
          <div>
            <h2>Import Leads & Deals</h2>
            <p>Review validated Excel / CSV data before importing into your CRM.</p>
          </div>

          <button
            className="modal-close"
            onClick={onClose}
            disabled={isImporting}
          >
            ×
          </button>
        </div>

        {/* SUMMARY */}
        <div className="import-summary">
          <div className="import-summary-card">
            <strong>{data?.total || rows.length || 0}</strong>
            <span>Total Rows</span>
          </div>

          <div className="import-summary-card valid">
            <strong>{data?.valid ?? validRows.length}</strong>
            <span>Valid Rows</span>
          </div>

          <div className="import-summary-card invalid">
            <strong>{data?.invalid ?? invalidRows.length}</strong>
            <span>Invalid Rows</span>
          </div>
        </div>

        {/* TABLE */}
        <div className="import-preview-table-wrapper">
          <table className="import-preview-table">
            <thead>
              <tr>
                <th>Row</th>
                <th>Business Name</th>
                <th>Owner Name</th>
                <th>Website</th>
                <th>Phone Number</th>
                <th>Email Address</th>
                <th>Address / Location</th>
                {hasNotes && <th>Comments / Notes</th>}
                {hasAssigned && <th>Assigned To</th>}
                <th>Result</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={`${row.excel_row || index}-${index}`}
                  className={row.valid ? "row-valid" : "row-invalid"}
                >
                  <td>{row.excel_row || index + 1}</td>

                  <td>
                    <strong>{row.deal_organization || row.deal_name || "—"}</strong>
                  </td>

                  <td>{row.deal_owner || "—"}</td>

                  <td>
                    {row.website ? (
                      <span style={{ color: "#2563eb", wordBreak: "break-all" }}>{row.website}</span>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>{row.customer_number || "—"}</td>

                  <td>{row.customer_email || "—"}</td>

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
                        <span style={{ fontSize: "12px", color: "#b45309", background: "#fef3c7", padding: "2px 6px", borderRadius: "4px" }} title="User not found in CRM">
                          ⚠️ {row.assigned_user} (Not found)
                        </span>
                      ) : (
                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>Unassigned</span>
                      )}
                    </td>
                  )}

                  <td>
                    {row.valid ? (
                      <span className="import-valid">✓ Valid</span>
                    ) : (
                      <div>
                        <span className="import-invalid">✕ Invalid</span>
                        {row.errors?.length > 0 && (
                          <div className="import-errors">
                            {row.errors.map((error, errorIndex) => (
                              <div key={errorIndex}>{error}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
        <div className="import-preview-footer">
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
            disabled={isImporting || validRows.length === 0}
          >
            {isImporting
              ? (importProgress || "Importing...")
              : `Import ${validRows.length} Leads`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DealImportPreview;