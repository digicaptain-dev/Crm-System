import "../../styles/deals/deal-import-preview.css";

function DealImportPreview({
  preview,
  importing,
  onClose,
  onImport,
}) {
  const rows = preview?.rows || [];

  const validRows =
    rows.filter(
      (row) => row.valid
    );

  const invalidRows =
    rows.filter(
      (row) => !row.valid
    );

  return (
    <div className="modal-overlay">

      <div className="import-preview-modal">

        {/* HEADER */}

        <div className="import-preview-header">

          <div>
            <h2>
              Import Deals
            </h2>

            <p>
              Review your Excel data
              before importing.
            </p>
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
            <strong>
              {preview?.total || 0}
            </strong>

            <span>
              Total
            </span>
          </div>

          <div className="import-summary-card valid">
            <strong>
              {preview?.valid || 0}
            </strong>

            <span>
              Valid
            </span>
          </div>

          <div className="import-summary-card invalid">
            <strong>
              {preview?.invalid || 0}
            </strong>

            <span>
              Invalid
            </span>
          </div>

        </div>

        {/* TABLE */}

        <div className="import-preview-table-wrapper">

          <table className="import-preview-table">

            <thead>

              <tr>
                <th>Row</th>
                <th>Deal Name</th>
                <th>Owner</th>
                <th>Pipeline</th>
                <th>Stage</th>
                <th>Value</th>
                <th>Status</th>
                <th>Result</th>
              </tr>

            </thead>

            <tbody>

              {rows.map(
                (row, index) => (
                  <tr
                    key={
                      `${row.excel_row}-${index}`
                    }
                    className={
                      row.valid
                        ? "row-valid"
                        : "row-invalid"
                    }
                  >

                    <td>
                      {row.excel_row}
                    </td>

                    <td>
                      {row.deal_name ||
                        "-"}
                    </td>

                    <td>
                      {row.deal_owner ||
                        "-"}
                    </td>

                    <td>
                      {row.pipeline ||
                        "-"}
                    </td>

                    <td>
                      {row.stage ||
                        "-"}
                    </td>

                    <td>
                      {row.deal_value ??
                        "-"}
                    </td>

                    <td>
                      {row.deal_status ||
                        "Open"}
                    </td>

                    <td>

                      {row.valid ? (

                        <span className="import-valid">
                          ✓ Valid
                        </span>

                      ) : (

                        <div>

                          <span className="import-invalid">
                            ✕ Invalid
                          </span>

                          {row.errors?.length >
                            0 && (

                            <div className="import-errors">

                              {row.errors.map(
                                (
                                  error,
                                  errorIndex
                                ) => (
                                  <div
                                    key={
                                      errorIndex
                                    }
                                  >
                                    {error}
                                  </div>
                                )
                              )}

                            </div>

                          )}

                        </div>

                      )}

                    </td>

                  </tr>
                )
              )}

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
            disabled={
              importing ||
              validRows.length === 0
            }
          >
            {importing
              ? "Importing..."
              : `Import ${validRows.length} Deals`}
          </button>

        </div>

      </div>

    </div>
  );
}

export default DealImportPreview;