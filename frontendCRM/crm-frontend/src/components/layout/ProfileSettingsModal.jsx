import React, { useState, useEffect } from "react";
import api from "../../services/api";
import "../../styles/layout/profile-settings-modal.css";

function ProfileSettingsModal({ isOpen, onClose, initialTab = "profile", onUserUpdated }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [alert, setAlert] = useState(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    user_id: "",
    name: "",
    email: "",
    role: "user",
    company_name: "My Company",
    created_at: "",
  });

  // Security Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setAlert(null);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Load initial cached user
      try {
        const cached = JSON.parse(localStorage.getItem("user") || "{}");
        if (cached?.user_id) {
          setProfileForm({
            user_id: cached.user_id || "",
            name: cached.name || "",
            email: cached.email || "",
            role: cached.role || "user",
            company_name: cached.company_name || "My Company",
            created_at: cached.created_at || "",
          });
        }
      } catch (err) {
        console.error("Failed to parse cached user:", err);
      }

      // Fetch fresh user profile from backend
      fetchUserProfile();
    }
  }, [isOpen, initialTab]);

  const fetchUserProfile = async () => {
    try {
      setFetching(true);
      const res = await api.get("/users/me");
      if (res.data?.success && res.data?.user) {
        const u = res.data.user;
        setProfileForm({
          user_id: u.user_id,
          name: u.name || "",
          email: u.email || "",
          role: u.role || "user",
          company_name: u.company_name || "My Company",
          created_at: u.created_at || "",
        });
      }
    } catch (err) {
      console.warn("Could not fetch fresh profile, using local state:", err.message);
    } finally {
      setFetching(false);
    }
  };

  if (!isOpen) return null;

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!profileForm.name.trim()) {
      setAlert({ type: "error", message: "Please enter your name." });
      return;
    }
    if (!profileForm.email.trim()) {
      setAlert({ type: "error", message: "Please enter your email." });
      return;
    }

    try {
      setLoading(true);
      const res = await api.put("/users/me/profile", {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        company_name: profileForm.company_name.trim(),
      });

      if (res.data?.success) {
        const updatedUser = res.data.user;
        // Update localStorage
        localStorage.setItem("user", JSON.stringify(updatedUser));
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
        }

        // Notify parent and window event
        if (onUserUpdated) onUserUpdated(updatedUser);
        window.dispatchEvent(new Event("userUpdated"));

        setAlert({ type: "success", message: "Profile updated successfully!" });
      } else {
        setAlert({ type: "error", message: res.data?.message || "Failed to update profile." });
      }
    } catch (err) {
      setAlert({
        type: "error",
        message: err.response?.data?.message || err.message || "Failed to update profile.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkspace = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!profileForm.company_name.trim()) {
      setAlert({ type: "error", message: "Company name cannot be empty." });
      return;
    }

    try {
      setLoading(true);
      const res = await api.put("/users/me/workspace", {
        company_name: profileForm.company_name.trim(),
      });

      if (res.data?.success) {
        const updatedUser = res.data.user;
        localStorage.setItem("user", JSON.stringify(updatedUser));

        if (onUserUpdated) onUserUpdated(updatedUser);
        window.dispatchEvent(new Event("userUpdated"));

        setAlert({ type: "success", message: "Workspace & company name updated successfully!" });
      } else {
        setAlert({ type: "error", message: res.data?.message || "Failed to update company name." });
      }
    } catch (err) {
      setAlert({
        type: "error",
        message: err.response?.data?.message || err.message || "Failed to update workspace.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setAlert(null);

    if (!passwordForm.currentPassword) {
      setAlert({ type: "error", message: "Current password is required." });
      return;
    }
    if (!passwordForm.newPassword) {
      setAlert({ type: "error", message: "New password is required." });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setAlert({ type: "error", message: "New password must be at least 6 characters long." });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setAlert({ type: "error", message: "New password and confirmation do not match." });
      return;
    }

    try {
      setLoading(true);
      const res = await api.put("/users/me/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (res.data?.success) {
        setAlert({ type: "success", message: "Password updated successfully!" });
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setAlert({ type: "error", message: res.data?.message || "Failed to update password." });
      }
    } catch (err) {
      setAlert({
        type: "error",
        message: err.response?.data?.message || err.message || "Failed to update password.",
      });
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = profileForm.role === "admin";

  const roleLabel =
    profileForm.role === "admin"
      ? "Company Admin"
      : profileForm.role === "coworker"
      ? "Manager"
      : "User / Employee";

  const userInitial = (profileForm.name || "U").charAt(0).toUpperCase();

  return (
    <div className="profile-settings-overlay" onClick={onClose}>
      <div className="profile-settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ps-modal-header">
          <div className="ps-header-left">
            <div className="ps-header-avatar">{userInitial}</div>
            <div>
              <h2 className="ps-header-title">{profileForm.name || "My Account"}</h2>
              <p className="ps-header-subtitle">
                {profileForm.company_name} • {profileForm.email || "Manage your account"}
              </p>
            </div>
          </div>
          <button className="ps-close-btn" type="button" onClick={onClose} title="Close">
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="ps-tabs-nav">
          <button
            type="button"
            className={`ps-tab-btn ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("profile");
              setAlert(null);
            }}
          >
            <span>👤</span> Profile Info
          </button>
          <button
            type="button"
            className={`ps-tab-btn ${activeTab === "workspace" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("workspace");
              setAlert(null);
            }}
          >
            <span>🏢</span> Workspace & Company
          </button>
          <button
            type="button"
            className={`ps-tab-btn ${activeTab === "security" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("security");
              setAlert(null);
            }}
          >
            <span>🔒</span> Security & Password
          </button>
        </div>

        {/* Body */}
        <div className="ps-modal-body">
          {alert && (
            <div className={`ps-alert-message ${alert.type}`}>
              <span>{alert.type === "success" ? "✓" : "⚠"}</span>
              <span>{alert.message}</span>
            </div>
          )}

          {/* TAB 1: Profile */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} id="profile-form">
              <div className="ps-form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  name="name"
                  className="ps-input-field"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="ps-form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  className="ps-input-field"
                  value={profileForm.email}
                  onChange={handleProfileChange}
                  placeholder="name@company.com"
                  required
                />
              </div>

              <div className="ps-form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                  <label style={{ margin: 0 }}>Company / Organization Name</label>
                  {!isAdmin && (
                    <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: "6px" }}>
                      🔒 Managed by Admin
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  name="company_name"
                  className="ps-input-field"
                  value={profileForm.company_name}
                  onChange={handleProfileChange}
                  disabled={!isAdmin}
                  readOnly={!isAdmin}
                  style={!isAdmin ? { backgroundColor: "#f8fafc", cursor: "not-allowed", color: "#475569" } : {}}
                  placeholder="e.g. DigiCaptain Technologies"
                />
                {!isAdmin && (
                  <small style={{ color: "#94a3b8", fontSize: "11.5px", marginTop: "4px", display: "block" }}>
                    Company name is configured centrally by the Organization Admin and cannot be edited by members or managers.
                  </small>
                )}
              </div>

              <div className="ps-meta-grid">
                <div className="ps-meta-item">
                  <span className="ps-meta-label">Account Role</span>
                  <div className={`ps-role-badge ${profileForm.role}`}>
                    ● {roleLabel}
                  </div>
                </div>
                <div className="ps-meta-item">
                  <span className="ps-meta-label">User ID</span>
                  <span className="ps-meta-value" style={{ fontSize: "11px", wordBreak: "break-all" }}>
                    {profileForm.user_id || "—"}
                  </span>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: Workspace */}
          {activeTab === "workspace" && (
            <form onSubmit={handleSaveWorkspace} id="workspace-form">
              <div className="ps-workspace-card">
                <div className="ps-workspace-header">
                  <span className="ps-workspace-name">Workspace Settings</span>
                  <span className="ps-workspace-badge">● Active Organization</span>
                </div>

                {!isAdmin && (
                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "10px 14px", borderRadius: "8px", margin: "12px 0", fontSize: "12.5px", color: "#1e40af", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>🔒</span>
                    <span>Workspace and organization settings are centrally managed by your <strong>Company Admin</strong>.</span>
                  </div>
                )}

                <div className="ps-form-group" style={{ marginTop: "12px", marginBottom: "14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label style={{ margin: 0 }}>Company / Organization Name</label>
                    {!isAdmin && (
                      <span style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: "6px" }}>
                        🔒 Read-only
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    name="company_name"
                    className="ps-input-field"
                    value={profileForm.company_name}
                    onChange={handleProfileChange}
                    disabled={!isAdmin}
                    readOnly={!isAdmin}
                    style={!isAdmin ? { backgroundColor: "#f8fafc", cursor: "not-allowed", color: "#334155", fontWeight: "600" } : {}}
                    placeholder="Enter your company name"
                    required
                  />
                  <small style={{ color: "#64748b", fontSize: "12px", marginTop: "4px", display: "block" }}>
                    {isAdmin
                      ? "Updating this organization name will apply to all team members and on the sidebar."
                      : "This organization name is set centrally by your Admin."}
                  </small>
                </div>

                <div className="ps-meta-grid" style={{ marginTop: "10px" }}>
                  <div className="ps-meta-item">
                    <span className="ps-meta-label">Plan Tier</span>
                    <span className="ps-meta-value">Enterprise Cloud</span>
                  </div>
                  <div className="ps-meta-item">
                    <span className="ps-meta-label">Database Connection</span>
                    <span className="ps-meta-value" style={{ color: "#16a34a" }}>
                      ● MySQL Railway Connected
                    </span>
                  </div>
                  <div className="ps-meta-item">
                    <span className="ps-meta-label">API Status</span>
                    <span className="ps-meta-value" style={{ color: "#16a34a" }}>
                      ● Online (Port 1000)
                    </span>
                  </div>
                  <div className="ps-meta-item">
                    <span className="ps-meta-label">Owner Role</span>
                    <span className="ps-meta-value">{roleLabel}</span>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: Security */}
          {activeTab === "security" && (
            <form onSubmit={handleSavePassword} id="password-form">
              <div className="ps-form-group">
                <label>Current Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword.current ? "text" : "password"}
                    name="currentPassword"
                    className="ps-input-field"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    placeholder="Enter your current password"
                    required
                  />
                  <button
                    type="button"
                    className="btn-toggle-password"
                    onClick={() =>
                      setShowPassword((prev) => ({
                        ...prev,
                        current: !prev.current,
                      }))
                    }
                    title={showPassword.current ? "Hide password" : "Show password"}
                    tabIndex="-1"
                  >
                    {showPassword.current ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="23" x2="23" y2="1" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="ps-form-group">
                <label>New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword.new ? "text" : "password"}
                    name="newPassword"
                    className="ps-input-field"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="Minimum 6 characters"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="btn-toggle-password"
                    onClick={() =>
                      setShowPassword((prev) => ({
                        ...prev,
                        new: !prev.new,
                      }))
                    }
                    title={showPassword.new ? "Hide password" : "Show password"}
                    tabIndex="-1"
                  >
                    {showPassword.new ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="23" x2="23" y2="1" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="ps-form-group">
                <label>Confirm New Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword.confirm ? "text" : "password"}
                    name="confirmPassword"
                    className="ps-input-field"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="Re-enter new password"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="btn-toggle-password"
                    onClick={() =>
                      setShowPassword((prev) => ({
                        ...prev,
                        confirm: !prev.confirm,
                      }))
                    }
                    title={showPassword.confirm ? "Hide password" : "Show password"}
                    tabIndex="-1"
                  >
                    {showPassword.confirm ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="23" x2="23" y2="1" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="ps-modal-footer">
          <button type="button" className="ps-btn-cancel" onClick={onClose} disabled={loading}>
            Close
          </button>

          {activeTab === "profile" && (
            <button
              type="submit"
              form="profile-form"
              className="ps-btn-submit"
              disabled={loading || fetching}
            >
              {loading ? "Saving..." : "Save Profile"}
            </button>
          )}

          {activeTab === "workspace" && isAdmin && (
            <button
              type="submit"
              form="workspace-form"
              className="ps-btn-submit"
              disabled={loading || fetching}
            >
              {loading ? "Saving..." : "Save Workspace"}
            </button>
          )}

          {activeTab === "security" && (
            <button
              type="submit"
              form="password-form"
              className="ps-btn-submit"
              disabled={loading}
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfileSettingsModal;
