import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import Modal from "../components/common/Modal";

import "../styles/users/users.css";

// =====================================================
// ROLE HELPERS
// =====================================================

const getRoleLabel = (role) => {
  switch (role) {
    case "admin":
      return "Admin";
    case "coworker":
      return "Manager";
    case "user":
      return "Employee";
    default:
      return role || "User";
  }
};

const getRoleAvatarGradient = (role) => {
  switch (role) {
    case "admin":
      return "linear-gradient(135deg, #f59e0b, #d97706)";
    case "coworker":
      return "linear-gradient(135deg, #8b5cf6, #6366f1)";
    case "user":
    default:
      return "linear-gradient(135deg, #3b82f6, #2563eb)";
  }
};

// =====================================================
// INITIAL FORM
// =====================================================

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "user",
};

// =====================================================
// USERS PAGE
// =====================================================

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // ===================================================
  // FETCH USERS
  // ===================================================

  const fetchUsers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError("");

      const response = await api.get("/users");
      setUsers(Array.isArray(response.data?.users) ? response.data.users : []);
    } catch (err) {
      console.error("FETCH USERS ERROR:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to fetch users."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ===================================================
  // STATISTICS
  // ===================================================

  const totalUsers = users.length;
  const managerCount = users.filter((u) => u.role === "coworker").length;
  const employeeCount = users.filter((u) => u.role === "user").length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  // ===================================================
  // FILTER USERS
  // ===================================================

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Role Filter Tab
      if (activeTab === "Manager" && user.role !== "coworker") return false;
      if (activeTab === "Employee" && user.role !== "user") return false;
      if (activeTab === "Admin" && user.role !== "admin") return false;

      // Search
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = user.name?.toLowerCase().includes(q);
        const matchEmail = user.email?.toLowerCase().includes(q);
        const matchRole = getRoleLabel(user.role).toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchRole) return false;
      }

      return true;
    });
  }, [users, activeTab, search]);

  // ===================================================
  // OPEN CREATE / EDIT MODAL
  // ===================================================

  const openCreateModal = () => {
    setSelectedUser(null);
    setShowPassword(false);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setShowPassword(false);
    setForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role || "user",
    });
    setError("");
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setShowPassword(false);
    setSelectedUser(null);
    setForm(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  // ===================================================
  // CREATE / UPDATE USER
  // ===================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (selectedUser) {
        const updatePayload = {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
        };
        if (form.password && form.password.trim().length >= 6) {
          updatePayload.password = form.password.trim();
        }

        await api.put(`/users/${selectedUser.user_id}`, updatePayload);
      } else {
        await api.post("/users", {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role,
        });
      }

      closeModal();
      await fetchUsers(true);
    } catch (err) {
      console.error("SAVE USER ERROR:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          "Failed to save user."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // DELETE USER
  // ===================================================

  const deleteUser = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${user.name || user.email}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setError("");
      await api.delete(`/users/${user.user_id}`);
      await fetchUsers(true);
    } catch (err) {
      console.error("DELETE USER ERROR:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to delete user."
      );
    }
  };

  // ===================================================
  // FORMAT DATE
  // ===================================================

  const formatDate = (date) => {
    if (!date) return "-";
    try {
      const parsedDate = new Date(date);
      if (Number.isNaN(parsedDate.getTime())) return "-";
      return parsedDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  return (
    <div className="users-page">
      {/* =================================================
          TOP HEADER CARD
      ================================================= */}
      <div className="users-header-card">
        <div className="users-header-top">
          <div className="users-title-wrap">
            <h1>
              <span>Team & User Management</span>
            </h1>
            <p>
              Manage system permissions, team roles, managers, and employee access.
            </p>
          </div>

          <div className="users-header-actions">
            <button
              type="button"
              className={`btn-refresh-users ${refreshing ? "is-refreshing" : ""}`}
              onClick={() => fetchUsers(true)}
              title="Refresh Users"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
              </svg>
            </button>

            <button
              type="button"
              className="btn-add-user"
              onClick={openCreateModal}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>+ Add User</span>
            </button>
          </div>
        </div>

        {/* TOOLBAR: TABS & SEARCH */}
        <div className="users-toolbar">
          <div className="users-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch("")}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="users-filter-pills">
            <button
              type="button"
              className={`filter-pill-btn ${activeTab === "All" ? "pill-active" : ""}`}
              onClick={() => setActiveTab("All")}
            >
              All Users ({totalUsers})
            </button>
            <button
              type="button"
              className={`filter-pill-btn ${activeTab === "Manager" ? "pill-active" : ""}`}
              onClick={() => setActiveTab("Manager")}
            >
              💼 Managers ({managerCount})
            </button>
            <button
              type="button"
              className={`filter-pill-btn ${activeTab === "Employee" ? "pill-active" : ""}`}
              onClick={() => setActiveTab("Employee")}
            >
              👤 Employees ({employeeCount})
            </button>
            <button
              type="button"
              className={`filter-pill-btn ${activeTab === "Admin" ? "pill-active" : ""}`}
              onClick={() => setActiveTab("Admin")}
            >
              👑 Admins ({adminCount})
            </button>
          </div>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="user-error-banner">
          <span>⚠️ {error}</span>
          <button type="button" onClick={() => setError("")}>×</button>
        </div>
      )}

      {/* =================================================
          KPI METRIC SUMMARY CARDS
      ================================================= */}
      <div className="users-metrics-grid">
        <div className="metric-kpi-card">
          <div className="metric-info">
            <span className="metric-kpi-label">Total Team Members</span>
            <span className="metric-kpi-val">{totalUsers}</span>
          </div>
          <div className="metric-icon-box metric-icon-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
        </div>

        <div className="metric-kpi-card">
          <div className="metric-info">
            <span className="metric-kpi-label">Pipeline Managers</span>
            <span className="metric-kpi-val">{managerCount}</span>
          </div>
          <div className="metric-icon-box metric-icon-purple">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
        </div>

        <div className="metric-kpi-card">
          <div className="metric-info">
            <span className="metric-kpi-label">Sales Employees</span>
            <span className="metric-kpi-val">{employeeCount}</span>
          </div>
          <div className="metric-icon-box metric-icon-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <polyline points="17 11 19 13 23 9" />
            </svg>
          </div>
        </div>

        <div className="metric-kpi-card">
          <div className="metric-info">
            <span className="metric-kpi-label">Admins & Owners</span>
            <span className="metric-kpi-val">{adminCount}</span>
          </div>
          <div className="metric-icon-box metric-icon-amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* =================================================
          MAIN USERS TABLE CARD
      ================================================= */}
      <div className="users-main-table-card">
        {loading ? (
          <div className="users-loading-box">
            <div className="users-spinner" />
            <h3>Loading Team Directory...</h3>
            <p>Fetching members, roles, and permissions from database.</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="users-empty-box">
            <div className="users-empty-circle">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <h3>No Users Found</h3>
            <p>
              {search
                ? `No team members matched "${search}".`
                : "No team members found for this category."}
            </p>
            <button
              type="button"
              className="btn-empty-add"
              onClick={openCreateModal}
            >
              + Add First Team Member
            </button>
          </div>
        ) : (
          <div className="users-table-scroll">
            <table className="users-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Email Address</th>
                  <th>Access Role</th>
                  <th>Date Created</th>
                  <th style={{ textAlign: "right", paddingRight: "20px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const initial = (user.name || user.email || "U")
                    .charAt(0)
                    .toUpperCase();
                  const roleLabel = getRoleLabel(user.role);
                  const roleClass = (user.role || "user").toLowerCase();
                  const gradient = getRoleAvatarGradient(user.role);

                  return (
                    <tr key={user.user_id}>
                      {/* USER PROFILE */}
                      <td>
                        <div className="user-profile-cell">
                          <div
                            className="user-profile-avatar"
                            style={{ background: gradient }}
                          >
                            {initial}
                          </div>
                          <div className="user-profile-info">
                            <span className="user-profile-name">
                              {user.name || "Unnamed User"}
                            </span>
                            <span className="user-profile-sub">
                              {roleLabel} Account
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* EMAIL */}
                      <td>
                        <div className="user-email-cell">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                            <polyline points="22,6 12,13 2,6" />
                          </svg>
                          <a
                            href={`mailto:${user.email}`}
                            className="user-email-link"
                          >
                            {user.email}
                          </a>
                        </div>
                      </td>

                      {/* ROLE */}
                      <td>
                        <span className={`user-role-badge role-${roleClass}`}>
                          <span className="role-dot" />
                          <span>{roleLabel}</span>
                        </span>
                      </td>

                      {/* CREATED */}
                      <td>
                        <div className="user-date-cell">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                          </svg>
                          <span>{formatDate(user.created_at)}</span>
                        </div>
                      </td>

                      {/* ACTIONS */}
                      <td>
                        <div className="user-action-buttons">
                          <button
                            type="button"
                            className="btn-user-action edit"
                            onClick={() => openEditModal(user)}
                            title="Edit user details"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            className="btn-user-action delete"
                            onClick={() => deleteUser(user)}
                            title="Delete this user account"
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =================================================
          CREATE / EDIT USER MODAL
      ================================================= */}
      {showModal && (
        <Modal
          title={selectedUser ? "Edit Team Member" : "Add New Team Member"}
          onClose={closeModal}
        >
          <form className="user-modal-form" onSubmit={handleSubmit}>
            {/* NAME */}
            <div className="user-form-group">
              <label htmlFor="user-name-input">
                Full Name <span className="req-mark">*</span>
              </label>
              <div className="user-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  id="user-name-input"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Sarah Jenkins"
                  required
                />
              </div>
            </div>

            {/* EMAIL */}
            <div className="user-form-group">
              <label htmlFor="user-email-input">
                Email Address <span className="req-mark">*</span>
              </label>
              <div className="user-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  id="user-email-input"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. sarah@company.com"
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="user-form-group">
              <label htmlFor="user-password-input">
                {selectedUser ? "New Password (Optional)" : "Account Password"}{" "}
                {!selectedUser && <span className="req-mark">*</span>}
              </label>
              <div className="user-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input
                  id="user-password-input"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={
                    selectedUser
                      ? "Leave blank to keep existing password"
                      : "Enter secure password (min 6 chars)"
                  }
                  minLength={6}
                  required={!selectedUser}
                />
                <button
                  type="button"
                  className="btn-toggle-eye"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? "Hide password" : "Show password"}
                  tabIndex="-1"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="23" x2="23" y2="1" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* ROLE & PERMISSIONS */}
            <div className="user-form-group">
              <label htmlFor="user-role-select">
                Role & Permissions <span className="req-mark">*</span>
              </label>
              <div className="user-input-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <select
                  id="user-role-select"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                >
                  <option value="user">Employee (Individual sales rep)</option>
                  <option value="coworker">Manager (Pipeline leadership & deals)</option>
                  <option value="admin">Admin / Owner (Full system access)</option>
                </select>
              </div>

              {/* Dynamic role helper note */}
              <div className="role-preview-card">
                {form.role === "admin" && (
                  <div className="role-preview-content admin">
                    👑 <strong>Admin / Owner:</strong> Full workspace control. Can add/remove team members, assign deals, configure pipelines, and manage database.
                  </div>
                )}
                {form.role === "coworker" && (
                  <div className="role-preview-content coworker">
                    💼 <strong>Manager:</strong> Pipeline supervision. Can create & manage all deals, assign leads, track team activities, and advance stages.
                  </div>
                )}
                {form.role === "user" && (
                  <div className="role-preview-content user">
                    👤 <strong>Employee:</strong> Sales executive. Can view & update assigned leads, schedule activities, log notes, and move deals to Pool Drive.
                  </div>
                )}
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="user-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={closeModal}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn-modal-submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : selectedUser
                  ? "Update Member"
                  : "Create Member"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default Users;
