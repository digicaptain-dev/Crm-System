import "../../styles/deals/deal-import-preview.css";

function DealImportPreview({
  preview,
  importing,
  onClose,
  onImport,
}) {
  const rows = preview?.rows || [];

  const validRows = rows.filter((row) => row.valid);
  const invalidRows = rows.filter((row) => !row.valid);

  return (
    <div className="modal-overlay">
      <div className="import-preview-modal" style={{ maxWidth: "980px" }}>
        {/* HEADER */}
        <div className="import-preview-header">
          <div>
            <h2>Import Leads & Deals</h2>
            <p>Review validated Excel / CSV data before importing into your pipeline.</p>
          </div>

          <button
            className="modal-close"
            onClick={onClose}
            disabled={importing}
          >
            ×
          </button>
        </div>

        {/* SUMMARY */}
        <div className="import-summary">
          <div className="import-summary-card">
            <strong>{preview?.total || 0}</strong>
            <span>Total Rows</span>
          </div>

          <div className="import-summary-card valid">
            <strong>{preview?.valid || 0}</strong>
            <span>Valid Rows</span>
          </div>

          <div className="import-summary-card invalid">
            <strong>{preview?.invalid || 0}</strong>
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
                <th>Pipeline / Stage</th>
                <th>Result</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={`${row.excel_row}-${index}`}
                  className={row.valid ? "row-valid" : "row-invalid"}
                >
                  <td>{row.excel_row}</td>

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

                  <td>
                    <span style={{ fontSize: "12px" }}>
                      {row.pipeline || "Default"} / {row.stage || "Stage 1"}
                    </span>
                  </td>

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
            disabled={importing}
          >
            Cancel
          </button>

          <button
            className="primary-button"
            onClick={onImport}
            disabled={importing || validRows.length === 0}
          >
            {importing
              ? "Importing..."
              : `Import ${validRows.length} Leads`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DealImportPreview;