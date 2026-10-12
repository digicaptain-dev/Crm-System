import {
  useEffect,
  useState,
} from "react";

import api from "../../services/api";

import "../../styles/deals/assign-deal-modal.css";

function AssignDealModal({
  selectedDealIds = [],
  dealIds = [],
  pipelines = [],
  onClose,
  onAssigned,
}) {
  const dealsToAssign =
    Array.isArray(selectedDealIds) && selectedDealIds.length > 0
      ? selectedDealIds
      : Array.isArray(dealIds)
      ? dealIds
      : [];

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [pipelineList, setPipelineList] = useState(pipelines || []);
  const [selectedStage, setSelectedStage] = useState("");

  const [loadingUsers, setLoadingUsers] = useState(true);
  const [assigning, setAssigning] = useState(false);

  // =====================================================
  // ROLE CHECK
  // =====================================================

  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem("user"));
  } catch (error) {
    console.error("Failed to read logged-in user:", error);
  }

  const isAdmin = currentUser?.role === "admin";

  // =====================================================
  // FETCH USERS
  // =====================================================

  useEffect(() => {
    if (!isAdmin) {
      setUsers([]);
      setLoadingUsers(false);
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const response = await api.get("/users");
        const fetchedUsers = response.data?.users || [];
        setUsers(Array.isArray(fetchedUsers) ? fetchedUsers : []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        alert(error.response?.data?.message || "Failed to load users.");
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [isAdmin]);

  // =====================================================
  // FETCH PIPELINES (If not passed as props)
  // =====================================================

  useEffect(() => {
    if (Array.isArray(pipelines) && pipelines.length > 0) {
      setPipelineList(pipelines);
      return;
    }

    const fetchPipelines = async () => {
      try {
        const response = await api.get("/pipelines");
        const list = Array.isArray(response.data)
          ? response.data
          : response.data?.pipelines || [];
        setPipelineList(list);
      } catch (err) {
        console.warn("Failed to fetch pipelines for assign modal:", err);
      }
    };

    fetchPipelines();
  }, [pipelines]);

  // =====================================================
  // ASSIGN DEALS
  // =====================================================

  const handleAssign = async () => {
    if (!isAdmin) {
      alert("You do not have permission to assign deals.");
      return;
    }

    if (!selectedUser) {
      alert("Please select a user.");
      return;
    }

    if (!Array.isArray(dealsToAssign) || dealsToAssign.length === 0) {
      alert("No deals selected.");
      return;
    }

    try {
      setAssigning(true);

      const payload = {
        deal_ids: dealsToAssign,
        user_id: selectedUser,
      };

      if (selectedStage) {
        payload.stage_id = selectedStage;
      }

      const response = await api.put("/deals/assign", payload);

      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to assign deals.");
      }

      alert(response.data?.message || "Deals assigned successfully.");

      if (onAssigned) {
        await onAssigned();
      }

      onClose();
    } catch (error) {
      console.error("Assign deals error:", error);
      alert(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to assign deals."
      );
    } finally {
      setAssigning(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  // Flatten stages if only 1 pipeline exists
  const hasMultiplePipelines = pipelineList.length > 1;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="modal-overlay">
      <div className="modal assign-deal-modal">
        {/* HEADER */}
        <div className="modal-header">
          <div>
            <h2>Assign Deals</h2>
            <p>
              {dealsToAssign.length} {dealsToAssign.length === 1 ? "deal" : "deals"} selected
            </p>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            disabled={assigning}
          >
            ×
          </button>
        </div>

        {/* BODY */}
        <div className="modal-body">
          <div className="assign-info-box">
            You are assigning <strong>{dealsToAssign.length}</strong>{" "}
            {dealsToAssign.length === 1 ? "deal" : "deals"} to a team member.
          </div>

          {/* ASSIGN TO USER */}
          <div className="assign-field-group">
            <label htmlFor="assign-user">Assign to</label>
            {loadingUsers ? (
              <div className="assign-loading">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="assign-empty">No users available.</div>
            ) : (
              <select
                id="assign-user"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                disabled={assigning}
              >
                <option value="">Select employee</option>
                {users.map((user) => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.name} — {user.email}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* SELECT STAGE */}
          <div className="assign-field-group" style={{ marginTop: "18px" }}>
            <label htmlFor="assign-stage">
              Select stage <span className="assign-optional-badge">(Optional)</span>
            </label>
            <select
              id="assign-stage"
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              disabled={assigning}
            >
              <option value="">Keep current stage</option>
              {hasMultiplePipelines ? (
                pipelineList.map((pipeline) => (
                  <optgroup key={pipeline.pipeline_id} label={pipeline.pipeline_name}>
                    {(pipeline.stages || [])
                      .slice()
                      .sort((a, b) => Number(a.stage_order || 0) - Number(b.stage_order || 0))
                      .map((st) => (
                        <option key={st.stage_id} value={st.stage_id}>
                          {st.stage_name}
                        </option>
                      ))}
                  </optgroup>
                ))
              ) : (
                (pipelineList[0]?.stages || [])
                  .slice()
                  .sort((a, b) => Number(a.stage_order || 0) - Number(b.stage_order || 0))
                  .map((st) => (
                    <option key={st.stage_id} value={st.stage_id}>
                      {st.stage_name}
                    </option>
                  ))
              )}
            </select>
          </div>
        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={assigning}
          >
            Cancel
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={handleAssign}
            disabled={assigning || loadingUsers || !selectedUser}
          >
            {assigning ? "Assigning..." : "Assign Deals"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignDealModal;