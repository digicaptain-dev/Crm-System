import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import "../../styles/deals/deal-table.css";

function DealTable({
  deals = [],
  selectedDeals = [],
  onSelectDeal,
  onSelectAll,
  onAssignDeal,

  // Pagination props
  currentPage = 1,
  totalPages = 1,
  onPageChange,

  // Permission
  canAssign = false,
}) {
  const navigate = useNavigate();

  const selectAllRef =
    useRef(null);

  // =====================================================
  // SELECTION
  // =====================================================

  const allSelected =
    deals.length > 0 &&
    deals.every((deal) =>
      selectedDeals.includes(
        deal.deal_id
      )
    );

  const someSelected =
    deals.some((deal) =>
      selectedDeals.includes(
        deal.deal_id
      )
    ) && !allSelected;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        someSelected;
    }
  }, [someSelected]);

  // =====================================================
  // OPEN DEAL
  // =====================================================

  const openDeal = (deal) => {
    if (!deal?.deal_id) {
      console.error(
        "Deal ID missing:",
        deal
      );
      return;
    }

    navigate(
      `/deal/${deal.deal_id}`
    );
  };

  // =====================================================
  // FORMAT VALUE
  // =====================================================

  const formatValue = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "-";
    }

    const numericValue =
      Number(value);

    return Number.isNaN(
      numericValue
    )
      ? "-"
      : `$${numericValue.toLocaleString()}`;
  };

  // =====================================================
  // HELPERS
  // =====================================================

  const getPipelineName = (
    deal
  ) =>
    deal.pipeline_name ||
    deal.pipeline_id ||
    "-";

  const getStageName = (
    deal
  ) =>
    deal.stage_name ||
    deal.deal_stage ||
    "-";

  const getOwner = (deal) =>
    deal.owner_name ||
    deal.deal_owner ||
    "Unassigned";

  const getAssignedUser = (
    deal
  ) =>
    deal.assigned_user_name ||
    "Unassigned";

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="deal-table-wrapper">

      <table className="deal-table">

        <thead>

          <tr>

            {/* SELECT CHECKBOX */}

            <th className="deal-checkbox-column">

              {canAssign && (
                <input
                  ref={selectAllRef}
                  type="checkbox"
                  checked={
                    allSelected
                  }
                  onChange={(e) =>
                    onSelectAll(
                      e.target.checked
                    )
                  }
                  onClick={(e) =>
                    e.stopPropagation()
                  }
                />
              )}

            </th>

            <th>Deal</th>
            <th>Organization</th>
            <th>Email</th>
            <th>Value</th>
            <th>Pipeline</th>
            <th>Stage</th>
            <th>Owner</th>
            <th>Assigned To</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Actions</th>

          </tr>

        </thead>

        <tbody>

          {deals.map((deal) => {

            const isSelected =
              selectedDeals.includes(
                deal.deal_id
              );

            const isUnassigned =
              !deal.assign_to;

            return (
              <tr
                key={
                  deal.deal_id
                }
                className={
                  isSelected
                    ? "deal-row-selected"
                    : ""
                }
                onClick={() =>
                  openDeal(deal)
                }
              >

                {/* CHECKBOX */}

                <td>

                  {canAssign && (
                    <input
                      type="checkbox"
                      checked={
                        isSelected
                      }
                      onChange={() =>
                        onSelectDeal(
                          deal.deal_id
                        )
                      }
                      onClick={(e) =>
                        e.stopPropagation()
                      }
                    />
                  )}

                </td>

                {/* DEAL */}

                <td className="deal-table-name">
                  {deal.deal_name ||
                    "Untitled Deal"}
                </td>

                {/* ORGANIZATION */}

                <td>
                  {deal.deal_organization ||
                    "-"}
                </td>

                {/* EMAIL */}

                <td>
                  {deal.customer_email ||
                    "-"}
                </td>

                {/* VALUE */}

                <td>
                  {formatValue(
                    deal.deal_value
                  )}
                </td>

                {/* PIPELINE */}

                <td>
                  {getPipelineName(
                    deal
                  )}
                </td>

                {/* STAGE */}

                <td>
                  {getStageName(
                    deal
                  )}
                </td>

                {/* OWNER */}

                <td>
                  {getOwner(
                    deal
                  )}
                </td>

                {/* ASSIGNED TO */}

                <td>

                  <span
                    className={
                      isUnassigned
                        ? "assigned-user unassigned"
                        : "assigned-user"
                    }
                  >
                    {getAssignedUser(
                      deal
                    )}
                  </span>

                </td>

                {/* PRIORITY */}

                <td>

                  <span
                    className={`table-priority ${(
                      deal.deal_priority ||
                      "Medium"
                    ).toLowerCase()}`}
                  >
                    {deal.deal_priority ||
                      "Medium"}
                  </span>

                </td>

                {/* STATUS */}

                <td>

                  <span
                    className={`table-status ${(
                      deal.deal_status ||
                      "Open"
                    )
                      .toLowerCase()
                      .replace(
                        /\s+/g,
                        "-"
                      )}`}
                  >
                    {deal.deal_status ||
                      "Open"}
                  </span>

                </td>

                {/* ACTIONS */}

                <td>

                  <div className="deal-table-actions">

                    {/* ASSIGN - ADMIN ONLY */}

                    {canAssign &&
                      isUnassigned &&
                      onAssignDeal && (
                        <button
                          type="button"
                          className="table-action table-action-assign"
                          onClick={(
                            e
                          ) => {
                            e.stopPropagation();

                            onAssignDeal(
                              deal.deal_id
                            );
                          }}
                        >
                          Assign
                        </button>
                      )}

                    {/* VIEW */}

                    <button
                      type="button"
                      className="table-action"
                      onClick={(
                        e
                      ) => {
                        e.stopPropagation();

                        openDeal(
                          deal
                        );
                      }}
                    >
                      View
                    </button>

                  </div>

                </td>

              </tr>
            );
          })}

        </tbody>

      </table>

      {/* =================================================
          PAGINATION
      ================================================= */}

      {totalPages > 1 && (
        <div
          className="pagination-container"
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            padding: "16px",
            borderTop:
              "1px solid #e5e7eb",
          }}
        >

          <button
            type="button"
            disabled={
              currentPage === 1
            }
            onClick={() =>
              onPageChange?.(
                currentPage - 1
              )
            }
            style={{
              padding:
                "6px 12px",
              cursor:
                currentPage === 1
                  ? "not-allowed"
                  : "pointer",
              opacity:
                currentPage === 1
                  ? 0.5
                  : 1,
            }}
          >
            Previous
          </button>

          <span>
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
            disabled={
              currentPage ===
              totalPages
            }
            onClick={() =>
              onPageChange?.(
                currentPage + 1
              )
            }
            style={{
              padding:
                "6px 12px",
              cursor:
                currentPage ===
                totalPages
                  ? "not-allowed"
                  : "pointer",
              opacity:
                currentPage ===
                totalPages
                  ? 0.5
                  : 1,
            }}
          >
            Next
          </button>

        </div>
      )}

    </div>
  );
}

export default DealTable;