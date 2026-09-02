import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import "../../styles/deals/deal-table.css";

function DealTable({
  deals,
  selectedDeals,
  onSelectDeal,
  onSelectAll,
  onAssignDeal,
}) {
  const navigate = useNavigate();
  const selectAllRef = useRef(null);

  // =====================================================
  // SELECT ALL STATE
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

  // =====================================================
  // INDETERMINATE CHECKBOX
  // =====================================================

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

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return "-";
    }

    return `$${numericValue.toLocaleString()}`;
  };

  // =====================================================
  // PIPELINE
  // =====================================================

  const getPipelineName = (deal) => {
    return (
      deal.pipeline_name ||
      deal.pipeline_id ||
      "-"
    );
  };

  // =====================================================
  // STAGE
  // =====================================================

  const getStageName = (deal) => {
    return (
      deal.stage_name ||
      deal.deal_stage ||
      "-"
    );
  };

  // =====================================================
  // OWNER
  // =====================================================

  const getOwner = (deal) => {
    return (
      deal.owner_name ||
      "Unassigned"
    );
  };

  // =====================================================
  // ASSIGNED USER
  // =====================================================

  const getAssignedUser = (deal) => {
    return (
      deal.assigned_user_name ||
      "Unassigned"
    );
  };

  return (
    <div className="deal-table-wrapper">

      <table className="deal-table">

        <thead>

          <tr>

            <th className="deal-checkbox-column">

              <input
                ref={selectAllRef}
                type="checkbox"
                checked={allSelected}
                onChange={(e) =>
                  onSelectAll(
                    e.target.checked
                  )
                }
                onClick={(e) =>
                  e.stopPropagation()
                }
              />

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
                key={deal.deal_id}
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

                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() =>
                      onSelectDeal(
                        deal.deal_id
                      )
                    }
                    onClick={(e) =>
                      e.stopPropagation()
                    }
                  />

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

                    {isUnassigned &&
                      onAssignDeal && (
                        <button
                          type="button"
                          className="table-action table-action-assign"
                          onClick={(e) => {
                            e.stopPropagation();

                            onAssignDeal(
                              deal.deal_id
                            );
                          }}
                        >
                          Assign
                        </button>
                      )}

                    <button
                      type="button"
                      className="table-action"
                      onClick={(e) => {
                        e.stopPropagation();

                        openDeal(deal);
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

    </div>
  );
}

export default DealTable;