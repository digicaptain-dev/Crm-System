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

  const [loading, setLoading] = useState(false);

  const handleExecuteImport = async () => {
    if (validRows.length === 0) return;

    if (onImport) {
      return onImport(validRows);
    }

    try {
      setLoading(true);
      const res = await api.post("/deals/upload/commit", { rows: validRows });

      if (res.data?.success) {
        alert(res.data.message || `Successfully imported ${validRows.length} leads!`);
        if (onImportComplete) {
          onImportComplete();
        } else if (onClose) {
          onClose();
        }
      } else {
        alert(res.data?.message || "Failed to import leads.");
      }
    } catch (err) {
      console.error("Import error:", err);
      alert(err.response?.data?.message || "Failed to commit imported leads.");
    } finally {
      setLoading(false);
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
              ? "Importing..."
              : `Import ${validRows.length} Leads`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DealImportPreview;