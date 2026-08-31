import { useState } from "react";

import "../../styles/layout/header.css";

function Header() {
  const [showMenu, setShowMenu] = useState(false);

  // Get logged-in user
  const storedUser = localStorage.getItem("user");

  let user = null;

  try {
    user = storedUser
      ? JSON.parse(storedUser)
      : null;
  } catch (error) {
    console.error("Invalid user data in localStorage:", error);
    user = null;
  }

  // User information
  const userName = user?.name || "User";
  const userRole = user?.role || "Employee";

  // Create avatar from first letter of user's name
  const avatarLetter = userName
    .charAt(0)
    .toUpperCase();

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

        <button
          className="mobile-menu-button"
          type="button"
        >
          ☰
        </button>

        <div className="header-title">
          CRM
        </div>

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
            onClick={() =>
              setShowMenu(!showMenu)
            }
          >

            {/* Avatar */}
            <div className="profile-avatar">
              {avatarLetter}
            </div>

            {/* User Info */}
            <div className="profile-info">

              <span className="profile-name">
                {userName}
              </span>

              <span className="profile-role">
                {userRole}
              </span>

            </div>

            <span className="profile-arrow">
              ▼
            </span>

          </button>

          {/* Dropdown */}
          {showMenu && (
            <div className="profile-menu">

              <button type="button">
                Profile
              </button>

              <button type="button">
                Settings
              </button>

              <button
                type="button"
                onClick={handleLogout}
              >
                Logout
              </button>

            </div>
          )}

        </div>

      </div>

    </header>
  );
}

export default Header;