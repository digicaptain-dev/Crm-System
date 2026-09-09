import { useState, useEffect } from "react";
import ProfileSettingsModal from "./ProfileSettingsModal";
import "../../styles/layout/header.css";

function Header() {
  const [showMenu, setShowMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState("profile");

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleUserUpdated = () => {
      try {
        setUser(JSON.parse(localStorage.getItem("user") || "null"));
      } catch {
        setUser(null);
      }
    };

    window.addEventListener("userUpdated", handleUserUpdated);
    window.addEventListener("storage", handleUserUpdated);
    return () => {
      window.removeEventListener("userUpdated", handleUserUpdated);
      window.removeEventListener("storage", handleUserUpdated);
    };
  }, []);

  // User information
  const userName = user?.name || "User";
  const userRole =
    user?.role === "admin"
      ? "Admin"
      : user?.role === "coworker"
      ? "Manager"
      : "Employee";

  // Create avatar from first letter of user's name
  const avatarLetter = userName.charAt(0).toUpperCase();

  // Open modal helper
  const openModal = (tab) => {
    setModalTab(tab);
    setShowModal(true);
    setShowMenu(false);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <header className="app-header">
      {/* LEFT */}
      <div className="header-left">
        <button className="mobile-menu-button" type="button">
          ☰
        </button>
        <div className="header-title">CRM</div>
      </div>

      {/* RIGHT */}
      <div className="header-right">
        {/* Notifications */}
        <button
          className="header-icon-button"
          type="button"
          title="Notifications"
        >
          🔔
        </button>

        {/* Profile */}
        <div className="header-profile">
          <button
            className="profile-button"
            type="button"
            onClick={() => setShowMenu(!showMenu)}
          >
            {/* Avatar */}
            <div className="profile-avatar">{avatarLetter}</div>

            {/* User Info */}
            <div className="profile-info">
              <span className="profile-name">{userName}</span>
              <span className="profile-role">{userRole}</span>
            </div>

            <span className="profile-arrow">▼</span>
          </button>

          {/* Dropdown */}
          {showMenu && (
            <div className="profile-menu">
              <button type="button" onClick={() => openModal("profile")}>
                👤 Profile
              </button>

              <button type="button" onClick={() => openModal("security")}>
                ⚙ Settings & Security
              </button>

              <button type="button" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile & Settings Modal */}
      <ProfileSettingsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialTab={modalTab}
        onUserUpdated={(updated) => setUser(updated)}
      />
    </header>
  );
}

export default Header;