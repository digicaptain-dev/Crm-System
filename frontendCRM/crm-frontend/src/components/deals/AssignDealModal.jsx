import {
  useEffect,
  useState,
} from "react";

import api from "../../services/api";

import "../../styles/deals/assign-deal-modal.css";

function AssignDealModal({
  selectedDealIds = [],
  onClose,
  onAssigned,
}) {
  const [users, setUsers] =
    useState([]);

  const [selectedUser, setSelectedUser] =
    useState("");

  const [loadingUsers, setLoadingUsers] =
    useState(true);

  const [assigning, setAssigning] =
    useState(false);

  // =====================================================
  // ROLE CHECK
  // =====================================================

  let currentUser = null;

  try {
    currentUser = JSON.parse(
      localStorage.getItem("user")
    );
  } catch (error) {
    console.error(
      "Failed to read logged-in user:",
      error
    );
  }

  const isAdmin =
    currentUser?.role === "admin";

  // =====================================================
  // FETCH USERS
  // =====================================================

  useEffect(() => {
    /*
     * Do not fetch employees for normal users.
     */

    if (!isAdmin) {
      setUsers([]);
      setLoadingUsers(false);
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);

        const response =
          await api.get(
            "/users"
          );

        console.log(
          "Assign modal users:",
          response.data
        );

        const fetchedUsers =
          response.data?.users ||
          [];

        setUsers(
          Array.isArray(
            fetchedUsers
          )
            ? fetchedUsers
            : []
        );
      } catch (error) {
        console.error(
          "Failed to fetch users:",
          error
        );

        alert(
          error.response?.data
            ?.message ||
            "Failed to load users."
        );
      } finally {
        setLoadingUsers(
          false
        );
      }
    };

    fetchUsers();
  }, [isAdmin]);

  // =====================================================
  // ASSIGN DEALS
  // =====================================================

  const handleAssign =
    async () => {
      /*
       * Permission guard.
       */

      if (!isAdmin) {
        alert(
          "You do not have permission to assign deals."
        );
        return;
      }

      if (!selectedUser) {
        alert(
          "Please select a user."
        );
        return;
      }

      if (
        !Array.isArray(
          selectedDealIds
        ) ||
        selectedDealIds.length ===
          0
      ) {
        alert(
          "No deals selected."
        );
        return;
      }

      try {
        setAssigning(true);

        const response =
          await api.put(
            "/deals/assign",
            {
              deal_ids:
                selectedDealIds,
              user_id:
                selectedUser,
            }
          );

        console.log(
          "Assign response:",
          response.data
        );

        if (
          !response.data?.success
        ) {
          throw new Error(
            response.data?.message ||
              "Failed to assign deals."
          );
        }

        alert(
          response.data?.message ||
            "Deals assigned successfully."
        );

        if (onAssigned) {
          await onAssigned();
        }

        onClose();
      } catch (error) {
        console.error(
          "Assign deals error:",
          error
        );

        alert(
          error.response?.data
            ?.message ||
            error.response?.data
              ?.error ||
            error.message ||
            "Failed to assign deals."
        );
      } finally {
        setAssigning(false);
      }
    };

  // =====================================================
  // EXTRA SAFETY
  // =====================================================

  /*
   * Deals.jsx already prevents this modal from being
   * rendered for normal users.
   *
   * This is an additional protection.
   */

  if (!isAdmin) {
    return null;
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="modal-overlay">

      <div className="modal assign-deal-modal">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="modal-header">

          <div>

            <h2>
              Assign Deals
            </h2>

            <p>
              {
                selectedDealIds.length
              }{" "}
              {selectedDealIds.length ===
              1
                ? "deal"
                : "deals"}{" "}
              selected
            </p>

          </div>

          <button
            type="button"
            className="modal-close"
            onClick={
              onClose
            }
            disabled={
              assigning
            }
          >
            ×
          </button>

        </div>

        {/* =================================================
            BODY
        ================================================= */}

        <div className="modal-body">

          <div className="assign-info-box">

            You are assigning{" "}

            <strong>
              {
                selectedDealIds.length
              }
            </strong>{" "}

            {selectedDealIds.length ===
            1
              ? "deal"
              : "deals"}{" "}
            to a team member.

          </div>

          <label htmlFor="assign-user">
            Assign to
          </label>

          {/* LOADING */}

          {loadingUsers ? (

            <div className="assign-loading">
              Loading users...
            </div>

          ) : users.length ===
            0 ? (

            <div className="assign-empty">
              No users available.
            </div>

          ) : (

            <select
              id="assign-user"
              value={
                selectedUser
              }
              onChange={(e) =>
                setSelectedUser(
                  e.target.value
                )
              }
              disabled={
                assigning
              }
            >

              <option value="">
                Select employee
              </option>

              {users.map(
                (user) => (
                  <option
                    key={
                      user.user_id
                    }
                    value={
                      user.user_id
                    }
                  >
                    {
                      user.name
                    }{" "}
                    —{" "}
                    {
                      user.email
                    }
                  </option>
                )
              )}

            </select>

          )}

        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="modal-footer">

          <button
            type="button"
            className="secondary-button"
            onClick={
              onClose
            }
            disabled={
              assigning
            }
          >
            Cancel
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={
              handleAssign
            }
            disabled={
              assigning ||
              loadingUsers ||
              !selectedUser
            }
          >
            {assigning
              ? "Assigning..."
              : "Assign Deals"}
          </button>

        </div>

      </div>

    </div>
  );
}

export default AssignDealModal;